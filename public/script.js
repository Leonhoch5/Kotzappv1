// script.js
const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const lobbySelect = document.getElementById("lobby-selection");
const joinButton = document.getElementById("lobby-option");
const statusDiv = document.getElementById("status");
const statuslobbyDiv = document.getElementById("statuslobby");

let ws;
let currentLobby = document.getElementsByClassName("lobby-option")[0].getAttribute("data-lobby");

// Retrieve username from sessionStorage
let username = sessionStorage.getItem("username");

if (!username) {
  alert("Please log in.");
  window.location.href = "/login.html";
}

sendButton.onclick = () => {
  const message = messageInput.value.trim();
  if (message) {
    const messageId = chat.childElementCount;
    const timestamp = new Date().toISOString();
    console.log("Sending message:", message);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "message",
          id: messageId,
          username: username,
          timestamp: timestamp,
          message: message,
        })
      );
      messageInput.value = "";
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
  }
};

function generateColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  const saturation = 100; // High saturation for bright color
  const lightness = 80 + (hash % 10); // High lightness for readability
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

let lastMessageDate = null; // Track the last message date
const stickyDateSeparator = document.createElement("div");
stickyDateSeparator.classList.add("sticky-date-separator");

function formatDate(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
}

// Track the last message's username globally to compare with new messages
let lastMessageUsername = null;

function appendMessage({ id, username, timestamp, message }) {
  if (!message.trim()) return;

  const messageDate = new Date(timestamp);
  const formattedDate = formatDate(messageDate);

  // Add a date separator if it's a new date compared to the last message
  if (
    !lastMessageDate ||
    lastMessageDate.toDateString() !== messageDate.toDateString()
  ) {
    if (!timestamp) {
      return;
    } else {
      const dateSeparator = document.createElement("div");
      dateSeparator.setAttribute("data-timestamp", timestamp);
      dateSeparator.classList.add("date-separator");
      dateSeparator.classList.add("message-container");
      dateSeparator.textContent = formattedDate;
      chat.prepend(dateSeparator); // Add separator at the top of the chat
      lastMessageDate = messageDate; // Update lastMessageDate to the current message date

      // Reset lastMessageUsername for a new day to display usernames again
      lastMessageUsername = null;
    }
  }

  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message-container");

  const currentUser = sessionStorage.getItem("username");
  const isCurrentUser = username === currentUser;

  if (isCurrentUser) {
    messageContainer.classList.add("you");
    username = "You";
  } else {
    messageContainer.classList.add("others");
  }

  const usernameDiv = document.createElement("div");
  usernameDiv.classList.add("username");
  usernameDiv.textContent = username;
  usernameDiv.style.color = generateColor(username);

  // Check if this message is from the same user as the last message
  const isSameUser = username === lastMessageUsername;

  if (isSameUser) {
    usernameDiv.style.display = "none"; // Hide username for consecutive messages
    messageContainer.classList.add("same-user"); // Add 'same-user' class for smaller margin
  } else {
    usernameDiv.style.display = "block"; // Show username for new user
  }

  const messageBubble = document.createElement("div");
  messageBubble.classList.add("message-bubble");
  messageBubble.textContent = message;

  const timestampDiv = document.createElement("div");
  timestampDiv.classList.add("timestamp");
  timestampDiv.textContent = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageBubble.appendChild(document.createTextNode(" "));
  messageBubble.appendChild(timestampDiv);

  // Set data attributes for later comparisons
  messageContainer.dataset.id = id;
  messageContainer.dataset.timestamp = timestamp;
  messageContainer.dataset.username = username; // Store username for `isSameUser` check
  messageContainer.appendChild(usernameDiv);
  messageContainer.appendChild(messageBubble);

  usernameDiv.addEventListener("mouseenter", () => {
    usernameDiv.style.textDecoration = "underline"; // Underline username on hover
    usernameDiv.style.cursor = "pointer"; // Let cursor be pointer
  });
  usernameDiv.addEventListener("mouseleave", () => {
    usernameDiv.style.textDecoration = "none"; // Remove underline
    usernameDiv.style.cursor = "default"; // Let cursor be default
  });
  messageBubble.addEventListener("mouseenter", () => {
    messageBubble.style.textDecoration = "underline"; // Underline username on hover
    messageBubble.style.cursor = "pointer"; // Let cursor be pointer
  });
  messageBubble.addEventListener("mouseleave", () => {
    messageBubble.style.textDecoration = "none"; // Remove underline
    messageBubble.style.cursor = "default"; // Let cursor be default
  });

  messageBubble.addEventListener("click", () => {
    if (isCurrentUser || currentUser === "root") {
      if (confirm(`Delete message: "${message}"?`)) {
        ws.send(JSON.stringify({ type: "delete", id, timestamp }));
        messageContainer.remove();
      }
    } else {
      alert("You can only delete your own messages.");
    }
  });

  // Prepend the new message at the top of the chat
  chat.prepend(messageContainer);

  // Update lastMessageUsername to the current username for the next comparison
  lastMessageUsername = username;

  // Initialize the sticky date observer after messages have been loaded
  initializeStickyDateObserver();
}

