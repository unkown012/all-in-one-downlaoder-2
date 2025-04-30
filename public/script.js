// Utility functions
function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function validateUrl(url, platform) {
    const patterns = {
        youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
        instagram: /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+$/,
        twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+$/,
        facebook: /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+$/
    };

    return patterns[platform].test(url);
}

function showInputError(inputId, show) {
    const input = document.getElementById(inputId);
    if (show) {
        input.classList.add('input-error');
    } else {
        input.classList.remove('input-error');
    }
}

// Download Queue Management
const downloadQueue = {
    items: [],
    add: function(item) {
        this.items.push(item);
        this.updateUI();
    },
    remove: function(index) {
        this.items.splice(index, 1);
        this.updateUI();
    },
    updateUI: function() {
        const queueItems = document.getElementById('queue-items');
        const queueCount = document.querySelector('.queue-count');
        queueItems.innerHTML = '';
        queueCount.textContent = this.items.length;

        this.items.forEach((item, index) => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.innerHTML = `
                <i class="fas ${item.icon}"></i>
                <div class="queue-item-info">
                    <div class="queue-item-title">${item.title}</div>
                    <div class="queue-item-status">${item.status}</div>
                </div>
                <button onclick="downloadQueue.remove(${index})" class="remove-btn">
                    <i class="fas fa-times"></i>
                </button>
            `;
            queueItems.appendChild(queueItem);
        });
    }
};

// Download History Management
const downloadHistory = {
    items: JSON.parse(localStorage.getItem('downloadHistory') || '[]'),
    add: function(item) {
        this.items.unshift(item);
        if (this.items.length > 50) this.items.pop();
        localStorage.setItem('downloadHistory', JSON.stringify(this.items));
        this.updateUI();
    },
    updateUI: function() {
        const historyContainer = document.getElementById('download-history');
        historyContainer.innerHTML = '';

        this.items.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <i class="fas ${item.icon}"></i>
                <div class="history-item-info">
                    <div class="history-item-title">${item.title}</div>
                    <div class="history-item-date">${new Date(item.date).toLocaleString()}</div>
                </div>
            `;
            historyContainer.appendChild(historyItem);
        });
    }
};

// Progress Tracking
function updateProgress(platform, progress) {
    const progressContainer = document.getElementById(`${platform}-progress`);
    const progressBar = progressContainer.querySelector('.progress-bar');
    progressContainer.style.display = 'block';
    progressBar.style.width = `${progress}%`;
}

// Quality Selection
function selectQuality(platform, quality) {
    const qualityOptions = document.querySelectorAll(`#${platform}-quality .quality-option`);
    qualityOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.quality === quality) {
            option.classList.add('selected');
        }
    });
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    const icon = document.querySelector('#dark-mode-toggle i');
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

// Initialize dark mode
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    document.querySelector('#dark-mode-toggle i').className = 'fas fa-sun';
}

// Legal Modal Functions
function showTerms() {
    const modal = document.getElementById('terms-modal');
    modal.style.display = 'block';
}

function showPrivacy() {
    const modal = document.getElementById('privacy-modal');
    modal.style.display = 'block';
}

// Close modals when clicking the X or outside the modal
document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        closeBtn.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Add copyright notice to downloaded files
function addCopyrightNotice(filename) {
    return `${filename} - Downloaded for personal use only`;
}

// YouTube Download
async function downloadYouTube() {
    const url = document.getElementById('youtube-url').value;
    const format = document.getElementById('youtube-format').value;
    const quality = document.querySelector('#youtube-quality .quality-option.selected')?.dataset.quality || '720';
    
    if (!url) {
        showInputError('youtube-url', true);
        showMessage('Please enter a YouTube URL', 'error');
        return;
    }

    if (!validateUrl(url, 'youtube')) {
        showInputError('youtube-url', true);
        showMessage('Please enter a valid YouTube URL', 'error');
        return;
    }

    setLoading('youtube-btn', true);
    showInputError('youtube-url', false);

    const queueItem = {
        icon: 'fab fa-youtube',
        title: 'YouTube Download',
        status: 'Preparing...'
    };
    downloadQueue.add(queueItem);

    try {
        const response = await fetch('/api/youtube', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, format, quality }),
        });

        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = addCopyrightNotice(`youtube-${format}-${Date.now()}.${format}`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            
            downloadHistory.add({
                icon: 'fab fa-youtube',
                title: `YouTube ${format.toUpperCase()} Download`,
                date: new Date()
            });
            
            showMessage('Download started!', 'success');
        } else {
            const error = await response.json();
            showMessage(error.error || 'Download failed', 'error');
        }
    } catch (error) {
        showMessage('An error occurred while downloading', 'error');
    } finally {
        setLoading('youtube-btn', false);
        downloadQueue.remove(downloadQueue.items.indexOf(queueItem));
    }
}

