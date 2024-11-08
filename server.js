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
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const upload = multer({ dest: "uploads/" });

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
            password TEXT,
            role TEXT
        )`,
      (err) => {
        if (err) {
          console.error(
            "Error creating users table, maybe the username is longer than 12 SYMBOLS",
            err.message
          );
        }
      }
    );
  }
});

// Register route
app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, hashedPassword, role],
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

      if (row) {
        // Compare the password with the hashed password
        if (await bcrypt.compare(password, row.password)) {
          // Successfully logged in
          res.send({
            success: true,
            message: "Login successful",
            role: row.role, // Include the user's role
          });
        } else if (row.role === "banned") {
          // Send a response indicating redirection to banned page
          return res.status(403).json({ redirect: "/banned.html" });
        } else {
          res
            .status(401)
            .send({ success: false, message: "Invalid username or password" });
        }
      } else {
        res
          .status(401)
          .send({ success: false, message: "Invalid username or password" });
      }
    }
  );
});

// Change assword route
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

// DELETE user account route
app.post("/delete-account", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res
      .status(400)
      .json({ success: false, message: "Username is required." });
  }

  db.run(`DELETE FROM users WHERE username = ?`, [username], function (err) {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the account.",
      });
    }

    // Check if the user was actually deleted
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // If the deletion was successful
    res.json({ success: true, message: "User account deleted successfully." });
  });
});

function isValidDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()); 
}

// WebSocket connection handling
const lobbies = {};
const clients = new Map();

wss.on("connection", (ws) => {
  let currentLobby = null;
  let username = null;
  let role = null;

  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message);
    const data = JSON.parse(message);

    if (parsedMessage.type === "join") {
      clients.set(ws, data.username);
      console.log(`${data.username} joined the chat.`);
      currentLobby = parsedMessage.lobby;
      username = parsedMessage.username;
      role = parsedMessage.role;

      // Initialize lobby if it doesn't exist
      if (!lobbies[currentLobby]) {
        lobbies[currentLobby] = new Set();
      }
      lobbies[currentLobby].add({ ws, username });

      sendChatHistory(ws, currentLobby);
      broadcastOnlineUsers(currentLobby);
      console.log(`Client ${username} joined lobby: ${currentLobby}`);

      // Set username as a property on the WebSocket object
      ws.username = username; // Store username on the ws object
    } else if (parsedMessage.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
    } else if (parsedMessage.type === "message" && currentLobby) {
      // Handle admin commands
      if (role === "admin" && parsedMessage.message.startsWith("/")) {
        handleAdminCommand(parsedMessage.message, currentLobby);
      } else {
        const timestamp = new Date().toISOString(); // Assuming this is how timestamp is set
        if (isValidDate(timestamp)) {
          const fullMessage = {
            id: parsedMessage.id,
            username: username,
            timestamp: timestamp,
            message: parsedMessage.message,
          };

          broadcastToLobby(fullMessage, currentLobby);
          saveToChatHistory(fullMessage, currentLobby);
          console.log("Received message:", parsedMessage);
        } else {
          console.log("Invalid timestamp. Not showing date separator.");
        }
      }
    } else if (data.type === "image") {
      const imagePath = path.join(
        __dirname,
        "uploads",
        `${data.timestamp}.png`
      );
      const imageBuffer = Buffer.from(data.data, "base64");

      fs.writeFile(imagePath, imageBuffer, (err) => {
        if (err) {
          console.error(err);
          ws.send(JSON.stringify({ error: "Error saving image" }));
        } else {
          console.log("Image saved successfully");
          ws.send(JSON.stringify({ message: "Image uploaded successfully" }));
        }
      });
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

      // Allow deletion if the role is "Admin" or if they own the message
      if (role === "admin" || messageOwnerUsername === username) {
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
    clients.delete(ws); // Remove the client from the map
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
      case "/admin":
        if (args[1]) {
          makeAdmin(args[1]);
        }
        break;
      case "/user":
        if (args[1]) {
          makeUser(args[1]);
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
        `Chat history for lobby '${lobby}' has been cleared by Admin.`
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
        { type: "system", message: `User ${username} was kicked by Admin.` },
        lobby
      );
    }
  }

  // Route to make a user an admin
  function makeAdmin(username, res) {
    db.run(
      `UPDATE users SET role = 'admin' WHERE username = ?`,
      [username],
      function (err) {
        if (err) {
          console.error("Error promoting user to admin:", err.message);
          return res.status(500).json({
            success: false,
            message: "Error promoting user to admin.",
          });
        }
        if (this.changes > 0) {
          sendRoleChangeToClient(username, "admin"); // Send role change to the specific client
          broadcastToLobby({
            type: "system",
            message: `User ${username} is now an admin.`,
          });
        } else {
          res.status(404).json({ success: false, message: "User not found." });
        }
      }
    );
  }

  // Route to make a user a regular user
  function makeUser(username, res) {
    db.run(
      `UPDATE users SET role = 'user' WHERE username = ?`,
      [username],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Error promoting user to user." });
        }
        if (this.changes > 0) {
          sendRoleChangeToClient(username, "user"); // Send role change to the specific client
          broadcastToLobby({
            type: "system",
            message: `User ${username} is now a user.`,
          });
        } else {
          res.status(404).json({ success: false, message: "User not found." });
        }
      }
    );
  }

  // Route to ban a user
  function banUser(username, res) {
    db.run(
      'UPDATE users SET role = "banned" WHERE username = ?',
      [username],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Error banning user." });
        }
        if (this.changes > 0) {
          sendRoleChangeToClient(username, "banned"); // Send role change to the specific client
          broadcastToLobby({
            type: "system",
            message: "User banned successfully.",
          });
        } else {
          res.status(404).json({ success: false, message: "User not found." });
        }
      }
    );
  }

  function deleteMessage(messageId, timestamp, lobby) {
    if (deleteMessageFromFile(messageId, timestamp, lobby)) {
      broadcastToLobby({ type: "delete", id: messageId }, lobby);
      broadcastToLobby(
        { type: "system", message: `Message ${messageId} deleted by Admin.` },
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
          message: `All messages from user ${targetUsername} deleted by Admin.`,
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

function broadcastToLobby(message, lobbyName) {
  if (lobbies[lobbyName]) {
    lobbies[lobbyName].forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }
}

function closeLobby(lobbyName) {
  // Check if the lobby exists
  if (lobbies[lobbyName]) {
    // Step 1: Broadcast the "clear" message to notify users about the chat history being cleared
    broadcastToLobby({ type: "clear" }, lobbyName);

    // Step 2: Delete the chat history file for the lobby
    const chatHistoryFile = path.join(chatHistoryDir, `${lobbyName}.json`);
    if (fs.existsSync(chatHistoryFile)) {
      fs.unlinkSync(chatHistoryFile);
      console.log(`Chat history for lobby '${lobbyName}' has been deleted.`);
    }

    // Step 3: Disconnect all users in the lobby
    lobbies[lobbyName].forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        const message = { type: "system", message: `Lobby '${lobbyName}' has been closed.` };
        client.ws.send(JSON.stringify(message)); // Notify user of lobby closure
        client.ws.close(); // Disconnect the user from the lobby
      }
    });

    // Step 4: Remove the lobby from the list of active lobbies
    delete lobbies[lobbyName];
    console.log(`Lobby '${lobbyName}' has been closed and removed from memory.`);
  }
}

app.post("/admin/close-lobby", (req, res) => {
  const { lobby } = req.body;

  // Check if the lobby exists
  if (lobbies[lobby]) {
    closeLobby(lobby); // Call the function to close the lobby
    res.json({ success: true, message: `Lobby '${lobby}' has been closed.` });
  } else {
    res.status(404).json({ success: false, message: "Lobby not found." });
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

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const imagePath = path.join(imagesDir, req.file.filename);

  // Move the uploaded file to a permanent location
  fs.rename(req.file.path, imagePath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error saving image");
    }

    // Prepare the message data to save to chat history
    const message = {
      id: Date.now().toString(), // unique id
      username: req.body.username,
      timestamp: new Date().toISOString(),
      message: null, // no text message
      imageUrl: `/images/${req.file.filename}` // URL of the saved image
    };

    // Send response with message data to confirm success
    res.json(message);
  });
});


// Serve images statically from /images
app.use("/images", express.static(imagesDir));

// Checking if user is Admin
function isAdmin(req, res, next) {
  const username = req.body.username; // You may need to get this from a session or token

  db.get(
    `SELECT role FROM users WHERE username = ?`,
    [username],
    (err, row) => {
      if (err) {
        console.error("Error fetching role:", err.message);
        return res
          .status(500)
          .json({ success: false, message: "Error checking role." });
      }
      if (row && row.role === "admin") {
        next(); // User is admin, proceed to the route handler
      } else {
        res
          .status(403)
          .json({ success: false, message: "Unauthorized access." });
      }
    }
  );
}

function sendRoleChangeToClient(username, newRole) {
  const message = JSON.stringify({
    type: "ROLE_CHANGE",
    username: username,
    role: newRole,
  });

  // Find the client associated with the username
  for (const [client, user] of clients.entries()) {
    if (user === username && client.readyState === WebSocket.OPEN) {
      client.send(message); // Send message to specific client
      break; // Stop after sending to the first matched client
    }
  }
}

// Route to make a user an admin
app.post("/admin/make-admin", (req, res) => {
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
        sendRoleChangeToClient(username, "admin"); // Send role change to the specific client
        res.json({
          success: true,
          message: `User ${username} is now an admin.`,
        });
      } else {
        res.status(404).json({ success: false, message: "User not found." });
      }
    }
  );
});

// Route to make a user a regular user
app.post("/admin/make-user", (req, res) => {
  const { username } = req.body;

  db.run(
    `UPDATE users SET role = 'user' WHERE username = ?`,
    [username],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error promoting user to user." });
      }
      if (this.changes > 0) {
        sendRoleChangeToClient(username, "user"); // Send role change to the specific client
        res.json({ success: true, message: `User ${username} is now a user.` });
      } else {
        res.status(404).json({ success: false, message: "User not found." });
      }
    }
  );
});

// Route to ban a user
app.post("/admin/ban-user", (req, res) => {
  const { username } = req.body;

  db.run(
    'UPDATE users SET role = "banned" WHERE username = ?',
    [username],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error banning user." });
      }
      if (this.changes > 0) {
        sendRoleChangeToClient(username, "banned"); // Send role change to the specific client
        res.json({ success: true, message: "User banned successfully." });
      } else {
        res.status(404).json({ success: false, message: "User not found." });
      }
    }
  );
});
// Route to get all users
app.get("/admin/users", (req, res) => {
  db.all("SELECT username, role FROM users", (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err.message);
      return res
        .status(500)
        .json({ success: false, message: "Error fetching users." });
    }
    res.json({ success: true, users: rows });
  });
});

// Route to delete a user
app.post("/admin/delete-user", (req, res) => {
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

// Route to clear chat history of a specific lobby
app.post("/admin/clear-chat", (req, res) => {
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
app.get("/admin/active-lobbies", (req, res) => {
  const activeLobbies = Object.keys(lobbies); // Assuming lobbies are stored in memory
  res.json({ success: true, lobbies: activeLobbies });
});

// Route to kick a user from a lobby
app.post("/admin/kick-user", (req, res) => {
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

app.get("/admin/active-lobbies", (req, res) => {
  const activeLobbies = getActiveLobbies();

  if (activeLobbies.length === 0) {
    return res.json({ success: true, lobbies: [] });
  }

  res.json({ success: true, lobbies: activeLobbies });
});

// Function to get active lobbies from the DOM
function getActiveLobbies() {
  const lobbies = [];

  // Select all elements with the data-lobby attribute
  const lobbyElements = document.querySelectorAll("[data-lobby]");

  // Iterate over the selected elements and push their values to the lobbies array
  lobbyElements.forEach((element) => {
    const lobbyName = element.getAttribute("data-lobby");
    if (lobbyName) {
      lobbies.push(lobbyName); // Add lobby name to the array
    }
  });

  return lobbies; // Return the list of lobby names
}

// Error handling for invalid routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


















