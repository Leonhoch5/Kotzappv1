//server.js

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));
app.use(bodyParser.json());

// Directory for storing chat history
const chatHistoryDir = "./chat_history";
if (!fs.existsSync(chatHistoryDir)) {
  fs.mkdirSync(chatHistoryDir);
}

// Database setup
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT(12) UNIQUE,
            password TEXT
            role TEXT
        )`,
      (err) => {
        if (err) {
          console.error(
            "Error creating users table, maybe the username is longer than 12 ZEICHEN",
            err.message
          );
        }
      }
    );
  }
});
// Checking if user is Admin
function isAdmin(username, callback) {
  db.get(
    `SELECT role FROM users WHERE username = ?`,
    [username],
    (err, row) => {
      if (err) {
        console.error("Error fetching role:", err.message);
        return callback(false); // Return false if an error occurs
      }
      callback(row && row.role === "admin"); // Return true if the role is admin
      console.log(username, "is admin")
    }
  );
}

// Register route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, hashedPassword],
    function (err) {
      if (err) {
        if (err.code === "SQLITE_CONSTRAINT") {
          res
            .status(400)
            .send({ success: false, message: "Username already taken" });
        } else {
          res
            .status(500)
            .send({ success: false, message: "Error registering user" });
        }
        return;
      }
      res.send({ success: true, message: "Registration successful" });
    }
  );
});

// Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, row) => {
      if (err) {
        res.status(500).send({ success: false, message: "Error during login" });
        return;
      }

      if (row && (await bcrypt.compare(password, row.password))) {
        res.send({ success: true, message: "Login successful" });
      } else if (row.password === "") {
        res
          .status(403)
          .send({ success: false, message: "Your account is banned." });
      } else {
        res
          .status(401)
          .send({ success: false, message: "Invalid username or password" });
      }
    }
  );
});

// Change Password route
app.post("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, row) => {
      if (err) {
        res
          .status(500)
          .send({ success: false, message: "Error fetching user" });
        return;
      }

      if (row && (await bcrypt.compare(oldPassword, row.password))) {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        db.run(
          `UPDATE users SET password = ? WHERE username = ?`,
          [hashedNewPassword, username],
          function (err) {
            if (err) {
              res
                .status(500)
                .send({ success: false, message: "Error updating password" });
            } else {
              res.send({
                success: true,
                message: "Password changed successfully.",
              });
            }
          }
        );
      } else {
        res
          .status(401)
          .send({ success: false, message: "Old password is incorrect" });
      }
    }
  );
});
// Change Username Route
app.post("/change-username", async (req, res) => {
  const { currentUsername, newUsername, password } = req.body;

  // Ensure no empty fields
  if (!currentUsername || !newUsername || !password) {
    return res
      .status(400)
      .send({ success: false, message: "Please provide all fields." });
  }

  // Check if the new username is already taken
  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [newUsername],
    (err, row) => {
      if (err) {
        return res
          .status(500)
          .send({ success: false, message: "Error checking new username." });
      }

      if (row) {
        return res
          .status(400)
          .send({ success: false, message: "Username is already taken." });
      }

      // Now verify the current password
      db.get(
        `SELECT * FROM users WHERE username = ?`,
        [currentUsername],
        async (err, user) => {
          if (err) {
            return res.status(500).send({
              success: false,
              message: "Error fetching user details.",
            });
          }

          if (!user || !(await bcrypt.compare(password, user.password))) {
            return res
              .status(401)
              .send({ success: false, message: "Incorrect password." });
          }

          // Update the username if password is correct
          db.run(
            `UPDATE users SET username = ? WHERE username = ?`,
            [newUsername, currentUsername],
            function (err) {
              if (err) {
                return res.status(500).send({
                  success: false,
                  message: "Error updating username.",
                });
              }

              return res.send({
                success: true,
                message: "Username updated successfully.",
              });
            }
          );
        }
      );
    }
  );
});

// WebSocket connection handling
const lobbies = {};

wss.on("connection", (ws) => {
  let currentLobby = null;
  let username = null;

  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message);
    console.log("Received message:", parsedMessage);

    if (parsedMessage.type === "join") {
      currentLobby = parsedMessage.lobby;
      username = parsedMessage.username;

      // Initialize lobby if it doesn't exist
      if (!lobbies[currentLobby]) {
        lobbies[currentLobby] = new Set();
      }
      lobbies[currentLobby].add({ ws, username });

      sendChatHistory(ws, currentLobby);
      broadcastOnlineUsers(currentLobby);

      console.log(`Client ${username} joined lobby: ${currentLobby}`);
    } else if (parsedMessage.type === "message" && currentLobby) {
      // Handle admin commands
      if (username === "root" && parsedMessage.message.startsWith("/")) {
        handleAdminCommand(parsedMessage.message, currentLobby);
      } else {
        const timestamp = new Date().toISOString();
        const fullMessage = {
          id: parsedMessage.id,
          username: username,
          timestamp: timestamp,
          message: parsedMessage.message,
        };

        broadcastToLobby(fullMessage, currentLobby);
        saveToChatHistory(fullMessage, currentLobby);
      }
    } else if (parsedMessage.type === "delete" && currentLobby) {
      const messageId = parseInt(parsedMessage.id, 10);
      const timestamp = parsedMessage.timestamp; // Extract timestamp for validation

      console.log(
        `User ${username} attempting to delete message ID: ${messageId} at ${timestamp}`
      );

      // Get message by ID and timestamp for validation
      const messageToDelete = getMessageById(
        messageId,
        timestamp,
        currentLobby
      );

      // Check if the message exists
      if (!messageToDelete) {
        console.log(
          `Message with ID ${messageId} and timestamp ${timestamp} not found.`
        );
        ws.send(
          JSON.stringify({ type: "error", message: "Message not found." })
        );
        return;
      }

      const messageOwnerUsername = messageToDelete.username;

      // Allow deletion if the user is "root" or if they own the message
      if (username === "root" || messageOwnerUsername === username) {
        console.log(
          `User ${username} is deleting message ID: ${messageId} from ${messageOwnerUsername}.`
        );
        if (deleteMessageFromFile(messageId, timestamp, currentLobby)) {
          console.log(`Message ID: ${messageId} deleted successfully.`);
          broadcastToLobby(
            { type: "delete", id: messageId, timestamp: timestamp },
            currentLobby
          );
        } else {
          console.log(`Failed to delete message ID: ${messageId} from file.`);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Failed to delete the message from file.",
            })
          );
        }
      } else {
        // Access denied for other users
        console.log(
          `User ${username} is not allowed to delete message ID: ${messageId}.`
        );
        ws.send(
          JSON.stringify({
            type: "error",
            message: "You can only delete your own messages.",
          })
        );
      }
    }
  });

  function getMessageById(messageId, timestamp, lobby) {
    const chatHistoryFile = path.join(chatHistoryDir, `${lobby}.json`);
    if (fs.existsSync(chatHistoryFile)) {
      const chatHistory = JSON.parse(fs.readFileSync(chatHistoryFile, "utf-8"));
      // Find the message that matches both the id and timestamp
      return chatHistory.find(
        (msg) => msg.id === messageId && msg.timestamp === timestamp
      );
    }
    return null;
  }

  ws.on("close", () => {
    if (currentLobby && lobbies[currentLobby]) {
      lobbies[currentLobby] = new Set(
        [...lobbies[currentLobby]].filter((client) => client.ws !== ws)
      );
      broadcastOnlineUsers(currentLobby);
    }
  });

  function broadcastOnlineUsers(lobby) {
    const onlineUsers = [...lobbies[lobby]].map((client) => client.username);
    const message = JSON.stringify({ type: "onlineUsers", users: onlineUsers });
    lobbies[lobby].forEach((client) => client.ws.send(message));
  }

  function sendChatHistory(client, lobby) {
    const chatHistoryFile = path.join(chatHistoryDir, `${lobby}.json`);
    const chatHistory = fs.existsSync(chatHistoryFile)
      ? JSON.parse(fs.readFileSync(chatHistoryFile, "utf-8"))
      : [];

    client.send(JSON.stringify({ type: "chatHistory", messages: chatHistory }));
  }

  // Handle admin commands
  function handleAdminCommand(command, lobby) {
    const args = command.split(" ");
    const action = args[0];

    switch (action) {
      case "/clear":
        clearChatHistory(lobby);
        break;
      case "/kick":
        if (args[1]) {
          kickUserFromLobby(args[1], lobby);
        }
        break;
      case "/ban":
        if (args[1]) {
          banUser(args[1]);
        }
        break;
      case "/delete":
        if (args[1]) {
          const target = args[1];
          if (!isNaN(parseInt(target))) {
            const messageId = parseInt(target, 10);
            deleteMessage(messageId, lobby);
          } else {
            deleteMessagesByUsername(target, lobby);
          }
        }
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: "Unknown command" }));
    }
  }
  function clearChatHistory(lobby) {
    const chatHistoryFile = path.join(chatHistoryDir, `${lobby}.json`);

    if (fs.existsSync(chatHistoryFile)) {
      fs.unlinkSync(chatHistoryFile);
      console.log(
        `Chat history for lobby '${lobby}' has been cleared by root.`
      );
      // Broadcast clear message to all clients in the lobby
      broadcastToLobby({ type: "clear" }, lobby);
    }
  }

  function kickUserFromLobby(username, lobby) {
    if (lobbies[lobby]) {
      lobbies[lobby] = new Set(
        [...lobbies[lobby]].filter((client) => client.username !== username)
      );
      broadcastToLobby(
        { type: "system", message: `User ${username} was kicked by root.` },
        lobby
      );
    }
  }

  function banUser(username) {
  const query = `UPDATE users SET banned = 1 WHERE username = ?`;

  db.run(query, [username], function (err) {
    if (err) {
      console.error("Error banning user:", err.message);
      return;
    }
    if (this.changes > 0) {
      console.log(`User ${username} has been banned by root.`);

      // Notify the banned client
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN && client.username === username) {
          client.send(JSON.stringify({ type: "banned" }));
          setTimeout(() => client.close(), 500); // Close connection after a short delay
        }
      }
    }
  });
}


  function deleteMessage(messageId, timestamp, lobby) {
    if (deleteMessageFromFile(messageId, timestamp, lobby)) {
      broadcastToLobby({ type: "delete", id: messageId }, lobby);
      broadcastToLobby(
        { type: "system", message: `Message ${messageId} deleted by root.` },
        lobby
      );
    }
  }

  function deleteMessagesByUsername(targetUsername, lobby) {
    const chatHistoryFile = path.join(chatHistoryDir, `${lobby}.json`);
    if (fs.existsSync(chatHistoryFile)) {
      let chatHistory = JSON.parse(fs.readFileSync(chatHistoryFile, "utf-8"));

      // Log the messages being deleted for reference
      const messagesToDelete = chatHistory.filter(
        (message) => message.username === targetUsername
      );
      const messageIdsToDelete = messagesToDelete.map((message) => message.id);

      const filteredHistory = chatHistory.filter(
        (message) => message.username !== targetUsername
      );
      fs.writeFileSync(chatHistoryFile, JSON.stringify(filteredHistory));

      // Notify the lobby of the deletions
      broadcastToLobby(
        {
          type: "system",
          message: `All messages from user ${targetUsername} deleted by root.`,
        },
        lobby
      );

      // Optionally log what was deleted
      console.log(
        `Deleted messages from user ${targetUsername}: ${messageIdsToDelete.join(
          ", "
        )}`
      );
    }
  }

  function deleteMessageFromFile(messageId, timestamp, lobby) {
    const chatHistoryFile = path.join(chatHistoryDir, `${lobby}.json`);
    if (fs.existsSync(chatHistoryFile)) {
      let chatHistory = JSON.parse(fs.readFileSync(chatHistoryFile, "utf-8"));
      // Filter out the message with the matching id and timestamp
      const updatedHistory = chatHistory.filter(
        (msg) => !(msg.id === messageId && msg.timestamp === timestamp)
      );
      // Only write back to the file if the history has changed
      if (updatedHistory.length !== chatHistory.length) {
        fs.writeFileSync(chatHistoryFile, JSON.stringify(updatedHistory));
        return true;
      }
    }
    return false; // Return false if the file doesn't exist or no message was deleted
  }

  function broadcastToLobby(message, lobby) {
    const messageStr = JSON.stringify(message);
    lobbies[lobby].forEach((client) => client.ws.send(messageStr));
  }

  function saveToChatHistory(message, lobby) {
    const chatHistoryFile = path.join(chatHistoryDir, `${lobby}.json`);
    let chatHistory = [];

    // Check if the chat history file exists
    if (fs.existsSync(chatHistoryFile)) {
      chatHistory = JSON.parse(fs.readFileSync(chatHistoryFile, "utf-8")); // Read existing chat history
    }

    // Push the new message object into chat history
    chatHistory.push(message); // Ensure the message object includes the username as owner

    // Write back to the file, formatted for readability
    fs.writeFileSync(chatHistoryFile, JSON.stringify(chatHistory, null, 2));
    console.log(
      `Chat history for ${lobby} updated. Current entries: ${chatHistory.length}`
    ); // Log the update
  }
});
// Set up the directory for storing images
const imagesDir = path.join(__dirname, "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Route to upload images
app.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded." });
  }
  res.json({ success: true, filePath: `/images/${req.file.filename}` });
});

// Serve images statically from /images
app.use("/images", express.static(imagesDir));
// Middleware to ensure user is root for admin actions
function checkRoot(req, res, next) {
  const username = req.headers["x-username"];
  if (username !== "root") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only root can access this.",
    });
  }
  next();
}

// Route to make a user an admin
app.post("/admin/make-admin", checkRoot, (req, res) => {
  const { username } = req.body;

  db.run(
    `UPDATE users SET role = 'admin' WHERE username = ?`,
    [username],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error promoting user to admin." });
      }
      if (this.changes > 0) {
        res.json({ success: true, message: `User ${username} is now an admin.` });
      } else {
        res.status(404).json({ success: false, message: "User not found." });
      }
    }
  );
});
// Route to get all users
app.get("/admin/users", checkRoot, (req, res) => {
  db.all("SELECT username FROM users", (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Error fetching users." });
    }
    res.json({ success: true, users: rows });
  });
});

// Route to delete a user
app.post("/admin/delete-user", checkRoot, (req, res) => {
  const { username } = req.body;

  db.run("DELETE FROM users WHERE username = ?", [username], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Error deleting user." });
    }
    if (this.changes > 0) {
      res.json({ success: true, message: "User deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  });
});

// Route to ban a user (by setting their password to an empty string)
app.post("/admin/ban-user", checkRoot, (req, res) => {
  const { username } = req.body;

  db.run(
    'UPDATE users SET password = "" WHERE username = ?',
    [username],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error banning user." });
      }
      if (this.changes > 0) {
        res.json({ success: true, message: "User banned successfully." });
      } else {
        res.status(404).json({ success: false, message: "User not found." });
      }
    }
  );
});

// Route to clear chat history of a specific lobby
app.post("/admin/clear-chat", checkRoot, (req, res) => {
  const { lobby } = req.body;
  const chatHistoryFile = path.join(chatHistoryDir, `${lobby}.json`);

  if (fs.existsSync(chatHistoryFile)) {
    fs.unlinkSync(chatHistoryFile); // Remove the chat history file
    res.json({
      success: true,
      message: `Chat history cleared for lobby '${lobby}'.`,
    });
  } else {
    res.status(404).json({ success: false, message: "Lobby not found." });
  }
});

// Route to get the list of active lobbies
app.get("/admin/active-lobbies", checkRoot, (req, res) => {
  const activeLobbies = Object.keys(lobbies); // Assuming lobbies are stored in memory
  res.json({ success: true, lobbies: activeLobbies });
});

// Route to kick a user from a lobby
app.post("/admin/kick-user", checkRoot, (req, res) => {
  const { username, lobby } = req.body;

  if (lobbies[lobby]) {
    // Remove the user from the lobby
    lobbies[lobby] = new Set(
      [...lobbies[lobby]].filter((client) => client.username !== username)
    );
    res.json({
      success: true,
      message: `User '${username}' kicked from lobby '${lobby}'.`,
    });
  } else {
    res
      .status(404)
      .json({ success: false, message: "Lobby or user not found." });
  }
});

// Error handling for invalid routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
