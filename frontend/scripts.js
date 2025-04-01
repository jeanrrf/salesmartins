// Enhanced Dynamic Banner Animation
document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('dynamic-banner');
    const frame1 = document.getElementById('frame1');
    const frame2 = document.getElementById('frame2');
    const finalFrame = document.getElementById('final-frame');
    const video = document.getElementById('banner-video');
    const overlay = document.getElementById('transition-overlay');
    const skipButton = document.getElementById('skip-intro');
    const finalLogo = document.querySelector('.final-logo');
    let bannerActive = true;
    let animationTimeouts = [];

    createParticles();

    setTimeout(() => startBannerSequence(), 500);

    skipButton.addEventListener('click', () => {
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        endBannerSequence();
    });

    function startBannerSequence() {
        if (!bannerActive) return;
        frame1.style.opacity = '1';
        animationTimeouts.push(setTimeout(() => transitionToFrame(frame2, 3500), 3500));
        animationTimeouts.push(setTimeout(() => transitionToFrame(finalFrame, 8500), 8500));
        animationTimeouts.push(setTimeout(() => restartBanner(), 13000));
    }

    function transitionToFrame(frame, delay) {
        overlay.style.opacity = '1';
        setTimeout(() => {
            frame1.style.opacity = frame === frame2 ? '0' : frame1.style.opacity;
            frame2.style.opacity = frame === finalFrame ? '0' : frame2.style.opacity;
            frame.style.opacity = '1';
            overlay.style.opacity = '0';
        }, delay);
    }

    function restartBanner() {
        overlay.style.opacity = '1';
        setTimeout(() => {
            finalLogo.style.animation = '';
            startBannerSequence();
        }, 1000);
    }

    function endBannerSequence() {
        bannerActive = false;
        banner.style.transform = 'translateY(-100%)';
        setTimeout(() => banner.remove(), 1000);
    }

    function createParticles() {
        const particlesContainer = document.querySelector('.particles-container');
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 6 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.setProperty('--x', `${(Math.random() - 0.5) * 100}px`);
            particle.style.setProperty('--y', `${(Math.random() - 0.5) * 100}px`);
            particle.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
            particle.style.setProperty('--delay', `${Math.random() * 2}s`);
            particlesContainer.appendChild(particle);
        }
    }
});