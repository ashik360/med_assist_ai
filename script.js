// DOM Elements
const input = document.getElementById("userInput");
const chatMessages = document.getElementById("chatMessages");
const typingIndicator = document.getElementById("typingIndicator");
const sendButton = document.querySelector(".chat-input button");
const viewHistoryBtn = document.getElementById("viewHistoryBtn");
const historyModal = document.getElementById("historyModal");
const closeHistory = document.getElementById("closeHistory");
const historyContent = document.getElementById("historyContent");
const downloadHistoryBtn = document.getElementById("downloadHistoryBtn");
const aiProgressBar = document.getElementById("aiProgressBar");
const aiThinkingText = document.getElementById("aiThinkingText");

const conversations = [];
let sessionId = null;
let welcomeShown = false;

// Event Listeners

// View History Button
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
        logs.forEach((entry) => {
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

// Close Modal when X is clicked
closeHistory.addEventListener("click", () => {
    historyModal.style.display = "none";
});

// Close Modal when clicking outside
window.addEventListener("click", (event) => {
    if (event.target === historyModal) {
        historyModal.style.display = "none";
    }
});

// DOMContentLoaded event
document.addEventListener("DOMContentLoaded", function () {
    const floatingIcon = document.getElementById("floatingIcon");
    const chatContainer = document.getElementById("chatContainer");
    const closeChatBtn = document.getElementById("closeChatBtn");
    const toggleFullscreenBtn = document.getElementById("toggleFullscreenBtn");

    // Toggle chat visibility when floating icon is clicked
    floatingIcon.addEventListener("click", function () {
        chatContainer.classList.add("visible");
        showWelcomeMessage();
    });

    // Show Welcome Message
    function showWelcomeMessage() {
        if (welcomeShown) return;

        chatMessages.innerHTML = ""; // clear old chat (optional)
        const welcomeMessage = document.createElement("div");
        welcomeMessage.className = "message bot";
        chatMessages.appendChild(welcomeMessage);

        const welcomeText = "Hello! I am your hospital AI assistant. How can I help you today?";
        typeWriterEffect(welcomeMessage, welcomeText, 18);

        welcomeShown = true;
    }

    // Close chat when close button is clicked
    closeChatBtn.addEventListener("click", function () {
        chatContainer.classList.remove("visible");
    });

    // Fullscreen toggle functionality
    toggleFullscreenBtn.addEventListener("click", function () {
        if (chatContainer.classList.contains("compact")) {
            chatContainer.classList.remove("compact");
            chatContainer.classList.add("expanded");
            toggleFullscreenBtn.textContent = "⛶";
            toggleFullscreenBtn.title = "Collapse";
        } else {
            chatContainer.classList.remove("expanded");
            chatContainer.classList.add("compact");
            toggleFullscreenBtn.textContent = "⛶";
            toggleFullscreenBtn.title = "Expand to Fullscreen";
        }
    });

    // Close chat when clicking outside
    document.addEventListener("click", function (event) {
        const isClickInsideChat = chatContainer.contains(event.target);
        const isClickOnFloatingIcon = floatingIcon.contains(event.target);
        if (!isClickInsideChat && !isClickOnFloatingIcon && chatContainer.classList.contains("visible")) {
            chatContainer.classList.remove("visible");
        }
    });
});

// Input field adjustments
userInput.addEventListener("input", () => {
    sendButton.disabled = userInput.value.trim() === "";
    userInput.style.height = "auto";
    userInput.style.height = userInput.scrollHeight + "px";
});

// Keydown event for message send (Enter key)
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        if (e.shiftKey) {
            return; // allow newline
        }
        e.preventDefault(); // block default newline
        sendMessage();
    }
});

// Send message function
async function sendMessage() {
  const messageText = input.value.trim();
  if (messageText === "") return;

  const userMessage = document.createElement("div");
  userMessage.className = "message user";
  userMessage.textContent = messageText;
  chatMessages.appendChild(userMessage);

  input.value = "";
  smoothScrollToBottom();

  try {
    startAIThinking();

    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageText, sessionId }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Backend error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    stopAIThinking();

    sessionId = data.sessionId;

    const botMessage = document.createElement("div");
    botMessage.className = "message bot";
    chatMessages.appendChild(botMessage);

    typeWriterEffect(botMessage, data.bot.text, 18);
  } catch (error) {
    stopAIThinking();
    console.error("Chat error:", error);

    const errorMessage = document.createElement("div");
    errorMessage.className = "message bot";
    errorMessage.textContent = "Error connecting to backend.";
    chatMessages.appendChild(errorMessage);
  }

  console.log("Current sessionId:", sessionId);
}


// Typewriter effect for bot messages
function typeWriterEffect(element, text, speed = 20) {
    let index = 0;
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.textContent = "▍";
    element.textContent = ""; // clear old text
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

// AI thinking animation (dots)
let dotCount = 0;
let currentText = "AI is thinking";

function animateDots() {
    dotCount = (dotCount + 1) % 4; // 0 to 3 dots
    aiThinkingText.textContent = currentText + ".".repeat(dotCount);
}

// Start dot animation
const dotInterval = setInterval(animateDots, 500);

// Change text after 3 seconds
setTimeout(() => {
    currentText = "Assistant is writing";
    dotCount = 0;
}, 3000);

// Smooth scroll to bottom of chat
function smoothScrollToBottom() {
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: "smooth",
    });
}

// Download history button functionality
downloadHistoryBtn.addEventListener("click", async () => {
    if (!sessionId) {
        alert("No session to download.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/logs/${sessionId}`);
        const logs = await response.json();

        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
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

// Show thinking animation
function startAIThinking() {
    aiProgressBar.style.opacity = "1";
    aiThinkingText.style.opacity = "1";
}

// Stop thinking animation
function stopAIThinking() {
    aiProgressBar.style.opacity = "0";
    aiThinkingText.style.opacity = "0";
}
