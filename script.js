const input = document.getElementById("userInput");
const chatMessages = document.getElementById("chatMessages");
const typingIndicator = document.getElementById("typingIndicator");
const sendButton = document.querySelector(".chat-input button");
const conversations = {}; // { sessionId: [ {user, bot}, ... ] }
let sessionId = null;
let welcomeShown = false;
const viewHistoryBtn = document.getElementById("viewHistoryBtn");
const historyModal = document.getElementById("historyModal");
const closeHistory = document.getElementById("closeHistory");
const historyContent = document.getElementById("historyContent");
const downloadHistoryBtn = document.getElementById("downloadHistoryBtn");


viewHistoryBtn.addEventListener("click", async () => {
  if (!sessionId) {
    alert("No session yet. Send a message first.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/logs/${sessionId}`);
    const logs = await response.json();

    // Clear old history
    historyContent.innerHTML = "";

    // Show each log entry
    logs.forEach(entry => {
      const userMessage = document.createElement("div");
      userMessage.className = "message user";
      userMessage.textContent = entry.user.text;
      historyContent.appendChild(userMessage);

      const botMessage = document.createElement("div");
      botMessage.className = "message bot";
      botMessage.textContent = entry.bot.text;
      historyContent.appendChild(botMessage);
    });

    // Open modal
    historyModal.style.display = "block";
  } catch (error) {
    alert("Error fetching history.");
  }
});

// Close modal when clicking X
closeHistory.addEventListener("click", () => {
  historyModal.style.display = "none";
});

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  if (event.target === historyModal) {
    historyModal.style.display = "none";
  }
});


userInput.addEventListener("input", () => {
  sendButton.disabled = userInput.value.trim() === "";
  userInput.style.height = "auto";
  userInput.style.height = userInput.scrollHeight + "px";
});

// Welcome Text
// window.addEventListener("load", () => {
//   const welcomeMessage = document.createElement("div");
//   welcomeMessage.className = "message bot";
//   chatMessages.appendChild(welcomeMessage);

//   const welcomeText =
//     "Hello! I am your hospital AI assistant. How can I help you today?";

//   typeWriterEffect(welcomeMessage, welcomeText, 18);
// });

function showWelcomeMessage() {
  chatMessages.innerHTML = ""; // clear old chat (optional)

  const welcomeMessage = document.createElement("div");
  welcomeMessage.className = "message bot";
  chatMessages.appendChild(welcomeMessage);

  const welcomeText =
    "Hello! I am your hospital AI assistant. How can I help you today?";

  typeWriterEffect(welcomeMessage, welcomeText, 18);
}

// ✅ Single Enter sends, Shift+Enter makes new line
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (e.shiftKey) {
      return; // allow newline
    }
    e.preventDefault(); // block default newline
    sendMessage();
  }
});

async function sendMessage() {
  const messageText = input.value.trim();
  if (messageText === "") return;

  const userMessage = document.createElement("div");
  userMessage.className = "message user";
  userMessage.textContent = messageText;
  chatMessages.appendChild(userMessage);

  input.value = "";
  smoothScrollToBottom();
  typingIndicator.style.display = "block";

  try {
    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageText, sessionId }),
    });

    const data = await response.json();
    sessionId = data.sessionId; // ✅ save sessionId

    typingIndicator.style.display = "none";

    const botMessage = document.createElement("div");
    botMessage.className = "message bot";
    chatMessages.appendChild(botMessage);
    typeWriterEffect(botMessage, data.bot.text, 18);
  } catch (error) {
    typingIndicator.style.display = "none";
    const errorMessage = document.createElement("div");
    errorMessage.className = "message bot";
    errorMessage.textContent = "Error connecting to backend.";
    chatMessages.appendChild(errorMessage);
  }
  console.log("Current sessionId:", sessionId);
}


function typeWriterEffect(element, text, speed = 20) {
  let index = 0;

  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.textContent = "▍";

  element.textContent = "";
  element.appendChild(cursor);

  function type() {
    if (index < text.length) {
      cursor.remove();
      element.textContent += text.charAt(index);
      element.appendChild(cursor);
      index++;
      smoothScrollToBottom();
      setTimeout(type, speed);
    } else {
      cursor.remove();
    }
  }

  type();
}

function showThinkingMessage() {
  const thinkingMessage = document.createElement("div");
  thinkingMessage.className = "message bot thinking";
  thinkingMessage.textContent = "Thinking";
  typingIndicator.style.display = "none";

  chatMessages.appendChild(thinkingMessage);
  smoothScrollToBottom();

  let dots = 0;
  const interval = setInterval(() => {
    dots = (dots + 1) % 4;
    thinkingMessage.textContent = "AI making rasponses" + ".".repeat(dots);
  }, 400);

  return { thinkingMessage, interval };
}

function smoothScrollToBottom() {
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: "smooth",
  });
}

downloadHistoryBtn.addEventListener("click", async () => {
  if (!sessionId) {
    alert("No session to download.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/logs/${sessionId}`);
    const logs = await response.json();

    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-history-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("Failed to download history.");
  }
});

