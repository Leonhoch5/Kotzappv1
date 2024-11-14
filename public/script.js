// script.js
const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const lobbySelect = document.getElementById("lobby-selection");
const joinButton = document.getElementById("lobby-option");
const statusDiv = document.getElementById("status");
const statuslobbyDiv = document.getElementById("statuslobby");

let ws;
let currentLobby = document
  .getElementsByClassName("lobby-option")[0]
  .getAttribute("data-lobby");

// Retrieve username from sessionStorage
let username = sessionStorage.getItem("username");
const role = sessionStorage.getItem("role"); // Get the role from sessionStorage

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
          lobby: currentLobby,
        })
      );
      messageInput.value = "";
    } else {
      alert("Not connected. Cannot send message.");
    }
  }
};

function shuffle(array) {
  let currentIndex = array.length;

  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

let arr = [
  "https://4kwallpapers.com/images/wallpapers/desert-doom-sand-dunes-dark-background-monochrome-landscape-3840x2160-6409.jpg",
  "https://4kwallpapers.com/images/wallpapers/plant-leaves-macro-3840x2160-19158.jpg",
  "https://4kwallpapers.com/images/wallpapers/snowy-mountains-3840x2160-19361.jpg",
  "https://4kwallpapers.com/images/wallpapers/poland-landscape-3840x2160-19135.jpg",
  "https://4kwallpapers.com/images/wallpapers/serene-lake-sunset-3840x2160-18728.jpg",
  "https://4kwallpapers.com/images/wallpapers/butterfly-fairies-3840x2160-17273.jpg",
  "https://4kwallpapers.com/images/wallpapers/spring-magical-3840x2160-16778.jpg",
  "https://4kwallpapers.com/images/wallpapers/midnight-blue-3840x2160-16226.jpg",
  "https://4kwallpapers.com/images/wallpapers/mystical-foggy-3840x2160-12991.jpg",
  "https://4kwallpapers.com/images/wallpapers/sunlight-bavarian-3840x2160-12679.jpg",
  "https://4kwallpapers.com/images/wallpapers/mountain-peak-alps-3840x2160-11501.jpg",
  "https://4kwallpapers.com/images/wallpapers/forest-railway-3840x2160-10959.jpg",
  "https://4kwallpapers.com/images/wallpapers/lake-forest-wilderness-pine-trees-cold-evening-3840x2160-1100.jpg",
  "https://4kwallpapers.com/images/wallpapers/vestrahorn-mountain-3840x2160-16288.jpg",
  "https://4kwallpapers.com/images/wallpapers/foggy-autumn-forest-3840x2160-16624.jpg",
  "https://4kwallpapers.com/images/wallpapers/forest-path-white-3840x2160-16289.jpg",
  "https://4kwallpapers.com/images/wallpapers/above-clouds-3840x2160-16072.jpg",
  "https://4kwallpapers.com/images/wallpapers/waterfall-pink-3840x2160-15841.jpg",
  "https://4kwallpapers.com/images/wallpapers/canadian-rockies-3840x2160-15823.jpg",
  "https://4kwallpapers.com/images/wallpapers/uttakleiv-beach-3840x2160-15815.jpg",
  "https://4kwallpapers.com/images/wallpapers/silhouette-3840x2160-15613.jpg",
  "https://4kwallpapers.com/images/wallpapers/mount-rainier-night-5120x3600-15487.jpg",
  "https://4kwallpapers.com/images/wallpapers/thick-forest-5120x2880-14776.jpg",
  "https://4kwallpapers.com/images/wallpapers/autumn-landscape-5120x3200-13484.jpg",
  "https://4kwallpapers.com/images/wallpapers/aldeyjarfoss-5149x3436-13364.jpg",
  "https://4kwallpapers.com/images/wallpapers/red-mountain-pass-5120x3834-13285.jpg",
  "https://4kwallpapers.com/images/wallpapers/circle-light-5000x3750-13275.jpg",
  "https://4kwallpapers.com/images/wallpapers/forest-walkway-6000x4000-13157.jpg",
  "https://4kwallpapers.com/images/wallpapers/niagara-falls-6144x4096-13073.jpg",
  "https://4kwallpapers.com/images/wallpapers/enchanting-autumn-7952x5304-12984.jpg",
  "https://4kwallpapers.com/images/wallpapers/sunlight-bavarian-5472x3078-12679.jpg",
  "https://4kwallpapers.com/images/wallpapers/fireflies-forest-8k-8064x5376-12527.jpg",
  "https://4kwallpapers.com/images/wallpapers/bow-lake-canadian-3840x2160-12260.jpg",
  "https://4kwallpapers.com/images/wallpapers/moon-aesthetic-6455x4142-12004.jpg",
  "https://4kwallpapers.com/images/wallpapers/pragser-wildsee-5760x3840-11621.jpg",
  "https://4kwallpapers.com/images/wallpapers/mountain-peak-alps-7680x5120-11501.jpg",
  "https://4kwallpapers.com/images/wallpapers/moon-mountains-9071x5669-11462.jpeg",
  "https://4kwallpapers.com/images/wallpapers/mountains-milky-way-7680x4320-11448.jpg",
  "https://4kwallpapers.com/images/wallpapers/sunset-underwater-9216x6144-11436.jpg",
  "https://4kwallpapers.com/images/wallpapers/morning-sunrise-7680x4320-11431.jpg",
  "https://4kwallpapers.com/images/wallpapers/heart-shaped-lake-5120x2880-11450.jpg",
  "https://4kwallpapers.com/images/wallpapers/aurora-borealis-9216x6144-11435.jpg",
  "https://4kwallpapers.com/images/wallpapers/sunset-arctic-7680x5120-11443.jpg",
  "https://4kwallpapers.com/images/wallpapers/forest-autumn-fall-4368x2912-11210.jpg",
  "https://4kwallpapers.com/images/wallpapers/beach-normandy-france-5k-5950x3967-11207.jpg",
  "https://4kwallpapers.com/images/wallpapers/seascape-milky-way-3840x6771-11037.jpg",
  "https://4kwallpapers.com/images/wallpapers/sunset-surreal-ufo-4829x3622-11031.png",
  "https://4kwallpapers.com/images/wallpapers/mountain-peak-snow-7680x5353-10988.jpg",
  "https://4kwallpapers.com/images/wallpapers/cold-blue-hour-6144x4101-11162.jpg",
  "https://4kwallpapers.com/images/wallpapers/matterhorn-mountain-7680x5255-10965.jpg",
  "https://4kwallpapers.com/images/wallpapers/scenery-body-of-7680x5122-11059.jpg",
  "https://4kwallpapers.com/images/wallpapers/mount-everest-6000x3375-11019.jpg",
  "https://4kwallpapers.com/images/wallpapers/london-aesthetic-5120x3857-18772.jpeg",
  "https://4kwallpapers.com/images/wallpapers/volcano-eruption-5120x3413-10957.jpg",
  "https://4kwallpapers.com/images/wallpapers/futuristic-3d-5120x3413-13107.jpg",
  "https://4kwallpapers.com/images/wallpapers/illuminated-luxury-white-background-3d-background-sci-fi-3840x2160-7624.jpg",
  "https://4kwallpapers.com/images/wallpapers/cube-beach-surreal-sunset-moon-futuristic-digital-render-3d-3840x2400-6090.jpg",
  "https://4kwallpapers.com/images/wallpapers/extraterrestrial-ocean-neon-sunlight-3840x2160-95.jpg",
  "https://4kwallpapers.com/images/wallpapers/lost-in-space-404-5120x2880-18155.png",
  "https://4kwallpapers.com/images/wallpapers/forest-pathway-5120x2880-10476.jpg",
  "https://4kwallpapers.com/images/wallpapers/turku-cathedral-7007x3941-10144.jpg",
  "https://4kwallpapers.com/images/wallpapers/moon-cold-night-3840x3268-10003.jpg", 
  "https://4kwallpapers.com/images/wallpapers/svartifoss-5120x3108-9821.jpg",
  "https://4kwallpapers.com/images/wallpapers/ural-mountains-5288x3025-9664.jpg",
  "https://4kwallpapers.com/images/wallpapers/sunset-dusk-beach-seascape-7087x4724-9138.jpg",
  "https://4kwallpapers.com/images/wallpapers/abraham-lake-alberta-canada-artificial-lake-sunset-glacial-5100x3400-8964.jpg",
  "https://4kwallpapers.com/images/wallpapers/alien-pyramid-6146x7686-16012.jpg",
  "https://4kwallpapers.com/images/wallpapers/dreamy-landscape-3840x2160-14973.jpg",
  "https://4kwallpapers.com/images/wallpapers/mountains-green-3840x2160-12793.jpg",
  "https://4kwallpapers.com/images/wallpapers/waterfalls-fog-light-birds-scenic-5k-8k-7087x4724-9076.jpg",
  "https://4kwallpapers.com/images/wallpapers/lighthouse-sunset-seascape-dusk-clouds-sunlight-evening-sky-7087x4724-9064.jpg",
  "https://4kwallpapers.com/images/wallpapers/hot-air-balloon-sunset-clouds-seascape-horizon-reflections-7087x4724-9001.jpg",
  "https://4kwallpapers.com/images/wallpapers/seascape-waves-sunrays-5k-5710x3807-9016.jpg"
];

function changeBackground() {
  shuffle(arr);
  shuffle(arr);
  shuffle(arr);
  chat.style.backgroundImage = `url("${arr.at(Math.floor(Math.random() * arr.length))}")`;
}

changeBackground();

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

  if (isNaN(date.getTime())) {
    return null;
  }

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

let lastMessageUsername = null;
let selectedMessageContainer = null;
let lobbyMessageData = {};

function initializeLobbyData(lobbyName) {
  if (lobbyName && !lobbyMessageData[lobbyName]) {
    lobbyMessageData[lobbyName] = {
      lastMessageDate: null,
      lastMessageUsername: null,
      lastMessageLobby: lobbyName,
    };
  }
}

function appendMessage({
  id,
  username,
  timestamp,
  message,
  imageUrl,
  lobbyName,
}) {
  let lobby = lobbyName || currentLobby;

  if (!lobby) {
    console.error("No lobby passed to appendMessage function!");
    return;
  }

  // Ensure lobby data is initialized
  initializeLobbyData(lobby);

  const messageDate = new Date(timestamp);
  const formattedDate = formatDate(messageDate);
  const lobbyData = lobbyMessageData[lobby];

  // Mark this message as the first after joining the lobby
  if (lobbyData.isFirstMessageAfterJoin === undefined) {
    lobbyData.isFirstMessageAfterJoin = true;
  }

  // Check if we need to add a new date separator (only for the current lobby)
  if (
    !lobbyData.lastMessageDate ||
    lobbyData.lastMessageDate.toDateString() !== messageDate.toDateString()
  ) {
    const dateSeparator = document.createElement("div");
    dateSeparator.setAttribute("data-timestamp", timestamp);
    dateSeparator.classList.add("date-separator", "message-container");
    dateSeparator.textContent = formattedDate;
    chat.prepend(dateSeparator);
    lobbyData.lastMessageDate = messageDate; // Update the last message date for this lobby
    lobbyData.lastMessageUsername = null; // Reset last username for a new date
    if (formattedDate === null) {
      dateSeparator.style.display = "none";
    }
  }

  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message-container");

  const currentUser = sessionStorage.getItem("username");
  const isCurrentUser = username === currentUser;

  if (isCurrentUser) {
    messageContainer.classList.add("you");
    username = "You"; // Set 'You' for the current user
  } else {
    messageContainer.classList.add("others");
  }

  const usernameDiv = document.createElement("div");
  usernameDiv.classList.add("username");
  usernameDiv.textContent = username;
  usernameDiv.style.color = generateColor(username);

  // Display username if it's the first message after joining or if it's a different user
  const isFirstMessageAfterJoin = lobbyData.isFirstMessageAfterJoin;
  const isSameUser =
    username === lobbyData.lastMessageUsername &&
    lobby === lobbyData.lastMessageLobby &&
    !isFirstMessageAfterJoin;

  if (isSameUser) {
    usernameDiv.style.display = "none"; // Hide username if it's the same as the previous message
    messageContainer.classList.add("same-user");
  } else {
    usernameDiv.style.display = "block"; // Show username for new messages or different users
    messageContainer.classList.remove("same-user");
  }

  const messageBubble = document.createElement("div");
  messageBubble.classList.add("message-bubble");

  // Check if it's an image message and append accordingly
  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Uploaded image";
    img.classList.add("uploaded-image");
    messageBubble.appendChild(img);
  } else {
    messageBubble.textContent = message;
  }

  const timestampDiv = document.createElement("div");
  timestampDiv.classList.add("timestamp");
  timestampDiv.textContent = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageBubble.appendChild(document.createTextNode(" "));
  messageBubble.appendChild(timestampDiv);

  messageContainer.dataset.id = id;
  messageContainer.dataset.timestamp = timestamp;
  messageContainer.dataset.username = username;
  messageContainer.appendChild(usernameDiv);
  messageContainer.appendChild(messageBubble);

  messageBubble.addEventListener("click", () => {
    selectedMessageContainer = messageContainer;
    messageContainer.classList.toggle("selected");
  });

  chat.prepend(messageContainer);

  // Update the last message info for this specific lobby
  lobbyData.lastMessageUsername = username; // Update the last username for this lobby
  lobbyData.lastMessageLobby = lobby; // Set the current lobby as the last message's lobby

  // Reset the isFirstMessageAfterJoin flag after the first message is appended
  lobbyData.isFirstMessageAfterJoin = false;

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

const messageMenu = document.getElementById("messageMenu");
let selectedMessage = null;

document.querySelectorAll(".chat-message").forEach((message) => {
  message.addEventListener("click", (event) => {
    selectedMessage = event.currentTarget;
    openMessageMenu(selectedMessage, event);
  });
});

function openMessageMenu(messageElement, clickEvent) {
  const chat = document.getElementById("chat");
  const chatContainer = document.getElementById("chat-container");
  const messageMenu = document.getElementById("messageMenu");

  clickEvent.stopPropagation();

  const messageRect = messageElement.getBoundingClientRect();
  const chatRect = chat.getBoundingClientRect();

  const currentUser = sessionStorage.getItem("username");
  const isCurrentUser = messageElement.classList.contains("you");

  const topPosition = messageRect.bottom - chatRect.top;
  const leftPosition = isCurrentUser
    ? messageRect.right - chatRect.left - messageMenu.offsetWidth
    : messageRect.left - chatRect.left;

  messageMenu.style.top = `${topPosition}px`;
  messageMenu.style.left = `${leftPosition}px`;

  messageMenu.style.display = "block";

  chat.classList.add("blur");

  let selectedMessageContainer = document.querySelector(
    ".selected-message-container"
  );

  const clonedMessageContainer = messageElement.parentNode.cloneNode(true);
  const usernameDiv = clonedMessageContainer.querySelector(".username");
  if (usernameDiv) {
    usernameDiv.remove();
  }

  clonedMessageContainer.style.maxWidth = "100%";
  clonedMessageContainer.style.margin = "0";
  clonedMessageContainer.style.boxSizing = "border-box";

  if (!selectedMessageContainer) {
    selectedMessageContainer = document.createElement("div");
    selectedMessageContainer.className = "selected-message-container";
    chatContainer.appendChild(selectedMessageContainer);
  } else {
    selectedMessageContainer.innerHTML = "";
  }

  selectedMessageContainer.style.position = "absolute";
  selectedMessageContainer.style.top = `${messageRect.top - chatRect.top}px`;
  selectedMessageContainer.style.left = `${leftPosition}px`;

  selectedMessageContainer.appendChild(clonedMessageContainer);

  document.addEventListener("click", (event) => {
    if (
      !messageMenu.contains(event.target) &&
      !selectedMessageContainer.contains(event.target)
    ) {
      closeMessageMenu();
    }
  });
}

function closeMessageMenu() {
  const messageMenu = document.getElementById("messageMenu");
  messageMenu.style.display = "none";

  const chat = document.getElementById("chat");
  chat.classList.remove("blur");

  const selectedMessageContainer = document.querySelector(
    ".selected-message-container"
  );
  if (selectedMessageContainer) {
    selectedMessageContainer.remove();
  }

  document.removeEventListener("click", closeMessageMenu);
}

document.getElementById("pinMessage").addEventListener("click", () => {
  const id = selectedMessageContainer.dataset.id;
  const timestamp = selectedMessageContainer.dataset.timestamp;
  if (selectedMessageContainer) {
    console.log("Pinning message:", id, timestamp);
    closeMessageMenu();
  }
});

document.getElementById("deleteMessage").addEventListener("click", () => {
  if (selectedMessageContainer) {
    const id = selectedMessageContainer.dataset.id;
    const timestamp = selectedMessageContainer.dataset.timestamp;
    const originalUsername = selectedMessageContainer.dataset.username;
    const currentUser = sessionStorage.getItem("username");
    const role = sessionStorage.getItem("role"); // Retrieve the user's role
    const isMessageOwner =
      originalUsername === currentUser ||
      selectedMessageContainer.classList.contains("you");

    if (isMessageOwner || role === "admin") {
      const messageText = selectedMessageContainer
        .querySelector(".message-bubble")
        .childNodes[0].nodeValue.trim();
      if (confirm(`Delete message: "${messageText}"?`)) {
        ws.send(JSON.stringify({ type: "delete", id, timestamp }));

        // Remove the selected message container
        const nextMessageContainer =
          selectedMessageContainer.previousElementSibling;
        const previousMessageContainer =
          selectedMessageContainer.nextElementSibling;
        selectedMessageContainer.remove();
        selectedMessageContainer = null;
        closeMessageMenu();

        // Check if the next message has the class `same-user`
        if (
          nextMessageContainer &&
          nextMessageContainer.classList.contains("same-user") &&
          (!previousMessageContainer ||
            !previousMessageContainer.classList.contains("same-user"))
        ) {
          // Remove `same-user` class
          nextMessageContainer.classList.remove("same-user");

          // Find the username element and display it
          const usernameElement =
            nextMessageContainer.querySelector(".username");
          if (usernameElement) {
            usernameElement.style.display = "block"; // Show the username
          }
        }
      }
    } else {
      alert("You don't have permission to delete this message.");
    }
  } else {
    alert("No message selected for deletion.");
  }
});

chat.addEventListener("click", (event) => {
  const messageBubble = event.target.closest(".message-bubble");
  if (messageBubble) {
    event.stopPropagation();
    selectedMessage = messageBubble;
    openMessageMenu(selectedMessage, event);
  }
});

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

const alwaysOnCheckbox = document.getElementById("alwaysOnCheckbox");
const statusText = document.getElementById("statusText");

function updateStatusText() {
  if (alwaysOnCheckbox.checked) {
    statusText.textContent = "Always Connected";
    statusText.classList.add("fade-in");
  } else {
    statusText.textContent = "Disconnect after Inactivity";
    statusText.classList.add("fade-in");
  }
  setTimeout(() => {
    statusText.classList.remove("fade-in");
  }, 2000);
}

// Add event listener for the checkbox
alwaysOnCheckbox.addEventListener("change", updateStatusText);

const PING_INTERVAL = 150000; // 2.5 min.
const PONG_TIMEOUT = 10000; // 10 seconds

let pingInterval; // For ping intervals
let pongTimeout; // For pong timeout

function startPing() {
  if (alwaysOnCheckbox.checked) {
    pingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        if (alwaysOnCheckbox.checked) {
          ws.send(JSON.stringify({ type: "ping" }));
          startPongTimeout();
        }
      } else {
        if (alwaysOnCheckbox.checked) {
          console.warn("WebSocket is not open. Current state:", ws.readyState);
          reconnect();
        }
      }
    }, PING_INTERVAL);
  }
}

