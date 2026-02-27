// --- KHỞI TẠO SOCKET VÀ BIẾN TOÀN CỤC ---
const socket = io();
let currentRoomCode = "";
let isRoomHost = false;
let allCards = [];
let customDeck = {};

// --- HÀM ẨN/HIỆN GIAO DIỆN ---
function toggleSection(sectionId) {
  const sections = [
    "login-section",
    "register-section",
    "character-section",
    "lobby-section",
    "friends-section",
    "room-selection-section",
    "in-room-section",
    "role-reveal-section",
    "card-dictionary-section",
  ];

  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  const targetEl = document.getElementById(sectionId);
  if (targetEl) targetEl.classList.remove("hidden");
}

// --- TÀI KHOẢN VÀ ĐĂNG NHẬP ---
async function register() {
  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  alert(data.message);
  if (response.ok) toggleSection("login-section");
}

async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) return alert(data.message);

  localStorage.setItem("user", JSON.stringify(data.user));
  if (!data.user.characterName) toggleSection("character-section");
  else showLobby(data.user.characterName);
}

async function createCharacter() {
  const characterName = document.getElementById("char-name").value;
  const user = JSON.parse(localStorage.getItem("user"));
  const response = await fetch("/api/auth/create-character", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, characterName }),
  });
  const data = await response.json();
  if (!response.ok) return alert(data.message);

  user.characterName = data.characterName;
  localStorage.setItem("user", JSON.stringify(user));
  alert(data.message);
  showLobby(data.characterName);
}

// --- SẢNH CHỜ & BẠN BÈ ---
function showLobby(characterName) {
  toggleSection("lobby-section");
  document.getElementById("welcome-text").innerText =
    `Chào mừng ${characterName} tới Làng!`;
}

async function showFriendsSection() {
  toggleSection("friends-section");
  await loadFriendsList();
}

async function loadFriendsList() {
  const user = JSON.parse(localStorage.getItem("user"));
  const listElement = document.getElementById("friends-list");
  listElement.innerHTML = "<li>Đang tải danh sách...</li>";
  const response = await fetch(`/api/friends/list/${user.characterName}`);
  const data = await response.json();
  listElement.innerHTML = "";

  if (data.friends && data.friends.length > 0) {
    data.friends.forEach((friendName) => {
      listElement.innerHTML += `<li style="padding: 10px; border-bottom: 1px solid #ddd;">${friendName}</li>`;
    });
  } else {
    listElement.innerHTML =
      "<li>Bạn chưa có người bạn nào. Cùng thêm bạn nhé!</li>";
  }
}

async function addFriend() {
  const friendName = document.getElementById("search-friend-name").value;
  const user = JSON.parse(localStorage.getItem("user"));
  if (!friendName) return alert("Vui lòng nhập tên nhân vật!");

  const response = await fetch("/api/friends/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      myName: user.characterName,
      friendName: friendName,
    }),
  });
  const data = await response.json();
  alert(data.message);
  if (response.ok) {
    document.getElementById("search-friend-name").value = "";
    await loadFriendsList();
  }
}

// --- TỪ ĐIỂN MA SÓI ---
async function showCardDictionary() {
  toggleSection("card-dictionary-section");
  const listElement = document.getElementById("dictionary-list");
  listElement.innerHTML =
    '<p style="text-align:center;">Đang tải dữ liệu thư viện...</p>';

  try {
    const response = await fetch("/api/cards");
    const cards = await response.json();
    listElement.innerHTML = "";

    let wolves = "",
      villagers = "",
      neutrals = "";
    cards.forEach((card) => {
      const color =
        card.team === "Sói" ? "red" : card.team === "Dân" ? "green" : "purple";
      const itemHtml = `
        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #ddd;">
          <strong style="color: ${color}; font-size: 16px;">${card.name}</strong>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #444;">${card.description}</p>
        </div>
      `;
      if (card.team === "Sói") wolves += itemHtml;
      else if (card.team === "Dân") villagers += itemHtml;
      else neutrals += itemHtml;
    });

    listElement.innerHTML = `
      <h4 style="color: red; border-bottom: 2px solid red; padding-bottom: 5px;">🐺 Phe Ma Sói</h4> ${wolves}
      <h4 style="color: green; border-bottom: 2px solid green; padding-bottom: 5px;">🧑‍🌾 Phe Dân Làng</h4> ${villagers}
      <h4 style="color: purple; border-bottom: 2px solid purple; padding-bottom: 5px;">🎭 Phe Trung Lập / Đặc Biệt</h4> ${neutrals}
    `;
  } catch (error) {
    listElement.innerHTML =
      '<p style="color: red;">Lỗi tải dữ liệu thư viện!</p>';
  }
}

