(function () {
    const ENTRY_ID = "achievementsSidebarEntry";
    const TARGET_URL = "/web/index.html#!/configurationpage?name=achievementbadges";

    function createNavEntry() {
        if (document.getElementById(ENTRY_ID)) {
            return;
        }

        if (document.getElementById('achievement-badges-nav-entry')) {
            return;
        }

        const sidebar =
            document.querySelector(".mainDrawer-scrollContainer .itemsContainer") ||
            document.querySelector(".mainDrawer-scrollContainer");

        if (!sidebar) {
            return;
        }

        const item = document.createElement("a");
        item.id = ENTRY_ID;
        item.href = TARGET_URL;
        item.className = "navMenuOption";
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.gap = "1em";

        item.innerHTML = `
            <span class="material-icons">emoji_events</span>
            <span>Achievements</span>
        `;

        sidebar.appendChild(item);
    }

    function start() {
        createNavEntry();

        const observer = new MutationObserver(() => {
            createNavEntry();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
