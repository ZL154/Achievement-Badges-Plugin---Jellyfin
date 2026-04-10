(function () {
    const ENTRY_ID = 'achievement-badges-nav-entry';
    const TARGET_URL = '/web/index.html#!/configurationpage?name=achievementbadges';

    function createNavEntry() {
        if (document.getElementById(ENTRY_ID)) {
            return;
        }

        if (document.getElementById('achievementsSidebarEntry')) {
            return;
        }

        const sidebar =
            document.querySelector('.mainDrawer-scrollContainer .itemsContainer') ||
            document.querySelector('.mainDrawer-scrollContainer') ||
            document.querySelector('.mainDrawer');

        if (!sidebar) {
            return;
        }

        const link = document.createElement('a');
        link.id = ENTRY_ID;
        link.href = TARGET_URL;
        link.className = 'navMenuOption';
        link.style.display = 'flex';
        link.style.alignItems = 'center';
        link.style.gap = '1em';

        link.innerHTML =
            '<span class="material-icons" style="width:24px;display:inline-flex;justify-content:center;font-size:1.1em;">emoji_events</span>' +
            '<span style="font-weight:600;">Achievements</span>';

        sidebar.appendChild(link);
    }

    function init() {
        createNavEntry();
    }

    const observer = new MutationObserver(function () {
        createNavEntry();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
