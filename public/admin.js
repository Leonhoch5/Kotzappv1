document.addEventListener("DOMContentLoaded", () => {
  const username = sessionStorage.getItem("username"); // Get the username from sessionStorage

  // Check if the logged-in user is root
  if (username !== "root") {
    alert("Access denied. Only root can access this page.");
    window.location.href = "/index.html"; // Redirect to the main page
    return;
  }

  // Fetch all users when the button is clicked
  document.getElementById("fetch-users").addEventListener("click", () => {
    fetch("/admin/users", {
      headers: {
        "x-username": username, // Send the username in the headers
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const userList = document.getElementById("user-list");
          userList.innerHTML = ""; // Clear the list before adding users
          data.users.forEach((user) => {
            const li = document.createElement("li");
            li.textContent = user.username;
            userList.appendChild(li);
          });
        } else {
          alert("Error fetching users");
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  });

  // Delete a user when the button is clicked
  document.getElementById("delete-user").addEventListener("click", () => {
    const deleteUsername = document.getElementById("delete-username").value;

    if (!deleteUsername) {
      alert("Please enter a username to delete");
      return;
    }

    fetch("/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-username": username, // Send the username in the headers
      },
      body: JSON.stringify({ username: deleteUsername }), // Username to be deleted
    })
      .then((response) => response.json())
      .then((data) => {
        const status = document.getElementById("delete-user-status");
        if (data.success) {
          status.textContent = "User deleted successfully.";
          document.getElementById("delete-username").value = ""; // Clear input field
        } else {
          status.textContent = `Error: ${data.message}`;
        }
      })
      .catch((error) => {
        console.error("Error deleting user:", error);
      });
  });
  document.getElementById("make-admin").addEventListener("click", () => {
    const makeAdminUsername = document.getElementById(
      "make-admin-username"
    ).value;

    if (!makeAdminUsername) {
      alert("Please enter a username to make admin");
      return;
    }

    fetch("/admin/make-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-username": username, // Admin's username in headers for verification
      },
      body: JSON.stringify({ username: makeAdminUsername }), // Username to be promoted
    })
      .then((response) => response.json())
      .then((data) => {
        const status = document.getElementById("make-admin-status");
        if (data.success) {
          status.textContent = `User ${makeAdminUsername} has been made an admin.`;
          document.getElementById("make-admin-username").value = ""; // Clear input
        } else {
          status.textContent = `Error: ${data.message}`;
        }
      })
      .catch((error) => {
        console.error("Error making user admin:", error);
      });
  });

  // Ban a user when the ban button is clicked
  document.getElementById("ban-user").addEventListener("click", () => {
    const banUsername = document.getElementById("ban-username").value;

    if (!banUsername) {
      alert("Please enter a username to ban");
      return;
    }

    fetch("/admin/ban-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-username": username, // Send the admin's username in the headers
      },
      body: JSON.stringify({ username: banUsername }), // Username to be banned
    })
      .then((response) => response.json())
      .then((data) => {
        const status = document.getElementById("ban-user-status");
        if (data.success) {
          status.textContent = "User banned successfully.";
          document.getElementById("ban-username").value = ""; // Clear input field
        } else {
          status.textContent = `Error: ${data.message}`;
        }
      })
      .catch((error) => {
        console.error("Error banning user:", error);
      });
  });

  // Clear chat history
  document.getElementById("clear-chat").addEventListener("click", () => {
    const lobbyName = document.getElementById("clear-lobby").value;

    if (!lobbyName) {
      document.getElementById("clear-chat-status").textContent =
        "Please enter a lobby name.";
      return;
    }

    fetch("/admin/clear-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lobby: lobbyName }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          document.getElementById(
            "clear-chat-status"
          ).textContent = `Chat history cleared for lobby '${lobbyName}'.`;
        } else {
          document.getElementById("clear-chat-status").textContent =
            data.message;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  // View active lobbies
  document.getElementById("view-lobbies").addEventListener("click", () => {
    fetch("/admin/active-lobbies")
      .then((response) => response.json())
      .then((data) => {
        const lobbyList = document.getElementById("lobby-list");
        lobbyList.innerHTML = ""; // Clear current list

        data.lobbies.forEach((lobby) => {
          const li = document.createElement("li");
          li.textContent = lobby;
          lobbyList.appendChild(li);
        });
      })
      .catch((error) => {
        console.error("Error fetching active lobbies:", error);
      });
  });

  // Kick user from lobby
  document.getElementById("kick-user").addEventListener("click", () => {
    const usernameToKick = document.getElementById("kick-username").value;
    const lobbyToKick = document.getElementById("kick-lobby").value;

    if (!usernameToKick || !lobbyToKick) {
      document.getElementById("kick-user-status").textContent =
        "Please enter both username and lobby name.";
      return;
    }

    fetch("/admin/kick-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: usernameToKick, lobby: lobbyToKick }),
    })
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("kick-user-status").textContent = data.message;
      })
      .catch((error) => {
        console.error("Error kicking user:", error);
      });
  });
});
