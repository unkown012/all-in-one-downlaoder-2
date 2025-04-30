# Media Downloader Pro

A powerful, feature-rich media downloader that supports multiple social media platforms. Built with modern web technologies and optimized for performance.

![Media Downloader Pro](https://i.imgur.com/example.png)

## ⚠️ Legal Disclaimer

This tool is provided for **personal use only**. By using this application, you agree to:

1. Use the downloaded content for personal purposes only
2. Respect copyright laws and intellectual property rights
3. Not use this tool for any commercial purposes
4. Not redistribute or resell downloaded content
5. Not use this tool to download copyrighted material without proper authorization

The developers of this tool are not responsible for any misuse or copyright violations. Users are solely responsible for ensuring they have the right to download and use the content.

## 🌟 Features

- **Multi-Platform Support**
  - YouTube (Video/Audio)
  - Instagram (Posts/Stories/Reels)
  - Twitter (Videos/GIFs)
  - Facebook (Videos)
  - WhatsApp Status

- **Advanced Features**
  - Drag and drop support
  - Batch downloading
  - Quality selection
  - Download queue
  - Download history
  - Dark mode
  - Progress tracking
  - File type validation

- **Performance Optimizations**
  - Redis caching
  - Rate limiting
  - Compression
  - Clustering
  - Load balancing

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Redis server
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/media-downloader-pro.git
cd media-downloader-pro
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=production
MAX_FILE_SIZE=52428800
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## 📦 Project Structure

```
media-downloader-pro/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── server.js
├── package.json
├── .env
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| NODE_ENV | Environment | production |
| MAX_FILE_SIZE | Max file size | 50MB |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 15min |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |

## 🚀 Deployment

### Using PM2

```bash
pm2 start server.js -i max --name "media-downloader"
```

### Using Docker

```bash
docker build -t media-downloader .
docker run -p 3000:3000 media-downloader
```

## 📝 API Documentation

### Endpoints

- `POST /api/youtube` - Download YouTube videos/audio
- `POST /api/instagram` - Download Instagram content
- `POST /api/twitter` - Download Twitter content
- `POST /api/facebook` - Download Facebook videos
- `POST /api/whatsapp` - Upload WhatsApp status

### Request Examples

```javascript
// YouTube Download
fetch('/api/youtube', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        url: 'https://youtube.com/watch?v=...',
        format: 'mp4',
        quality: '720'
    })
});
```

## 🛡️ Security

- Rate limiting
- File type validation
- Input sanitization
- CORS protection
- Helmet security headers

## 📊 Performance

- Redis caching
- Compression
- Clustering
- Load balancing
- Static file caching

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Terms of Use

By using this application, you agree to:

1. Use the tool for personal purposes only
2. Not use it for any commercial purposes
3. Not redistribute or resell downloaded content
4. Not use it to download copyrighted material without proper authorization
5. Not use it for any illegal purposes

The developers reserve the right to modify these terms at any time.

## 🔒 Privacy Policy

We do not store any downloaded content on our servers. All downloads are processed directly and temporarily. We only store:

1. Download history (locally in your browser)
2. Basic usage statistics (anonymized)
3. Error logs (for debugging purposes)

## 🙏 Acknowledgments

- [ytdl-core](https://github.com/fent/node-ytdl-core)
- [express](https://expressjs.com/)
- [redis](https://redis.io/)
- [Font Awesome](https://fontawesome.com/)

## 📞 Support

For support, email support@example.com or open an issue in the GitHub repository.

## 🔄 Updates

Check the [CHANGELOG.md](CHANGELOG.md) for recent updates and changes. 