// --- PHÒNG CHỜ & GAMEPLAY ---
function showRoomSection() {
  toggleSection("room-selection-section");
}

function createRoom() {
  const user = JSON.parse(localStorage.getItem("user"));
  socket.emit("create_room", user);
}

function joinRoom() {
  const roomCode = document.getElementById("room-code-input").value;
  const user = JSON.parse(localStorage.getItem("user"));
  if (!roomCode) return alert("Vui lòng nhập mã phòng!");
  socket.emit("join_room", { roomCode, user });
}

function leaveRoom() {
  window.location.reload();
}

async function loadCards() {
  const response = await fetch("/api/cards");
  allCards = await response.json();
  const list = document.getElementById("card-selection-list");
  list.innerHTML = "";

  allCards.forEach((card) => {
    customDeck[card._id] = 0;
    let teamColor =
      card.team === "Sói" ? "red" : card.team === "Dân" ? "green" : "purple";
    list.innerHTML += `
      <li style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        <span><strong style="color: ${teamColor}">${card.name}</strong></span>
        <div>
          <button onclick="updateCardCount('${card._id}', -1)" style="width: 30px; padding: 2px;">-</button>
          <span id="count-${card._id}" style="display: inline-block; width: 20px; text-align: center;">0</span>
          <button onclick="updateCardCount('${card._id}', 1)" style="width: 30px; padding: 2px;">+</button>
        </div>
      </li>
    `;
  });
}

function toggleMode() {
  const mode = document.querySelector('input[name="game-mode"]:checked').value;
  const customUI = document.getElementById("custom-mode-ui");
  if (mode === "custom") customUI.classList.remove("hidden");
  else customUI.classList.add("hidden");
}

function updateCardCount(cardId, change) {
  const current = customDeck[cardId];
  const newVal = current + change;
  if (newVal >= 0) {
    customDeck[cardId] = newVal;
    document.getElementById(`count-${cardId}`).innerText = newVal;
  }
}

function startGame() {
  const mode = document.querySelector('input[name="game-mode"]:checked').value;
  socket.emit("start_game", {
    roomCode: currentRoomCode,
    mode: mode,
    customDeck: customDeck,
  });
}

function playAgain() {
  socket.emit("play_again", currentRoomCode);
}

// --- LẮNG NGHE SOCKET TỪ SERVER ---
socket.on("room_created", (roomCode) => {
  currentRoomCode = roomCode;
  toggleSection("in-room-section");
  document.getElementById("current-room-code").innerText = roomCode;
  document.getElementById("host-controls").style.display = "block";
  document.getElementById("start-game-btn").style.display = "inline-block";
  loadCards();
});

socket.on("room_joined", (roomCode) => {
  currentRoomCode = roomCode;
  toggleSection("in-room-section");
  document.getElementById("current-room-code").innerText = roomCode;
  document.getElementById("host-controls").style.display = "none";
  document.getElementById("start-game-btn").style.display = "none";
});

socket.on("error_msg", (msg) => alert(msg));

socket.on("update_players", (players) => {
  const list = document.getElementById("players-in-room");
  list.innerHTML = "";

  const user = JSON.parse(localStorage.getItem("user"));
  const me = players.find((p) => p.characterName === user.characterName);
  isRoomHost = me && me.isHost ? true : false;

  players.forEach((p) => {
    const roleIcon = p.isHost ? "👑" : "👤";
    list.innerHTML += `<li style="padding: 5px; font-size: 18px;">${roleIcon} ${p.characterName}</li>`;
  });
});

socket.on("receive_role", (role) => {
  toggleSection("role-reveal-section");

  document.getElementById("role-name").innerText = role.name;
  document.getElementById("role-team").innerText = `Phe: ${role.team}`;
  document.getElementById("role-desc").innerText = role.description;

  const nameEl = document.getElementById("role-name");
  if (role.team === "Sói") nameEl.style.color = "red";
  else if (role.team === "Dân") nameEl.style.color = "green";
  else nameEl.style.color = "purple";

  if (isRoomHost) {
    document.getElementById("play-again-btn").style.display = "inline-block";
  } else {
    document.getElementById("play-again-btn").style.display = "none";
  }
});

socket.on("back_to_room", () => {
  toggleSection("in-room-section");
});
