// hospital-ai-backend/index.js
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;
const conversations = {};

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hospital AI Backend is running...");
});

app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;
  const sid = sessionId || uuidv4();

  try {
    // Call Ollama locally
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: message,
        stream: false, // important: disable streaming for simple JSON response
      }),
    });

    const data = await response.json();
    const botReply = data.response;

    const entry = {
      user: { text: message, timestamp: new Date().toISOString() },
      bot: {
        text: botReply,
        timestamp: new Date().toISOString(),
        source: "ollama-mistral",
      },
    };

    if (!conversations[sid]) conversations[sid] = [];
    conversations[sid].push(entry);

    res.json({ sessionId: sid, ...entry });
  } catch (err) {
    res.status(500).json({ error: "Local LLM error", details: err.message });
  }
});

app.get("/logs/:sessionId", (req, res) => {
  const sid = req.params.sessionId;
  if (!conversations[sid])
    return res.status(404).json({ error: "Session not found" });
  res.json(conversations[sid]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