function startPongTimeout() {
  clearTimeout(pongTimeout);
  pongTimeout = setTimeout(() => {
    console.warn("No pong received. Attempting to reconnect...");
    reconnect();
  }, PONG_TIMEOUT);
}

function stopPing() {
  clearInterval(pingInterval);
  clearTimeout(pongTimeout);
}

function reconnect() {
  if (ws) {
    ws.close();
  }
  join(); // Call join to reconnect
}

function join() {
  if (ws) {
    ws.close();
  }

  ws = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
  );

  ws.onopen = () => {
    console.log("Connected to the server");
    ws.send(
      JSON.stringify({
        type: "join",
        lobby: currentLobby,
        username: username,
        role: role,
      })
    );

    chat.innerHTML = "";

    initializeLobbyData(currentLobby);

    if (alwaysOnCheckbox.checked) {
      startPing();
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    statusDiv.textContent = "Connection error";
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "pong") {
      clearTimeout(pongTimeout); // Clear pong timeout on receiving pong
      if (alwaysOnCheckbox.checked) {
        startPing();
      }
    } else if (data.type === "ROLE_CHANGE") {
      const { username, role } = data;

      // Update sessionStorage for the specific user
      sessionStorage.setItem(`role`, role);

      if (role === "banned") {
        window.location.href = "/banned.html";
      }

      // Optional: Log to confirm the change
      console.log(`Role of ${username} changed to ${role}`);
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
    } else if (data.type === "AdminClear") {
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
    clearInterval(pingInterval); // Clear ping interval on close
  };

  console.log(`Joining ${currentLobby} as ${username}`);
}

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