// Instagram Download
async function downloadInstagram() {
    const url = document.getElementById('instagram-url').value;
    
    if (!url) {
        showInputError('instagram-url', true);
        showMessage('Please enter an Instagram URL', 'error');
        return;
    }

    if (!validateUrl(url, 'instagram')) {
        showInputError('instagram-url', true);
        showMessage('Please enter a valid Instagram URL', 'error');
        return;
    }

    setLoading('instagram-btn', true);
    showInputError('instagram-url', false);

    try {
        const response = await fetch('/api/instagram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        const data = await response.json();
        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = addCopyrightNotice(`instagram-${Date.now()}.mp4`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            
            downloadHistory.add({
                icon: 'fab fa-instagram',
                title: 'Instagram Download',
                date: new Date()
            });
            
            showMessage('Download started!', 'success');
        } else {
            showMessage(data.error || 'Download failed', 'error');
        }
    } catch (error) {
        showMessage('An error occurred while downloading', 'error');
    } finally {
        setLoading('instagram-btn', false);
    }
}

// Twitter Download
async function downloadTwitter() {
    const url = document.getElementById('twitter-url').value;
    
    if (!url) {
        showInputError('twitter-url', true);
        showMessage('Please enter a Twitter URL', 'error');
        return;
    }

    if (!validateUrl(url, 'twitter')) {
        showInputError('twitter-url', true);
        showMessage('Please enter a valid Twitter URL', 'error');
        return;
    }

    setLoading('twitter-btn', true);
    showInputError('twitter-url', false);

    try {
        const response = await fetch('/api/twitter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        const data = await response.json();
        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = addCopyrightNotice(`twitter-${Date.now()}.mp4`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            
            downloadHistory.add({
                icon: 'fab fa-twitter',
                title: 'Twitter Download',
                date: new Date()
            });
            
            showMessage('Download started!', 'success');
        } else {
            showMessage(data.error || 'Download failed', 'error');
        }
    } catch (error) {
        showMessage('An error occurred while downloading', 'error');
    } finally {
        setLoading('twitter-btn', false);
    }
}

// Facebook Download
async function downloadFacebook() {
    const url = document.getElementById('facebook-url').value;
    
    if (!url) {
        showInputError('facebook-url', true);
        showMessage('Please enter a Facebook URL', 'error');
        return;
    }

    if (!validateUrl(url, 'facebook')) {
        showInputError('facebook-url', true);
        showMessage('Please enter a valid Facebook URL', 'error');
        return;
    }

    setLoading('facebook-btn', true);
    showInputError('facebook-url', false);

    try {
        const response = await fetch('/api/facebook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        const data = await response.json();
        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = addCopyrightNotice(`facebook-${Date.now()}.mp4`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            
            downloadHistory.add({
                icon: 'fab fa-facebook',
                title: 'Facebook Download',
                date: new Date()
            });
            
            showMessage('Download started!', 'success');
        } else {
            showMessage(data.error || 'Download failed', 'error');
        }
    } catch (error) {
        showMessage('An error occurred while downloading', 'error');
    } finally {
        setLoading('facebook-btn', false);
    }
}

// WhatsApp Status Upload
async function uploadWhatsApp() {
    const fileInput = document.getElementById('whatsapp-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showInputError('whatsapp-file', true);
        showMessage('Please select a file', 'error');
        return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
        showInputError('whatsapp-file', true);
        showMessage('Please select a valid image or video file', 'error');
        return;
    }

    setLoading('whatsapp-btn', true);
    showInputError('whatsapp-file', false);

    const formData = new FormData();
    formData.append('status', file);

    try {
        const response = await fetch('/api/whatsapp', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (response.ok) {
            const newName = addCopyrightNotice(file.name);
            showMessage('File uploaded successfully!', 'success');
            fileInput.value = '';
        } else {
            showMessage(data.error || 'Upload failed', 'error');
        }
    } catch (error) {
        showMessage('An error occurred while uploading', 'error');
    } finally {
        setLoading('whatsapp-btn', false);
    }
}

// Batch Download
async function startBatchDownload() {
    const urls = document.getElementById('batch-urls').value.split('\n').filter(url => url.trim());
    if (urls.length === 0) {
        showMessage('Please enter at least one URL', 'error');
        return;
    }

    setLoading('batch-btn', true);

    for (const url of urls) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            document.getElementById('youtube-url').value = url;
            await downloadYouTube();
        } else if (url.includes('instagram.com')) {
            document.getElementById('instagram-url').value = url;
            await downloadInstagram();
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            document.getElementById('twitter-url').value = url;
            await downloadTwitter();
        } else if (url.includes('facebook.com')) {
            document.getElementById('facebook-url').value = url;
            await downloadFacebook();
        }
    }

    setLoading('batch-btn', false);
    showMessage('Batch download completed!', 'success');
}

// Add input event listeners to clear error states
document.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener('input', () => {
        showInputError(input.id, false);
    });
});