// Function to handle the sticky date display
function initializeStickyDateObserver() {
  const messageContainers = document.querySelectorAll(".message-container");
  const stickyDateContainer = document.querySelector("#sticky-date-container");
  chat.prepend(stickyDateSeparator); // Add the sticky separator to the chat

  const observer = new IntersectionObserver(
    (entries) => {
      let currentStickyDate = null;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Set the topmost visible date as the sticky date
          currentStickyDate = new Date(
            entry.target.getAttribute("data-timestamp")
          );
        }
      });

      // Update the sticky container content based on the topmost date
      if (currentStickyDate) {
        stickyDateContainer.textContent = formatDate(currentStickyDate);
        stickyDateContainer.classList.add("visible");
      }
    },
    {
      root: chat,
      threshold: 0,
      rootMargin: "0px 0px -100%",
    }
  );

  messageContainers.forEach((messageContainer) =>
    observer.observe(messageContainer)
  );
}

// Ensure the sticky date container is created and added to DOM
function setupStickyDateContainer() {
  const chatContainer = document.getElementById("chat-container");
  const stickyDateContainer = document.createElement("div");
  stickyDateContainer.id = "sticky-date-container";
  stickyDateContainer.classList.add("sticky-date-container");
  chatContainer.appendChild(stickyDateContainer);
  chat.parentNode.insertBefore(stickyDateContainer, chat);
}

setupStickyDateContainer();
const imageInput = document.getElementById("imageInput");
const sendImageButton = document.getElementById("sendImage");

// Trigger file input when 'Send Image' button is clicked
sendImageButton.onclick = () => {
  imageInput.click();
};

// Handle the image file selection
imageInput.onchange = () => {
  const file = imageInput.files[0];
  if (file && ws && ws.readyState === WebSocket.OPEN) {
    const reader = new FileReader();
    reader.onload = () => {
      const imageBase64 = reader.result.split(",")[1]; // Extract the base64 part
      const timestamp = new Date().toISOString();

      // Send the image data as a message
      ws.send(
        JSON.stringify({
          type: "image",
          username: username,
          timestamp: timestamp,
          data: imageBase64,
        })
      );
    };
    reader.readAsDataURL(file); // Read the file as a base64 encoded string
  }
};
const chatContainer = document.getElementById("chat");
const dateSeparator = document.getElementById("sticky-date-container");

let scrollTimeout;

// Function to fade in the date separator when scrolling
chatContainer.addEventListener("scroll", () => {
  // Add the active class to fade in the separator
  dateSeparator.classList.add("active");

  // Clear any previous timeout to prevent premature fade out
  clearTimeout(scrollTimeout);

  // Set a timeout to fade out the separator after scrolling stops
  scrollTimeout = setTimeout(() => {
    dateSeparator.classList.remove("active");
  }, 1500); // Adjust timeout duration as needed



  const baseLine = document
    .getElementsByClassName("sticky-date-container")[0]
    .getBoundingClientRect().y;
  const separators = document.getElementsByClassName("date-separator");
  for (let i = 0; i < separators.length; i++) {
    const separator = separators[i];
    const sy = separator.getBoundingClientRect().y;
    const diff = (sy - baseLine) / 5;
    const diffPercent = diff.toString() + "%";
    separator.style.width = "calc(20% + " + diffPercent + ")";
    if (diff < 0) {
      separator.style.visibility = "hidden";
    } else {
      separator.style.visibility = "visible";
    }
  }
});

// Initial fade-out if no scrolling occurs after loading
dateSeparator.classList.remove("active");

function updateOnlineUsers(users) {
  statuslobbyDiv.textContent = `-- ${currentLobby} --`;
  statusDiv.textContent = `-- Online: ${users.join(", ")} --`;
}

function join () {
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
    chat.innerHTML = "";
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    statusDiv.textContent = "Connection error";
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "banned") {
      alert("You have been banned. Redirecting to login...");
      window.location.href = "/login.html"; // Redirect to login page
    } else if (data.type === "delete") {
      const messageDiv = chat.querySelector(
        `div[data-id="${data.id}"][data-timestamp="${data.timestamp}"]`
      );
      if (messageDiv) {
        messageDiv.remove();
      }
    } else if (data.type === "onlineUsers") {
      updateOnlineUsers(data.users);
    } else if (data.type === "chatHistory") {
      data.messages.forEach(appendMessage);
    } else if (data.type === "clear") {
      chat.innerHTML = "";
      // Append a system message to indicate that the chat was cleared
      appendMessage({
        id: Date.now(), // Unique ID for the notice
        username: "System",
        timestamp: new Date().toISOString(),
        message: "Chat has been cleared by the admin.",
      });     
    } else {
      appendMessage(data);
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
    sendButton.click();
  }
});

lobbySelect.addEventListener("change", (event) => {
  currentLobby = event.target.value;
  chat.innerHTML = "";
  console.log(`Selected lobby: ${currentLobby}`);
});

document.querySelectorAll('.lobby-option').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default anchor behavior

        // Get the lobby name from the clicked link's data-lobby attribute
        const lobbyName = this.getAttribute("data-lobby");
        
        // Update currentLobby to the new lobby name
        currentLobby = lobbyName; 
        
        // Call the join function with the updated lobby name
        join();
        document.querySelector('input[type="checkbox"]').checked = false;
    });
});

document.querySelectorAll('#statuslobby').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault(); 
      
        currentLobby 
        
        join();
    });
});

document.addEventListener("DOMContentLoaded", () => {
  join();
});

