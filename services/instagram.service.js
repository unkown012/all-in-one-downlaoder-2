const { IgApiClient } = require('instagram-private-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class InstagramService {
    constructor() {
        this.ig = new IgApiClient();
    }

    async initialize() {
        // You can either use session or login each time
        this.ig.state.generateDevice(process.env.IG_USERNAME);
        await this.ig.simulate.preLoginFlow();
    }

    async login() {
        await this.ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
    }

    async downloadPost(url) {
        try {
            // Extract media ID from URL
            const mediaId = this.extractMediaId(url);
            if (!mediaId) {
                throw new Error('Invalid Instagram URL');
            }

            // Get media info
            const mediaInfo = await this.ig.media.info(mediaId);
            const downloadDir = path.join(__dirname, '../public/downloads');
            
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }

            // Handle different types of media
            if (mediaInfo.items[0].carousel_media) {
                // Handle carousel/multiple media
                return await this.downloadCarousel(mediaInfo.items[0], downloadDir);
            } else if (mediaInfo.items[0].video_versions) {
                // Handle video
                return await this.downloadVideo(mediaInfo.items[0], downloadDir);
            } else {
                // Handle single image
                return await this.downloadImage(mediaInfo.items[0], downloadDir);
            }
        } catch (error) {
            console.error('Error downloading Instagram content:', error);
            throw error;
        }
    }

    async downloadImage(mediaItem, downloadDir) {
        const url = mediaItem.image_versions2.candidates[0].url;
        const filename = `instagram_${mediaItem.id}.jpg`;
        const filepath = path.join(downloadDir, filename);
        
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filepath));
            writer.on('error', reject);
        });
    }

    async downloadVideo(mediaItem, downloadDir) {
        const url = mediaItem.video_versions[0].url;
        const filename = `instagram_${mediaItem.id}.mp4`;
        const filepath = path.join(downloadDir, filename);

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filepath));
            writer.on('error', reject);
        });
    }

    async downloadCarousel(mediaItem, downloadDir) {
        const files = [];
        for (let i = 0; i < mediaItem.carousel_media.length; i++) {
            const carouselItem = mediaItem.carousel_media[i];
            if (carouselItem.video_versions) {
                files.push(await this.downloadVideo(carouselItem, downloadDir));
            } else {
                files.push(await this.downloadImage(carouselItem, downloadDir));
            }
        }
        return files;
    }

    extractMediaId(url) {
        // Extract media ID from Instagram URL
        const regex = /instagram.com\/p\/([^\/]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
}

module.exports = new InstagramService(); 