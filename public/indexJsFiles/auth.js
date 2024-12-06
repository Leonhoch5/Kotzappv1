function decryptData(encryptedData) {
  try {
    // Basic validation check
    if (!encryptedData || typeof encryptedData !== "string") {
      throw new Error("Invalid encrypted data format");
    }
    return JSON.parse(atob(encryptedData)); // Decode from base64, then parse JSON
  } catch (error) {
    console.error("Error decrypting data:", error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted.");
      } else {
        console.log("Notification permission denied or dismissed.");
      }
    });
  }
  // Check for admin privileges
  const adminLink = document.getElementById("adminLink");
  const adminLinkMobile = document.getElementById("adminLinkMobile");
  const createLobby = document.getElementById("createLobbyButton");
  const role = decryptData(sessionStorage.getItem("role")); // Get the role from sessionStorage
  if (role === "banned") {
    window.location.href = "/banned.html";
  }
  if (role !== "admin" && role !== "owner") {
    adminLink.style.display = "none";
    adminLinkMobile.style.display = "none";
    createLobby.style.display = "none";
  }
});

const tooltip = document.getElementById("tooltip");
const icons = document.querySelectorAll(".icon");

// Show tooltip and position it based on mouse movement for icons
icons.forEach((icon) => {
  icon.addEventListener("mouseenter", (event) => {
    const iconText = event.target.getAttribute("data-tooltip");
    tooltip.textContent = iconText; // Set the tooltip text
    tooltip.style.display = "block"; // Show the tooltip
  });

  icon.addEventListener("mousemove", (event) => {
    tooltip.style.left = `${event.pageX + 10}px`; // Position tooltip to the right of the cursor
    tooltip.style.top = `${event.pageY + 10}px`; // Position tooltip below the cursor
  });

  icon.addEventListener("mouseleave", () => {
    tooltip.style.display = "none"; // Hide the tooltip when not hovering
  });
});

// Show tooltip for the statuslobby
const statusLobby = document.getElementById("statuslobby");

statusLobby.addEventListener("mouseenter", (event) => {
  const iconText = event.target.getAttribute("data-tooltip");
  tooltip.textContent = iconText; // Set the tooltip text
  tooltip.style.display = "block"; // Show the tooltip
});

statusLobby.addEventListener("mousemove", (event) => {
  tooltip.style.left = `${event.pageX + 10}px`; // Position tooltip to the right of the cursor
  tooltip.style.top = `${event.pageY + 10}px`; // Position tooltip below the cursor
});

statusLobby.addEventListener("mouseleave", () => {
  tooltip.style.display = "none"; // Hide the tooltip when not hovering
});

const status = document.getElementById("status");
status.addEventListener("mouseenter", (event) => {
  const iconText = event.target.getAttribute("data-tooltip");
  tooltip.textContent = iconText; // Set the tooltip text
  tooltip.style.display = "block"; // Show the tooltip
});

status.addEventListener("mousemove", (event) => {
  tooltip.style.left = `${event.pageX + 10}px`; // Position tooltip to the right of the cursor
  tooltip.style.top = `${event.pageY + 10}px`; // Position tooltip below the cursor
});

status.addEventListener("mouseleave", () => {
  tooltip.style.display = "none"; // Hide the tooltip when not hovering
});

const clock = document.getElementById("clock");
clock.addEventListener("mouseenter", (event) => {
  const iconText = event.target.getAttribute("data-tooltip");
  tooltip.textContent = iconText; // Set the tooltip text
  tooltip.style.display = "block"; // Show the tooltip
});

clock.addEventListener("mousemove", (event) => {
  tooltip.style.left = `${event.pageX + 10}px`; // Position tooltip to the right of the cursor
  tooltip.style.top = `${event.pageY + 10}px`; // Position tooltip below the cursor
});

clock.addEventListener("mouseleave", () => {
  tooltip.style.display = "none"; // Hide the tooltip when not hovering
});

const count = document.getElementById("count");
count.addEventListener("mouseenter", (event) => {
  const iconText = event.target.getAttribute("data-tooltip");
  tooltip.textContent = iconText; // Set the tooltip text
  tooltip.style.display = "block"; // Show the tooltip
});

count.addEventListener("mousemove", (event) => {
  tooltip.style.left = `${event.pageX + 10}px`; // Position tooltip to the right of the cursor
  tooltip.style.top = `${event.pageY + 10}px`; // Position tooltip below the cursor
});

count.addEventListener("mouseleave", () => {
  tooltip.style.display = "none"; // Hide the tooltip when not hovering
});

const lobbyOption = document.querySelectorAll(".lobby-option");

// Show tooltip and position it based on mouse movement for icons
lobbyOption.forEach((lobbyOption) => {
  lobbyOption.addEventListener("mouseenter", (event) => {
    const iconText = event.target.getAttribute("data-tooltip");
    tooltip.textContent = iconText; // Set the tooltip text
    tooltip.style.display = "block"; // Show the tooltip
  });

  lobbyOption.addEventListener("mousemove", (event) => {
    tooltip.style.left = `${event.pageX + 10}px`; // Position tooltip to the right of the cursor
    tooltip.style.top = `${event.pageY + 10}px`; // Position tooltip below the cursor
  });

  lobbyOption.addEventListener("mouseleave", () => {
    tooltip.style.display = "none"; // Hide the tooltip when not hovering
  });
});

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const timeString = `${hours}:${minutes}:${seconds}`;

  document.getElementById("clock").textContent = timeString;
}

// Update the clock every second
setInterval(updateClock, 1000);

// Initial call to set the clock right away
updateClock();

document.getElementById("burger").addEventListener("change", () => {
    document.getElementById("burgerHelper").checked = document.getElementById("burger").checked;
});

function adjustChatForIOS() {
  const platform = navigator.platform || "";
  const chatElement = document.getElementById("chat");

  const isIOS = /iPhone|iPad|iPod/.test(platform) || 
                (/Mac/.test(platform) && 'ontouchend' in document);

  const isMacOSDesktop = /Mac/.test(platform) && !('ontouchend' in document);

  if (isIOS && !isMacOSDesktop) {
    chatElement.style.padding = "10px";
  }
}

window.addEventListener("load", adjustChatForIOS);