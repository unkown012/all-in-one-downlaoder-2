const fs = require('fs');
const path = require('path');

// Ensure required directories exist
const dirs = ['logs', 'public', 'public/downloads'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Create a basic .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    const defaultEnv = `
NODE_ENV=production
PORT=3000
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
`.trim();
    fs.writeFileSync(envPath, defaultEnv);
} 