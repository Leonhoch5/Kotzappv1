const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const lobbySelect = document.getElementById("lobby");
const joinButton = document.getElementById("join");
const statusDiv = document.getElementById("status");
const statuslobbyDiv = document.getElementById("statuslobby");

let ws;
let currentLobby = lobbySelect.value;

// Retrieve username from sessionStorage
let username = sessionStorage.getItem("username");

if (!username) {
  alert("Please log in.");
  window.location.href = "/login.html";
}

sendButton.onclick = () => {
  const message = messageInput.value.trim();
  if (message) {
    const messageId = chat.childElementCount; // Use the number of child elements as the ID
    const timestamp = new Date().toISOString(); // Generate the current timestamp
    console.log("Sending message:", message);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "message",
          id: messageId,
          username: username, // Include the username
          timestamp: timestamp, // Include the timestamp
          message: message // Include the message content
        })
      );
      messageInput.value = ""; // Clear the input field
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
  }
};

let longestUsernameLength = 0; // Initialize outside to track longest username

function appendMessage({ id, username, timestamp, message }) {
  if (!message.trim()) return;

  // Calculate the length of the longest username
  const usernameLength = username.length;

  // Update longest username length if needed
  if (usernameLength > longestUsernameLength) {
    longestUsernameLength = usernameLength;
  }

  // Create a container div for the message
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message", "message-container");

  // Create the username div
  const usernameDiv = document.createElement("div");
  usernameDiv.classList.add("username");
  usernameDiv.textContent = `${username}:`; // Add colon after the username

  // Create the message div
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message-text");
  messageDiv.textContent = message;

  // Set the width of the username div to align with the longest username
  const usernameWidth = `${longestUsernameLength * 10 + 10}px`; // Adjust for padding
  usernameDiv.style.width = usernameWidth; // Fixed width based on longest username
  usernameDiv.style.display = "inline-block"; // Keep usernames inline-block for alignment

  // Set margin and other styles for the message div
  messageDiv.style.marginLeft = "10px"; // Space between username and message
  messageDiv.style.display = "inline"; // Allow the message to be inline
  messageDiv.style.wordWrap = "break-word"; // Enable word wrap for long messages
  messageDiv.style.maxWidth = `calc(100% - ${parseInt(usernameWidth) + 20}px)`; // Adjust based on username width

  // Append the username and message divs to the container
  messageContainer.appendChild(usernameDiv);
  messageContainer.appendChild(messageDiv);

  // Set the message ID as a data attribute for deletion
  messageContainer.dataset.id = id; // Use dataset to store the ID

  // Add hover and delete functionality
  messageContainer.addEventListener("mouseenter", () => {
    messageDiv.style.textDecoration = "underline";
  });
  messageContainer.addEventListener("mouseleave", () => {
    messageDiv.style.textDecoration = "none";
  });
  messageContainer.addEventListener("click", () => {
    const confirmDelete = confirm(`Delete message: "${message}"?`);
    if (confirmDelete) {
      const messageId = messageContainer.dataset.id; // Get the message ID from the dataset
      ws.send(JSON.stringify({ type: "delete", id: messageId }));
      messageContainer.remove(); // Remove the message from the UI
    }
  });

  // Append the container to the chat
  chat.prepend(messageContainer);

  // Adjust all username widths after adding a new message
  adjustUsernameWidth();
}

// Adjust the width of all username divs based on the longest username
function adjustUsernameWidth() {
  const usernameDivs = document.querySelectorAll(".username");
  const maxUsernameWidth = `${longestUsernameLength * 10 + 10}px`; // Adjust based on character width

  // Set all usernames to the same width
  usernameDivs.forEach((div) => {
    div.style.width = maxUsernameWidth;
  });
}

// Update online users in the status div
function updateOnlineUsers(users) {
  statuslobbyDiv.textContent = `-- ${currentLobby} --`;
  statusDiv.textContent = `-- Online: ${users.join(", ")} --`;
}

joinButton.onclick = () => {
  if (ws) {
    ws.close();
  }

  ws = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
  );

  ws.onopen = () => {
    console.log("Connected to the server");
    ws.send(
      JSON.stringify({ type: "join", lobby: currentLobby, username: username })
    );
    statusDiv.textContent = `Connected to lobby: ${currentLobby}`;
    chat.innerHTML = ""; // Clear chat history on lobby change
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    statusDiv.textContent = "Connection error";
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data); // Parse the incoming message

    if (data.type === "delete") {
      // Handle message deletion by ID
      const messageDiv = chat.querySelector(`div[data-id="${data.id}"]`);
      if (messageDiv) {
        messageDiv.remove(); // Remove the message from the chat UI
      }
    } else if (data.type === "onlineUsers") {
      // Update the list of online users
      updateOnlineUsers(data.users);
    } else if (data.type === "chatHistory") {
      // Load chat history
      data.messages.forEach(appendMessage); // Append all saved messages
    } else {
      appendMessage(data); // Add new messages to the chat
    }
  };

  ws.onclose = () => {
    console.log("Connection closed");
    statusDiv.textContent = "Connection closed.";
  };

  console.log(`Joined lobby: ${currentLobby} as ${username}`);
};


messageInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendButton.click(); // Trigger send button on Enter key press
  }
});

lobbySelect.addEventListener("change", (event) => {
  currentLobby = event.target.value;
  chat.innerHTML = ""; // Clear chat history on lobby change
  console.log(`Selected lobby: ${currentLobby}`);
});

document.addEventListener("DOMContentLoaded", () => {
  joinButton.click(); // Automatically join the lobby when the page loads
});
