// hospital-ai-backend/index.js

const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory session storage (replace with DB later)
const conversations = {};

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/**
 * Root check
 */
app.get("/", (req, res) => {
  res.send("🚑 Hospital AI Backend is running...");
});

/**
 * Ollama health check
 */
app.get("/health/ollama", async (req, res) => {
  try {
    const r = await fetch("http://127.0.0.1:11434/api/tags");
    if (!r.ok) {
      throw new Error(`Ollama returned ${r.status}`);
    }
    res.json({ status: "ok" });
  } catch (err) {
    res.status(503).json({
      status: "error",
      message: err.message,
    });
  }
});

/**
 * Chat endpoint (qwen3:4b)
 */
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  const sid = sessionId || uuidv4();

  const prompt = `
You are a factual and neutral AI assistant.
Rules:
Answer clearly and directly
Do not invent facts
If you are unsure, say you do not know
Do not add headings or labels
Do not repeat the question
${message}
`.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 480_000); // 480 seconds

  try {
    const response = await fetch(
      "http://127.0.0.1:11434/api/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "qwen3:4b",
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            num_ctx: 2048,
          },
        }),
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    let reply = (data.response || "").trim();
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
        source: "ollama-qwen3:4b",
      },
    };

    if (!conversations[sid]) {
      conversations[sid] = [];
    }
    conversations[sid].push(entry);

    res.json({
      sessionId: sid,
      ...entry,
    });
  } catch (err) {
    clearTimeout(timeout);

    console.error("Chat error:", {
      name: err.name,
      message: err.message,
      cause: err.cause,
      stack: err.stack,
    });

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
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(
    `🚑 Hospital AI Backend (qwen3:4b) running at http://localhost:${PORT}`
  );
});
