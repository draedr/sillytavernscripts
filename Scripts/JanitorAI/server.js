const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const app = express();
const port = process.env.PORT || 3000;

// Configure your custom API keys here
const VALID_API_KEYS = new Set([
  process.env.API_KEY || 'custom-key'
]);

// Keep track of character names we've seen
const loggedCharacters = new Set();

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

// Function to extract character name from messages
function extractCharacterName(messages) {
  // Look through all messages
  for (const message of messages) {
    if (message.content) {
      // First, remove system tags to avoid matching them
      const contentWithoutSystem = message.content.replace(/<system>.*?<\/system>/gs, '');
      
      // Try to find character tags like <Scarlett>
      const characterTagMatch = contentWithoutSystem.match(/<([A-Za-z][^>\s]+)[\s>]/);
      if (characterTagMatch && characterTagMatch[1]) {
        // Exclude common non-character tags
        const name = characterTagMatch[1];
        if (!['system', 'scenario', 'roleplay_guidlines', '/'].includes(name.toLowerCase())) {
          return name;
        }
      }
      
      // Look for Name: pattern as a fallback
      const nameColon = contentWithoutSystem.match(/Name:\s*([^,\n]+)/i);
      if (nameColon && nameColon[1]) {
        return nameColon[1].trim();
      }
    }
  }
  
  // Default if no name found
  return "unknown";
}

async function logRequest(body, characterName = "unknown") {
  try {
    // Format timestamp
    const timestamp = new Date().toISOString();
    
    // Create a readable log entry
    const logEntry = `==== Request at ${timestamp} ====\n\n${
      typeof body === 'string' 
        ? body 
        : JSON.stringify(body, null, 2)
    }\n\n${'='.repeat(50)}\n\n`;
    
    // Create a sanitized version of the character name for the filename
    // Remove any characters that might cause issues in filenames
    const safeCharName = characterName.toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');
    
    // Create filename based on character name
    const filename = `request_${safeCharName}.log`;
    
    // Check if we've seen this character before
    const isNewCharacter = !loggedCharacters.has(safeCharName);
    
    // Add to our set of logged characters
    loggedCharacters.add(safeCharName);
    
    // Check if file exists
    let fileExists = false;
    try {
      await fs.access(filename);
      fileExists = true;
    } catch {
      fileExists = false;
    }
    
    // Create header for new file
    let fileContent = '';
    if (isNewCharacter || !fileExists) {
      fileContent = `===== LOG FILE FOR CHARACTER: ${characterName} =====\nCreated: ${timestamp}\n\n${logEntry}`;
    } else {
      fileContent = logEntry;
    }
    
    // Write the content (append or create new)
    if (fileExists) {
      await fs.appendFile(filename, fileContent);
    } else {
      await fs.writeFile(filename, fileContent);
      console.log(`Created new log file for character: ${characterName}`);
    }
    
    return { filename, isNewCharacter };
  } catch (error) {
    console.error('Failed to log request:', error);
    return { filename: 'error-log.log', isNewCharacter: false };
  }
}

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
app.post('/v1/chat/completions', apiKeyAuth, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: {
        message: 'Messages array is required',
        type: 'invalid_request_error'
      }
    });
  }

  // Extract character name from messages
  const characterName = extractCharacterName(messages);

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

  // Log request with proper formatting using util.inspect
  console.log(util.inspect(req.body, { depth: null, colors: true, maxArrayLength: null }));
  
  // Log to file with character name
  const { filename, isNewCharacter } = await logRequest(req.body.messages, characterName);
  
  // Enhanced console message
  if (isNewCharacter) {
    console.log(`New character detected: ${characterName} - Logs saved to '${filename}'`);
  } else {
    console.log(`Logs for ${characterName} appended to '${filename}'`);
  }
  
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
  console.log(`Log files will be created as: request_[character_name].log`);
});