alwaysOnCheckbox.addEventListener("change", () => {
  clearInterval(pingInterval); // Clear existing interval
  if (alwaysOnCheckbox.checked) {
    startPing(); // Restart ping if "Always On" is checked
  } else {
    stopPing();
  }
});

document.querySelectorAll(".lobby-option").forEach((link) => {
  link.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default anchor behavior
    const lobbyName = this.getAttribute("data-lobby");

    if (lobbyName !== currentLobby) {
      if (lobbyName === "Programming") {
        let PasswortInput = prompt("Please enter Passwort!");
        if (PasswortInput !== "Passwort123!" ) {
          document.getElementById("burger").checked = false;
          return; 
        } else {
          // Update currentLobby to the new lobby name
          currentLobby = lobbyName;
          //change background randomly
          changeBackground();

          // Call the join function with the updated lobby name
          join();
          document.getElementById("burger").checked = false;
        }
      } else {
      // Update currentLobby to the new lobby name
      currentLobby = lobbyName;
      //change background randomly
      changeBackground();

      // Call the join function with the updated lobby name
      join();
      document.getElementById("burger").checked = false;
      }
    } else {
      console.log("Already connected to this lobby!");
    }
  });
});

document.querySelectorAll("#statuslobby").forEach((link) => {
  link.addEventListener("click", function (event) {
    event.preventDefault();
    //change background randomly
    changeBackground();
    reconnect();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  join();
});