document.getElementById('whatsapp-file').addEventListener('change', () => {
    showInputError('whatsapp-file', false);
});

// Event Listeners
document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

document.querySelectorAll('#youtube-quality .quality-option').forEach(option => {
    option.addEventListener('click', () => {
        selectQuality('youtube', option.dataset.quality);
    });
});

// Initialize history UI
downloadHistory.updateUI();

// Drag and Drop Handlers
function setupDragAndDrop() {
    // WhatsApp file drop zone
    const whatsappDropZone = document.getElementById('whatsapp-drop-zone');
    const whatsappFileInput = document.getElementById('whatsapp-file');

    whatsappDropZone.addEventListener('click', () => whatsappFileInput.click());

    whatsappDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        whatsappDropZone.classList.add('dragover');
    });

    whatsappDropZone.addEventListener('dragleave', () => {
        whatsappDropZone.classList.remove('dragover');
    });

    whatsappDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        whatsappDropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            whatsappFileInput.files = files;
            handleWhatsAppFile(files[0]);
        }
    });

    // Batch download drop zone
    const batchDropZone = document.getElementById('batch-drop-zone');
    const batchUrls = document.getElementById('batch-urls');

    batchDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        batchDropZone.classList.add('dragover');
    });

    batchDropZone.addEventListener('dragleave', () => {
        batchDropZone.classList.remove('dragover');
    });

    batchDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        batchDropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    batchUrls.value = e.target.result;
                };
                reader.readAsText(file);
            } else {
                showMessage('Please drop a text file', 'error');
            }
        }
    });

    // URL drop zones
    const platforms = ['youtube', 'instagram', 'twitter', 'facebook'];
    platforms.forEach(platform => {
        const dropZone = document.getElementById(`${platform}-drop-zone`);
        const urlList = document.getElementById(`${platform}-url-list`);
        const urlInput = document.getElementById(`${platform}-url`);

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const text = e.dataTransfer.getData('text');
            if (text) {
                const urls = text.split('\n').filter(url => url.trim());
                urls.forEach(url => {
                    if (validateUrl(url, platform)) {
                        addUrlToList(url, platform);
                    }
                });
            }
        });
    });
}

function addUrlToList(url, platform) {
    const urlList = document.getElementById(`${platform}-url-list`);
    const urlItem = document.createElement('div');
    urlItem.className = 'url-item';
    urlItem.innerHTML = `
        <i class="fas fa-link"></i>
        <span>${url}</span>
        <i class="fas fa-times remove-url"></i>
    `;

    urlItem.querySelector('.remove-url').addEventListener('click', () => {
        urlItem.remove();
    });

    urlItem.addEventListener('click', () => {
        document.getElementById(`${platform}-url`).value = url;
    });

    urlList.appendChild(urlItem);
}

function handleWhatsAppFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
        showMessage('Please select a valid image or video file', 'error');
        return;
    }

    const fileInfo = document.querySelector('#whatsapp-drop-zone .file-info');
    fileInfo.textContent = `Selected: ${file.name}`;
}

// Initialize drag and drop
setupDragAndDrop();

// Initialize legal notices
document.addEventListener('DOMContentLoaded', () => {
    // Show legal notice on first visit
    if (!localStorage.getItem('legalNoticeShown')) {
        showTerms();
        localStorage.setItem('legalNoticeShown', 'true');
    }
}); 