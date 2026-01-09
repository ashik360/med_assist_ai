<<<<<<< Updated upstream
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;
const conversations = [];
const { v4: uuidv4 } = require('uuid');

=======
// hospital-ai-backend/index.js

const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;

// In-memory session storage (replace with DB later)
const conversations = {};
>>>>>>> Stashed changes

app.use(cors());
app.use(express.json({ limit: "1mb" }));

<<<<<<< Updated upstream
app.get('/', (req, res) => {
  res.send('Hospital AI Backend is running...');
=======
/**
 * Root check
 */
app.get("/", (req, res) => {
  res.send("Hospital AI Backend is running...");
});

/**
 * Ollama health check
 */
app.get("/health/ollama", async (req, res) => {
  try {
    const r = await fetch("http://localhost:11434/api/tags");
    if (!r.ok) throw new Error("Ollama not available");
    res.json({ status: "ok" });
  } catch (err) {
    res.status(503).json({ status: "error", message: err.message });
  }
});

/**
 * Chat endpoint (Phi)
 */
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  const sid = sessionId || uuidv4();

  /**
   * Phi-optimized prompt:
   * - No labels (Question/Answer)
   * - No role-play
   * - Allows refusal
   * - Natural output
   */
  const prompt = `
You are a factual and neutral AI assistant.
Rules:
- Answer clearly and directly
- Do not invent facts
- If you are unsure, say you do not know
- Do not add headings or labels
- Do not repeat the question

${message}
`.trim();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi",
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          num_ctx: 2048,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama error ${response.status}`);
    }

    const data = await response.json();

    let reply = (data.response || "").trim();

    // Safety fallback (rare but useful)
    if (!reply) {
      reply = "I’m not able to provide a reliable answer at the moment.";
    }

    const entry = {
      user: {
        text: message,
        timestamp: new Date().toISOString(),
      },
      bot: {
        text: reply,
        timestamp: new Date().toISOString(),
        source: "ollama-phi",
      },
    };

    if (!conversations[sid]) conversations[sid] = [];
    conversations[sid].push(entry);

    res.json({
      sessionId: sid,
      ...entry,
    });
  } catch (err) {
    console.error("Chat error:", err.name, err.message);

    res.status(500).json({
      error: "LLM processing failed",
      details:
        err.name === "AbortError"
          ? "Model took too long to respond"
          : err.message,
    });
  }
});

/**
 * Conversation logs
 */
app.get("/logs/:sessionId", (req, res) => {
  const sid = req.params.sessionId;
  if (!conversations[sid]) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(conversations[sid]);
>>>>>>> Stashed changes
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🚑 Hospital AI Backend (Phi) running at http://localhost:${PORT}`);
});

// post - structured

app.post('/chat', (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message is required" });
  }

  // If no sessionId provided, create one
  const sid = sessionId || uuidv4();

  const botReply = `You said: "${message}". I will process this soon.`;

  const entry = {
    user: {
      text: message,
      timestamp: new Date().toISOString()
    },
    bot: {
      text: botReply,
      timestamp: new Date().toISOString(),
      source: "hospital-ai-backend"
    }
  };

  // Initialize session if not exists
  if (!conversations[sid]) {
    conversations[sid] = [];
  }
  conversations[sid].push(entry);

  res.json({ sessionId: sid, ...entry });
});


app.get('/logs/:sessionId', (req, res) => {
  const sid = req.params.sessionId;
  if (!conversations[sid]) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(conversations[sid]);
});
