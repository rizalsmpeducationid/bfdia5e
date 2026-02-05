// youtube-detection.js

// YouTube Detection and Modal Popup Functionality

// Function to detect YouTube video links
function isYouTubeUrl(url) {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.test(url);
    return regex;
}

// Function to display modal popup
function showModal(videoUrl) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = 'white';
    modal.style.padding = '20px';
    modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    modal.innerHTML = `<iframe width='560' height='315' src='${videoUrl}' frameborder='0' allowfullscreen></iframe>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', () => document.body.removeChild(modal));
}

// Integration with 5b.js Game Engine
const gameEngine = { /* Assuming the game engine is initialized here */ };

function initYouTubeIntegration() {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const url = e.target.href;
            if (isYouTubeUrl(url)) {
                e.preventDefault(); // Prevent default link behaviour
                showModal(url);
            }
        });
    });
}

initYouTubeIntegration();
