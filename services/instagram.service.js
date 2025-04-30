const { IgApiClient } = require('instagram-private-api');
const axios = require('axios');

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
            
            if (mediaInfo.items[0].carousel_media) {
                // Handle carousel/multiple media
                return await this.downloadCarousel(mediaInfo.items[0]);
            } else if (mediaInfo.items[0].video_versions) {
                // Handle video
                return await this.downloadVideo(mediaInfo.items[0]);
            } else {
                // Handle single image
                return await this.downloadImage(mediaInfo.items[0]);
            }
        } catch (error) {
            console.error('Error downloading Instagram content:', error);
            throw error;
        }
    }

    async downloadImage(mediaItem) {
        const url = mediaItem.image_versions2.candidates[0].url;
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        return {
            buffer: response.data,
            filename: `instagram_${mediaItem.id}.jpg`,
            type: 'image/jpeg'
        };
    }

    async downloadVideo(mediaItem) {
        const url = mediaItem.video_versions[0].url;
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        return {
            buffer: response.data,
            filename: `instagram_${mediaItem.id}.mp4`,
            type: 'video/mp4'
        };
    }

    async downloadCarousel(mediaItem) {
        const files = [];
        for (let i = 0; i < mediaItem.carousel_media.length; i++) {
            const carouselItem = mediaItem.carousel_media[i];
            if (carouselItem.video_versions) {
                files.push(await this.downloadVideo(carouselItem));
            } else {
                files.push(await this.downloadImage(carouselItem));
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