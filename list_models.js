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

if (!apiKey) {
  console.error("No API key found.");
  process.exit(1);
}

const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models?key=${apiKey}`,
  method: 'GET'
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const models = JSON.parse(data).models;
    if (models) {
      console.log("Available models:");
      models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log(data);
    }
  });
});

req.on('error', e => console.error(e));
req.end();
