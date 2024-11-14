let selectedLobbyElement = null;
let selectedUserElement = null;

document.addEventListener("DOMContentLoaded", () => {
  const username = sessionStorage.getItem("username");
  const role = sessionStorage.getItem("role");

  if (role !== "admin") {
    alert("Access denied. Only Admin can access this page.");
    window.location.href = "/index.html";
    return;
  }

 const fetchUsers = () => {
  fetch("/admin/users", { headers: { "x-username": username || "" } })
    .then((response) => response.json())
    .then((data) => {
      const userList = document.getElementById("user-list");
      userList.innerHTML = "";

      const roleOrder = { admin: 1, user: 2, banned: 3 };
      data.users.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

      let previousRole = null;

      data.users.forEach((user, index) => {
        if (index === 0 || previousRole !== user.role) {
          const separator = document.createElement("li");
          separator.className = "role-separator";
          separator.textContent = `--- ${user.role.toUpperCase()} ---`;
          userList.appendChild(separator);
        }

        const li = document.createElement("li");
        li.textContent = `${user.username} -- ${user.role}`;
        li.dataset.username = user.username;
        li.dataset.role = user.role;
        li.addEventListener("click", (event) => {
          event.stopPropagation();
          openUserMenu(event.currentTarget, user);
        });
        userList.appendChild(li);

        previousRole = user.role;
      });
    })
    .catch((error) => console.error("Error fetching users:", error));
};

  const openUserMenu = (userElement, userData) => {
    const menu = document.getElementById("messageMenu");
    selectedUserElement = userElement;
    const rect = userElement.getBoundingClientRect();

    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom}px`; 
    menu.style.left = `${rect.left}px`; 

    // Display the menu
    menu.style.display = "block";

    // Close menu when clicking outside
    document.removeEventListener("click", closeUserMenu);
    document.addEventListener("click", closeUserMenu);
  };

  const closeUserMenu = (event) => {
    const menu = document.getElementById("messageMenu");
    if (!menu.contains(event?.target)) {
      menu.style.display = "none";
      document.removeEventListener("click", closeUserMenu);
    }
  };

  const updateUserRole = (url, successMessage) => {
  const targetUsername = selectedUserElement.dataset.username;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: targetUsername }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.success) {
        alert(`Error: ${data.message}`);
      }
      fetchUsers(); 
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred while processing the request.");
    });
  closeUserMenu();
};

document.getElementById("makeAdmin").addEventListener("click", () => {
  if (window.confirm(`Are you sure you want to make ${selectedUserElement.dataset.username} an Admin?`)) {
    updateUserRole(
      "/admin/make-admin",
      `${selectedUserElement.dataset.username} is now an admin.`
    );
  }
});

document.getElementById("makeUser").addEventListener("click", () => {
  if (window.confirm(`Are you sure you want to make ${selectedUserElement.dataset.username} a User?`)) {
    updateUserRole(
      "/admin/make-user",
      `${selectedUserElement.dataset.username} is now a user.`
    );
  }
});

document.getElementById("banUserAdmin").addEventListener("click", () => {
  if (window.confirm(`Are you sure you want to ban ${selectedUserElement.dataset.username}?`)) {
    updateUserRole(
      "/admin/ban-user",
      `${selectedUserElement.dataset.username} has been banned.`
    );
  }
});

document.getElementById("deleteUser").addEventListener("click", () => {
  const targetUsername = selectedUserElement.dataset.username;
  if (window.confirm(`Are you sure you want to delete ${targetUsername}?`)) {
    fetch("/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: targetUsername }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log(`${targetUsername} has been deleted.`);
          selectedUserElement.remove(); 
        } else {
          console.error(`Error: ${data.message}`);
        }
      })
      .catch((error) => console.error("Error deleting user:", error));
    closeUserMenu();
  }
});

const openLobbyMenu = (lobbyElement, lobbyName) => {
  const lobbyMenu = document.getElementById("lobbyMenu");
  selectedLobbyElement = lobbyElement;
  const rect = lobbyElement.getBoundingClientRect();

  lobbyMenu.style.position = "fixed";
  lobbyMenu.style.top = `${rect.bottom}px`;
  lobbyMenu.style.left = `${rect.left}px`;
  lobbyMenu.style.display = "block";

  document.removeEventListener("click", closeLobbyMenu);
  document.addEventListener("click", closeLobbyMenu);
};

const closeLobbyMenu = (event) => {
  const lobbyMenu = document.getElementById("lobbyMenu");
  if (!lobbyMenu.contains(event?.target)) {
    lobbyMenu.style.display = "none";
    document.removeEventListener("click", closeLobbyMenu);
  }
};

document.getElementById("clearHistory").addEventListener("click", () => {
  const lobbyName = selectedLobbyElement.textContent;
  if (window.confirm(`Are you sure you want to clear the chat history for lobby '${lobbyName}'?`)) {
    fetch("/admin/clear-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lobby: lobbyName }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          console.error(`Error: ${data.message}`);
        }
      })
      .catch((error) => console.error("Error:", error));
    closeLobbyMenu();
  }
});

document.getElementById("closeLobby").addEventListener("click", () => {
  const lobbyName = selectedLobbyElement.textContent;
  if (window.confirm(`Are you sure you want to close the lobby '${lobbyName}'?`)) {
    fetch("/admin/close-lobby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lobby: lobbyName }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          console.error(`Error: ${data.message}`);
        }
        if (data.success) {
          selectedLobbyElement.remove();
        }
      })
      .catch((error) => console.error("Error:", error));
    closeLobbyMenu();
  }
});

  document.getElementById("view-lobbies").addEventListener("click", () => {
    fetch("/admin/active-lobbies")
      .then((response) => response.json())
      .then((data) => {
        const lobbyList = document.getElementById("lobby-list");
        lobbyList.innerHTML = "";
        if (data.lobbies.length === 0) {
          lobbyList.innerHTML = "<li>No active lobbies found.</li>";
          return;
        }
        data.lobbies.forEach((lobby) => {
          const li = document.createElement("li");
          li.textContent = lobby;
          li.addEventListener("click", (event) => {
            event.stopPropagation();
            openLobbyMenu(event.currentTarget, lobby);
          });
          lobbyList.appendChild(li);
        });
      })
      .catch((error) => console.error("Error fetching active lobbies:", error));
  });
  
  document.getElementById("kick-user").addEventListener("click", () => {
    const usernameToKick = document.getElementById("kick-username").value;
    const lobbyToKick = document.getElementById("kick-lobby").value;
    fetch("/admin/kick-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usernameToKick, lobby: lobbyToKick }),
    })
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("kick-user-status").textContent = data.message;
      })
      .catch((error) => console.error("Error kicking user:", error));
  });

  document.getElementById("fetch-users").addEventListener("click", fetchUsers);

  document.addEventListener("scroll", closeUserMenu);
  document.addEventListener("scroll", closeLobbyMenu);
});
