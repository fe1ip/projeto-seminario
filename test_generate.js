const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
} catch (e) {}

const apiKey = process.env.GEMINI_API_KEY;

const model = 'gemini-3.5-flash';
const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Response for ${model}:`, data);
  });
});

req.write(JSON.stringify({
  contents: [{ parts: [{ text: "Hello" }] }]
}));
req.end();
