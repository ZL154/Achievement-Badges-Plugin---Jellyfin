(function () {
    const ROOT_ID = "achievementBadgesProfileShowcase";

    function getApiClient() {
        return window.ApiClient || window.apiClient || null;
    }

    async function fetchJson(path) {
        var apiClient = getApiClient();
        var cleanPath = path.replace(/^\/+/, "");

        if (apiClient && typeof apiClient.getJSON === "function") {
            return await apiClient.getJSON(apiClient.getUrl(cleanPath));
        }

        if (apiClient && typeof apiClient.fetch === "function") {
            var response = await apiClient.fetch({ url: apiClient.getUrl(cleanPath) });
            if (!response.ok) {
                throw new Error("Request failed: " + response.status);
            }
            var text = await response.text();
            return text ? JSON.parse(text) : null;
        }

        var response = await fetch("/" + cleanPath, { credentials: "include" });
        if (!response.ok) {
            throw new Error("Request failed: " + response.status);
        }
        return await response.json();
    }

    async function fetchCurrentUserId() {
        try {
            var apiClient = getApiClient();
            if (apiClient) {
                if (typeof apiClient.getCurrentUserId === "function") {
                    var id = apiClient.getCurrentUserId();
                    if (id) return id;
                }
                if (apiClient._serverInfo && apiClient._serverInfo.UserId) {
                    return apiClient._serverInfo.UserId;
                }
            }
            var me = await fetchJson("Users/Me");
            return me && me.Id ? me.Id : null;
        } catch (_) {
            return null;
        }
    }

    function buildContainer(userId) {
        var existing = document.getElementById(ROOT_ID);
        if (existing) {
            return existing;
        }

        var host =
            document.querySelector(".content-primary") ||
            document.querySelector(".verticalSection") ||
            document.querySelector("[data-role='content']") ||
            document.querySelector(".page") ||
            document.body;

        if (!host) {
            return null;
        }

        var wrapper = document.createElement("div");
        wrapper.id = ROOT_ID;
        wrapper.style.marginTop = "1em";
        wrapper.style.marginBottom = "1em";
        wrapper.style.padding = "1em";
        wrapper.style.border = "1px solid rgba(255,255,255,0.12)";
        wrapper.style.borderRadius = "14px";
        wrapper.style.background = "rgba(255,255,255,0.03)";

        wrapper.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:1em;flex-wrap:wrap;margin-bottom:0.8em;">' +
                '<div style="font-size:1.05em;font-weight:700;">Achievements Showcase</div>' +
                '<a href="/web/index.html#!/configurationpage?name=achievementbadges" style="color:#7dd3fc;text-decoration:none;font-weight:600;">Open Achievements</a>' +
            '</div>' +
            '<iframe ' +
                'src="/web/index.html#!/configurationpage?name=achievementbadgesshowcase&userId=' + encodeURIComponent(userId) + '" ' +
                'style="width:100%;min-height:90px;border:0;background:transparent;" ' +
                'loading="lazy">' +
            '</iframe>';

        host.prepend(wrapper);
        return wrapper;
    }

    async function injectShowcase() {
        if (document.getElementById(ROOT_ID)) {
            return;
        }

        var userId = await fetchCurrentUserId();

        if (!userId) {
            return;
        }

        buildContainer(userId);
    }

    function start() {
        injectShowcase();

        var observer = new MutationObserver(function () {
            injectShowcase();
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
