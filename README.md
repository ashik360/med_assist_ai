# Hospital AI Backend

This is a simple backend API for a hospital AI application, powered by a natural language processing model (Phi) that interacts with users, provides factual responses, and stores conversation logs.

## Table of Contents
1. [Technologies Used](#technologies-used)
2. [Installation](#installation)
3. [Running the Server](#running-the-server)
4. [API Endpoints](#api-endpoints)
5. [License](#license)

## Technologies Used

- **Node.js**: Server-side JavaScript environment.
- **Express.js**: Web framework for Node.js.
- **Ollama**: Model API for natural language processing (Phi model).
- **UUID**: For generating unique session IDs.
- **CORS**: Middleware to handle cross-origin requests.
- **Fetch**: API request library to interact with Ollama model locally.

## Installation

To set up this backend on your local machine, follow the steps below:

### 1. Clone the repository
```bash
git clone <repository-url>
cd hospital-ai-backend


2. Install dependencies

Run the following command to install all required dependencies:

npm install

3. Set up Ollama (Local Model Server)

This backend interacts with an Ollama server running on your local machine. Ensure that Ollama is installed and running:

Download and set up Ollama
.

Run Ollama's API server on the default port (11434) for it to be accessible by the backend.

Running the Server

After installation and setup, start the backend server with the following command:

npm start


By default, the server will run on http://localhost:3000.

API Endpoints
1. Root Endpoint: /

GET: A simple check to verify if the backend is running.

Response: Hospital AI Backend is running...

2. Ollama Health Check: /health/ollama

GET: Health check for the Ollama model.

Response:

status: "ok" if Ollama is available.

status: "error" if Ollama is down, with an error message.

3. Chat Endpoint: /chat

POST: This endpoint handles user messages and returns the AI's response.

Request Body:

{
  "message": "User's message here",
  "sessionId": "optional-session-id"
}


message: The user's input message.

sessionId: Optionally, pass an existing session ID to continue the conversation.

Response:

{
  "sessionId": "generated-or-passed-session-id",
  "user": {
    "text": "User's message",
    "timestamp": "timestamp"
  },
  "bot": {
    "text": "AI's response",
    "timestamp": "timestamp",
    "source": "ollama-phi"
  }
}


sessionId: Unique session identifier (new or passed).

user.text: User's message.

bot.text: AI's response.

source: Source of the response (always ollama-phi for this implementation).

4. Conversation Logs: /logs/:sessionId

GET: Retrieve the conversation history for a specific session.

Request Parameters:

sessionId: The ID of the session to retrieve logs for.

Response:

[
  {
    "user": {
      "text": "User's message",
      "timestamp": "timestamp"
    },
    "bot": {
      "text": "AI's response",
      "timestamp": "timestamp",
      "source": "ollama-phi"
    }
  }
]


Returns a list of messages exchanged during the session.

Error Handling

400 Bad Request: When the message is missing or invalid in the /chat endpoint.

404 Not Found: When the session ID does not exist in /logs/:sessionId.

503 Service Unavailable: If the Ollama model server is not available during the health check.

500 Internal Server Error: If there is an issue processing the chat request (e.g., the model is unresponsive).

License

This project is open-source and available under the MIT License.
