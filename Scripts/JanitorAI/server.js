const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configure your custom API keys here
const VALID_API_KEYS = new Set([
  process.env.API_KEY || 'custom-key'
]);

// Middleware to check API key
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    return res.status(401).json({
      error: {
        message: 'Invalid API key',
        type: 'invalid_request_error'
      }
    });
  }
  next();
};

app.use(bodyParser.json());
app.use(cors());

// Mock models endpoint
app.get('/v1/models', apiKeyAuth, (req, res) => {
  res.json({
    object: 'list',
    data: [{
      id: 'mock-model-1',
      object: 'model',
      created: Date.now(),
      owned_by: 'custom-owner'
    }]
  });
});

// Mock chat completion endpoint
app.post('/v1/chat/completions', apiKeyAuth, (req, res) => {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: {
        message: 'Messages array is required',
        type: 'invalid_request_error'
      }
    });
  }

  // Generate mock response
  const mockResponse = {
    id: 'mock-' + Math.random().toString(36).substr(2, 9),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'mock-model-1',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: 'This is a mock response from the custom OpenAI-compatible server'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }
  };

  console.log(req.body)
  res.json(mockResponse);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      type: 'server_error'
    }
  });
});

app.listen(port, () => {
  console.log(`Mock OpenAI server running on port ${port}`);
  console.log(`Valid API keys: ${Array.from(VALID_API_KEYS).join(', ')}`);
});