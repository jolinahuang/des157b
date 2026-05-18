(function () {
    'use strict';

    // time in pacific standard time
    const statusDate = document.getElementById('status-date');
    const statusTime = document.getElementById('status-time');

    function updateClock() {
        const now = new Date();

        // formats data and time
        const dateStr = now.toLocaleDateString('en-US', {
            timeZone: 'America/Los_Angeles',
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        const timeStr = now.toLocaleTimeString('en-US', {
            timeZone: 'America/Los_Angeles',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        statusDate.textContent = dateStr;
        statusTime.textContent = timeStr;
    }

    // refreshes time every second
    updateClock();
    setInterval(updateClock, 1000);

    // light/dark mode toggle
    const modeSwitch = document.getElementById('mode-switch');
    const body = document.body;
    const swappableImages = document.querySelectorAll('img[data-light][data-dark]');

    function swapImages(mode) {
        swappableImages.forEach(function (img) {
            img.src = img.getAttribute('data-' + mode);
        });
    }

    function applyMode() {
        if (modeSwitch.checked) {
            body.classList.add('dark');
            swapImages('dark');
        } else {
            body.classList.remove('dark');
            swapImages('light');
        }
    }

    applyMode();
    modeSwitch.addEventListener('change', applyMode);

    // expand widget folder
    const folders = document.querySelectorAll('.folder');
    const backdrop = document.getElementById('overlay-backdrop');
    let activeFolder = null;

    folders.forEach(function (folder) {
        const expanded = folder.querySelector('.folder-expanded');
        const closeBtn = expanded.querySelector('.folder-close');

        folder.addEventListener('click', function (e) {
            if (expanded.contains(e.target)) {
                return;
            }
            openFolder(expanded);
        });

        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            closeFolder();
        });
    });

    // close folder when clicking outside of modal
    backdrop.addEventListener('click', function () {
        closeFolder();
    });

    function openFolder(expandedEl) {
        if (activeFolder) {
            activeFolder.classList.remove('active');
        }
        expandedEl.classList.add('active');
        backdrop.classList.add('active');
        activeFolder = expandedEl;
    }

    function closeFolder() {
        if (activeFolder) {
            activeFolder.classList.remove('active');
            backdrop.classList.remove('active');
            activeFolder = null;
        }
    }
})();

(function() {
    'use strict';

    const button = document.querySelector('button');
    const body = document.querySelector('body');
    const banner = document.querySelector('#banner');
    const sections = document.querySelectorAll('section')
    let mode = 'dark';

    button.addEventListener('click', function() {
        if (mode === 'dark') {
            body.className = 'switch';
            banner.className = 'switch';
            button.className = 'switch';
            for (const section of sections) {
                section.className = 'switch';
            }
            mode = 'light';
        } else {
            body.removeAttribute('class');
            banner.removeAttribute('class');
            button.removeAttribute('class');
            for (const section of sections) {
                section.removeAttribute('class');
            }
            mode = 'dark'
        }
    })
})()