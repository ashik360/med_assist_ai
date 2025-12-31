const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;
const conversations = [];
const { v4: uuidv4 } = require('uuid');


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hospital AI Backend is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
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
