const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');
const Redis = require('ioredis');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/app.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Initialize Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('error', (err) => {
    logger.error('Redis error:', err);
});

// Configure rate limiter
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later',
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests, please try again later'
        });
    }
});

// Configure multer for file uploads with size limits
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = process.env.UPLOAD_DIR || 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Function to create Express app
function createApp() {
    const app = express();

    // Security middleware
    if (process.env.ENABLE_HELMET !== 'false') {
        app.use(helmet());
    }
    if (process.env.ENABLE_COMPRESSION !== 'false') {
        app.use(compression());
    }
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*'
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.static('public', {
        maxAge: '1d',
        etag: true
    }));

    // Apply rate limiting to all routes
    app.use(limiter);

    // Cache middleware
    const cache = async (req, res, next) => {
        const key = `cache:${req.originalUrl}`;
        try {
            const cachedResponse = await redis.get(key);
            if (cachedResponse) {
                return res.json(JSON.parse(cachedResponse));
            }
            next();
        } catch (error) {
            logger.error('Cache error:', error);
            next();
        }
    };

    // Error handling middleware
    app.use((err, req, res, next) => {
        logger.error('Error:', err);
        res.status(500).json({
            error: 'Something went wrong!',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });

    // YouTube Download Route with caching
    app.post('/api/youtube', cache, async (req, res) => {
        try {
            const { url, format, quality } = req.body;
            if (!url) {
                return res.status(400).json({ error: 'URL is required' });
            }

            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
            
            if (format === 'mp3') {
                res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
                ytdl(url, { filter: 'audioonly' }).pipe(res);
            } else {
                res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
                ytdl(url, { 
                    filter: 'videoandaudio',
                    quality: quality || 'highest'
                }).pipe(res);
            }
        } catch (error) {
            logger.error('YouTube download error:', error);
            res.status(500).json({ error: 'Failed to download video' });
        }
    });

    // Instagram Download Route with caching
    app.post('/api/instagram', cache, async (req, res) => {
        try {
            const { url } = req.body;
            if (!url) {
                return res.status(400).json({ error: 'URL is required' });
            }
            // Note: Instagram scraping requires additional setup
            res.status(501).json({ error: 'Instagram download feature coming soon' });
        } catch (error) {
            logger.error('Instagram download error:', error);
            res.status(500).json({ error: 'Failed to download Instagram content' });
        }
    });

    // Twitter Download Route with caching
    app.post('/api/twitter', cache, async (req, res) => {
        try {
            const { url } = req.body;
            if (!url) {
                return res.status(400).json({ error: 'URL is required' });
            }
            // Note: Twitter API requires authentication
            res.status(501).json({ error: 'Twitter download feature coming soon' });
        } catch (error) {
            logger.error('Twitter download error:', error);
            res.status(500).json({ error: 'Failed to download Twitter content' });
        }
    });

    // Facebook Download Route with caching
    app.post('/api/facebook', cache, async (req, res) => {
        try {
            const { url } = req.body;
            if (!url) {
                return res.status(400).json({ error: 'URL is required' });
            }
            // Note: Facebook video download requires additional setup
            res.status(501).json({ error: 'Facebook download feature coming soon' });
        } catch (error) {
            logger.error('Facebook download error:', error);
            res.status(500).json({ error: 'Failed to download Facebook content' });
        }
    });

    // WhatsApp Status Upload Route with file size validation
    app.post('/api/whatsapp', upload.single('status'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            res.json({ 
                message: 'File uploaded successfully',
                file: req.file
            });
        } catch (error) {
            logger.error('WhatsApp upload error:', error);
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Failed to upload file' });
        }
    });

    return app;
}

// Cluster setup for better performance
if (cluster.isMaster) {
    const numCPUs = process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS) : os.cpus().length;
    logger.info(`Master ${process.pid} is running`);
    logger.info(`Forking for ${numCPUs} CPUs`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    const app = createApp();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        logger.info(`Worker ${process.pid} started on port ${port}`);
    });
} 