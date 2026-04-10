(function () {
    const ROUTE = "#!/achievements";
    const ROOT_ID = "achievementBadgesStandaloneRoot";

    function rarityClass(rarity) {
        const value = (rarity || "").toLowerCase();
        if (value === "uncommon") return "rarity-uncommon";
        if (value === "rare") return "rarity-rare";
        if (value === "epic") return "rarity-epic";
        if (value === "legendary") return "rarity-legendary";
        if (value === "mythic") return "rarity-mythic";
        return "rarity-common";
    }

    function iconGlyph(iconName) {
        const key = (iconName || "").toLowerCase();

        const map = {
            play_circle: "▶",
            travel_explore: "🧭",
            weekend: "🛋",
            chair: "🪑",
            home: "🏠",
            movie_filter: "🎞",
            live_tv: "📺",
            theaters: "🎭",
            local_fire_department: "🔥",
            bolt: "⚡",
            military_tech: "🏆",
            auto_awesome: "✨",
            movie: "🎬",
            tv: "📺",
            dark_mode: "🌙",
            nights_stay: "🌃",
            bedtime: "😴",
            wb_sunny: "🌅",
            light_mode: "☀",
            sunny: "🌞",
            event: "📅",
            event_available: "🗓",
            celebration: "🎉",
            stars: "🌟",
            collections_bookmark: "📚",
            inventory_2: "🗃",
            today: "📆",
            calendar_month: "🗓",
            favorite: "❤",
            timeline: "📈",
            insights: "📊",
            all_inclusive: "♾",
            speed: "💨",
            hourglass_bottom: "⏳",
            directions_run: "🏃",
            sports_score: "🏁",
            local_movies: "🍿"
        };

        return map[key] || "🏅";
    }

    function getApiClient() {
        return window.ApiClient || window.apiClient || null;
    }

    async function fetchJson(path, options) {
        const apiClient = getApiClient();
        const cleanPath = path.replace(/^\/+/, "");

        if (apiClient && typeof apiClient.fetch === "function") {
            const response = await apiClient.fetch(
                Object.assign({}, options || {}, {
                    url: apiClient.getUrl(cleanPath)
                })
            );

            if (!response.ok) {
                let message = "Request failed: " + response.status;
                try {
                    const body = await response.json();
                    if (body && body.Message) {
                        message = body.Message;
                    }
                } catch (_) {}
                throw new Error(message);
            }

            if (response.status === 204) {
                return null;
            }

            const text = await response.text();
            return text ? JSON.parse(text) : null;
        }

        const response = await fetch("/" + cleanPath, Object.assign({ credentials: "include" }, options || {}));

        if (!response.ok) {
            let message = "Request failed: " + response.status;
            try {
                const body = await response.json();
                if (body && body.Message) {
                    message = body.Message;
                }
            } catch (_) {}
            throw new Error(message);
        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    }

    async function getCurrentUserId() {
        try {
            const apiClient = getApiClient();
            if (apiClient) {
                if (typeof apiClient.getCurrentUserId === "function") {
                    const id = apiClient.getCurrentUserId();
                    if (id) return id;
                }
                if (apiClient._serverInfo && apiClient._serverInfo.UserId) {
                    return apiClient._serverInfo.UserId;
                }
            }
            const me = await fetchJson("/Users/Me");
            return me && me.Id ? me.Id : "";
        } catch (_) {
            return "";
        }
    }

    function ensureStyles() {
        if (document.getElementById("achievementBadgesStandaloneStyles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "achievementBadgesStandaloneStyles";
        style.textContent = `
            #${ROOT_ID}{
                position: fixed;
                inset: 0;
                z-index: 999999;
                overflow-y: auto;
                padding: 2em;
                background: var(--theme-body-background, #20232a);
                color: var(--theme-primary-color, #fff);
            }
            #${ROOT_ID} .ab-wrap{
                max-width: 1500px;
                margin: 0 auto;
            }
            #${ROOT_ID} .ab-topbar{
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:1em;
                flex-wrap:wrap;
                margin-bottom:1em;
            }
            #${ROOT_ID} .ab-back{
                padding:0.6em 0.95em;
                border-radius:10px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.04);
                color:#fff;
                cursor:pointer;
                text-decoration:none;
                display:inline-flex;
                align-items:center;
                gap:0.5em;
                font-weight:700;
            }
            #${ROOT_ID} .ab-hero{
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                flex-wrap:wrap;
                gap:1em;
                padding:1.4em;
                border-radius:18px;
                background:rgba(255,255,255,0.05);
                border:1px solid rgba(255,255,255,0.12);
                box-shadow:0 10px 30px rgba(0,0,0,0.16);
            }
            #${ROOT_ID} .ab-hero-left{
                display:flex;
                align-items:center;
                gap:1em;
                min-width:260px;
            }
            #${ROOT_ID} .ab-hero-icon{
                width:60px;
                height:60px;
                border-radius:999px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:rgba(255,255,255,0.1);
                font-size:1.6em;
                flex-shrink:0;
            }
            #${ROOT_ID} .ab-hero-title{
                font-size:1.25em;
                font-weight:700;
                line-height:1.2;
            }
            #${ROOT_ID} .ab-hero-subtitle{
                font-size:0.92em;
                opacity:0.82;
                margin-top:0.2em;
            }
            #${ROOT_ID} .ab-hero-actions{
                display:flex;
                gap:0.6em;
                flex-wrap:wrap;
                align-items:center;
            }
            #${ROOT_ID} .ab-section-eyebrow{
                font-size:0.88em;
                font-weight:700;
                letter-spacing:0.06em;
                text-transform:uppercase;
                color:#9fb3c8;
                margin-bottom:0.7em;
            }
            #${ROOT_ID} .ab-showcase{
                display:grid;
                grid-template-columns:repeat(auto-fill,minmax(190px,1fr));
                gap:0.8em;
                margin-top:1em;
            }
            #${ROOT_ID} .ab-showcase-card{
                display:flex;
                align-items:center;
                gap:0.6em;
                padding:0.7em;
                border-radius:12px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.04);
            }
            #${ROOT_ID} .ab-showcase-icon,
            #${ROOT_ID} .ab-badge-icon{
                width:42px;
                height:42px;
                border-radius:999px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:rgba(255,255,255,0.08);
                flex-shrink:0;
            }
            #${ROOT_ID} .ab-stats{
                margin-top:1.5em;
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
                gap:1em;
            }
            #${ROOT_ID} .ab-stat-card,
            #${ROOT_ID} .ab-panel-card,
            #${ROOT_ID} .ab-badge-card{
                padding:1em;
                border-radius:14px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.04);
            }
            #${ROOT_ID} .ab-stat-title{
                font-size:0.9em;
                opacity:0.8;
            }
            #${ROOT_ID} .ab-stat-value{
                font-size:2em;
                font-weight:700;
                margin-top:0.2em;
            }
            #${ROOT_ID} .ab-tabs{
                margin-top:1.5em;
                display:flex;
                gap:0.65em;
                flex-wrap:wrap;
            }
            #${ROOT_ID} .ab-tab{
                padding:0.55em 0.95em;
                border-radius:10px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.04);
                cursor:pointer;
                font-weight:700;
                color:#fff;
            }
            #${ROOT_ID} .ab-tab.active{
                background:rgba(255,255,255,0.12);
            }
            #${ROOT_ID} .ab-panel{
                margin-top:1.5em;
            }
            #${ROOT_ID} .ab-badge-grid{
                display:grid;
                grid-template-columns:repeat(auto-fill,minmax(270px,1fr));
                gap:1em;
                margin-top:1em;
            }
            #${ROOT_ID} .ab-badge-header{
                display:flex;
                gap:0.8em;
                align-items:center;
                margin-bottom:0.7em;
            }
            #${ROOT_ID} .ab-badge-title{
                font-size:1.05em;
                font-weight:700;
                line-height:1.2;
            }
            #${ROOT_ID} .ab-badge-meta{
                font-size:0.92em;
                opacity:0.9;
            }
            #${ROOT_ID} .ab-badge-description{
                margin-top:0.55em;
                line-height:1.45;
            }
            #${ROOT_ID} .ab-progress-text{
                display:flex;
                justify-content:space-between;
                font-size:0.92em;
                margin:0.7em 0 0.35em 0;
                opacity:0.82;
            }
            #${ROOT_ID} .ab-progress-bar{
                height:10px;
                border-radius:999px;
                overflow:hidden;
                background:#0f1318;
                border:1px solid rgba(255,255,255,0.1);
            }
            #${ROOT_ID} .ab-progress-fill{
                height:100%;
                background:#60a5fa;
            }
            #${ROOT_ID} .ab-badge-footer{
                margin-top:0.8em;
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:0.6em;
                flex-wrap:wrap;
            }
            #${ROOT_ID} .ab-btn{
                padding:0.55em 0.85em;
                border-radius:8px;
                border:1px solid rgba(255,255,255,0.14);
                background:rgba(255,255,255,0.05);
                color:#fff;
                cursor:pointer;
            }
            #${ROOT_ID} .ab-unlocked{ color:#4ade80; font-weight:700; }
            #${ROOT_ID} .ab-locked{ color:#f87171; font-weight:700; }
            #${ROOT_ID} .rarity-common{ color:#9fb3c8; }
            #${ROOT_ID} .rarity-uncommon{ color:#34d399; }
            #${ROOT_ID} .rarity-rare{ color:#60a5fa; }
            #${ROOT_ID} .rarity-epic{ color:#a78bfa; }
            #${ROOT_ID} .rarity-legendary{ color:#fbbf24; }
            #${ROOT_ID} .rarity-mythic{ color:#f43f5e; }
            #${ROOT_ID} .ab-status{
                margin-top:1em;
                min-height:1.4em;
                opacity:0.9;
            }
            #${ROOT_ID} .ab-error{
                display:none;
                margin-top:1em;
                padding:1em;
                border:1px solid rgba(248,113,113,0.45);
                border-radius:12px;
                background:rgba(248,113,113,0.08);
                color:#fca5a5;
            }
            #${ROOT_ID} .ab-muted{
                opacity:0.8;
            }
            #${ROOT_ID} .ab-leaderboard-row{
                display:flex;
                justify-content:space-between;
                gap:1em;
                padding:0.75em 0;
                border-bottom:1px solid rgba(255,255,255,0.08);
            }
            #${ROOT_ID} .ab-leaderboard-row:last-child{
                border-bottom:none;
            }
            @media (max-width: 900px){
                #${ROOT_ID}{
                    padding:1em;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function createRoot() {
        let root = document.getElementById(ROOT_ID);
        if (root) {
            return root;
        }

        root = document.createElement("div");
        root.id = ROOT_ID;
        root.innerHTML = `
            <div class="ab-wrap">
                <div class="ab-topbar">
                    <h2 style="margin:0;">Achievements</h2>
                    <a class="ab-back" href="/web/index.html#!/home">
                        <span>←</span>
                        <span>Back Home</span>
                    </a>
                </div>

                <div class="ab-hero">
                    <div style="flex:1;min-width:280px;">
                        <div class="ab-hero-left">
                            <div class="ab-hero-icon">🏅</div>
                            <div>
                                <div id="abProfileTitle" class="ab-hero-title">Achievement Profile</div>
                                <div id="abProfileSubtitle" class="ab-hero-subtitle">Loading profile...</div>
                            </div>
                        </div>

                        <div style="margin-top:1em;">
                            <div class="ab-section-eyebrow">Showcase</div>
                            <div id="abShowcaseRow" class="ab-showcase"></div>
                        </div>
                    </div>

                    <div class="ab-hero-actions">
                        <button class="ab-btn" id="abMeBtn">Use my account</button>
                        <button class="ab-btn" id="abRefreshBtn">Refresh</button>
                        <button class="ab-btn" id="abSimulateBtn">Simulate playback</button>
                    </div>
                </div>

                <div id="abStatus" class="ab-status"></div>
                <div id="abError" class="ab-error"></div>

                <div class="ab-stats">
                    <div class="ab-stat-card"><div class="ab-stat-title">Unlocked</div><div id="abUnlocked" class="ab-stat-value">0</div></div>
                    <div class="ab-stat-card"><div class="ab-stat-title">Total</div><div id="abTotal" class="ab-stat-value">0</div></div>
                    <div class="ab-stat-card"><div class="ab-stat-title">Completion</div><div id="abPercentage" class="ab-stat-value">0%</div></div>
                    <div class="ab-stat-card"><div class="ab-stat-title">Equipped</div><div id="abEquippedCount" class="ab-stat-value">0</div></div>
                </div>

                <div class="ab-tabs">
                    <button class="ab-tab active" id="abTabBadgesBtn">My Badges</button>
                    <button class="ab-tab" id="abTabLeaderboardBtn">Leaderboard</button>
                    <button class="ab-tab" id="abTabStatsBtn">Stats</button>
                </div>

                <div id="abPanelBadges" class="ab-panel">
                    <h3 style="margin:0 0 0.75em 0;">Equipped badges</h3>
                    <div id="abEquippedEmpty" class="ab-panel-card">No equipped badges yet. Start watching to unlock your first achievement.</div>
                    <div id="abEquippedRow" class="ab-badge-grid"></div>

                    <div id="abEmpty" class="ab-panel-card" style="margin-top:1.5em;">Start watching to unlock your first achievement.</div>
                    <div id="abGrid" class="ab-badge-grid"></div>
                </div>

                <div id="abPanelLeaderboard" class="ab-panel" style="display:none;">
                    <div class="ab-panel-card">
                        <h3 style="margin:0 0 0.75em 0;">Global leaderboard</h3>
                        <div id="abLeaderboard">Loading leaderboard...</div>
                    </div>
                </div>

                <div id="abPanelStats" class="ab-panel" style="display:none;">
                    <div class="ab-panel-card">
                        <h3 style="margin:0 0 0.75em 0;">Server stats</h3>
                        <div id="abServerStats">Loading server stats...</div>
                    </div>
                </div>
            </div>
        `;
        return root;
    }

    let pageInitialised = false;

    function setupPage(root) {
        if (pageInitialised) {
            return;
        }
        pageInitialised = true;

        const meBtn = root.querySelector("#abMeBtn");
        const refreshBtn = root.querySelector("#abRefreshBtn");
        const simulateBtn = root.querySelector("#abSimulateBtn");

        const tabBadgesBtn = root.querySelector("#abTabBadgesBtn");
        const tabLeaderboardBtn = root.querySelector("#abTabLeaderboardBtn");
        const tabStatsBtn = root.querySelector("#abTabStatsBtn");

        const panelBadges = root.querySelector("#abPanelBadges");
        const panelLeaderboard = root.querySelector("#abPanelLeaderboard");
        const panelStats = root.querySelector("#abPanelStats");

        const statusText = root.querySelector("#abStatus");
        const errorBox = root.querySelector("#abError");
        const emptyState = root.querySelector("#abEmpty");
        const grid = root.querySelector("#abGrid");
        const equippedRow = root.querySelector("#abEquippedRow");
        const equippedEmpty = root.querySelector("#abEquippedEmpty");
        const leaderboardBox = root.querySelector("#abLeaderboard");
        const serverStatsBox = root.querySelector("#abServerStats");
        const showcaseRow = root.querySelector("#abShowcaseRow");
        const profileTitle = root.querySelector("#abProfileTitle");
        const profileSubtitle = root.querySelector("#abProfileSubtitle");
        const unlockedValue = root.querySelector("#abUnlocked");
        const totalValue = root.querySelector("#abTotal");
        const percentageValue = root.querySelector("#abPercentage");
        const equippedCountValue = root.querySelector("#abEquippedCount");

        let currentUserId = "";

        function setStatus(message) {
            statusText.textContent = message || "";
        }

        function clearError() {
            errorBox.style.display = "none";
            errorBox.textContent = "";
        }

        function setError(message) {
            errorBox.textContent = message || "Unknown error.";
            errorBox.style.display = "block";
        }

        function setSummary(summary) {
            unlockedValue.textContent = summary && summary.Unlocked != null ? summary.Unlocked : 0;
            totalValue.textContent = summary && summary.Total != null ? summary.Total : 0;

            const percentage = summary && typeof summary.Percentage === "number"
                ? summary.Percentage.toFixed(1)
                : "0.0";

            percentageValue.textContent = percentage + "%";
            equippedCountValue.textContent = summary && summary.EquippedCount != null ? summary.EquippedCount : 0;
        }

        function setActiveTab(name) {
            panelBadges.style.display = name === "badges" ? "block" : "none";
            panelLeaderboard.style.display = name === "leaderboard" ? "block" : "none";
            panelStats.style.display = name === "stats" ? "block" : "none";

            tabBadgesBtn.classList.toggle("active", name === "badges");
            tabLeaderboardBtn.classList.toggle("active", name === "leaderboard");
            tabStatsBtn.classList.toggle("active", name === "stats");
        }

        function renderShowcase(badges) {
            showcaseRow.innerHTML = "";

            if (!badges || badges.length === 0) {
                showcaseRow.innerHTML = '<div class="ab-muted">No showcase yet. Equip badges as you unlock them.</div>';
                return;
            }

            badges.forEach(function (badge) {
                const card = document.createElement("div");
                card.className = "ab-showcase-card";
                card.innerHTML =
                    '<div class="ab-showcase-icon">' + iconGlyph(badge.Icon) + '</div>' +
                    '<div>' +
                        '<div style="font-weight:700;">' + badge.Title + '</div>' +
                        '<div class="' + rarityClass(badge.Rarity) + '" style="font-size:0.88em;">' + badge.Rarity + '</div>' +
                    '</div>';

                showcaseRow.appendChild(card);
            });
        }

        function renderEquippedBadges(badges) {
            equippedRow.innerHTML = "";

            if (!badges || badges.length === 0) {
                equippedEmpty.style.display = "block";
                return;
            }

            equippedEmpty.style.display = "none";

            badges.forEach(function (badge) {
                const card = document.createElement("div");
                card.className = "ab-badge-card";
                card.setAttribute("data-badge-id", badge.Id);

                card.innerHTML =
                    '<div class="ab-badge-header">' +
                        '<div class="ab-badge-icon">' + iconGlyph(badge.Icon) + '</div>' +
                        '<div style="flex:1;">' +
                            '<div class="ab-badge-title">' + badge.Title + '</div>' +
                            '<div class="ab-badge-meta ' + rarityClass(badge.Rarity) + '">' + badge.Rarity + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ab-badge-footer">' +
                        '<div class="ab-unlocked">Equipped</div>' +
                        '<button type="button" class="ab-btn">Unequip</button>' +
                    '</div>';

                card.querySelector("button").addEventListener("click", function () {
                    unequipBadge(badge.Id);
                });

                equippedRow.appendChild(card);
            });
        }

        function renderBadges(badges) {
            grid.innerHTML = "";

            if (!badges || badges.length === 0) {
                emptyState.style.display = "block";
                return;
            }

            emptyState.style.display = "none";

            const equippedIds = new Set(
                Array.from(equippedRow.children)
                    .map(function (card) {
                        return card.getAttribute("data-badge-id");
                    })
                    .filter(Boolean)
            );

            badges.forEach(function (badge) {
                const current = badge.CurrentValue || 0;
                const target = badge.TargetValue || 0;
                const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                const isEquipped = equippedIds.has(badge.Id);

                const card = document.createElement("div");
                card.className = "ab-badge-card";

                const buttonLabel = isEquipped ? "Unequip" : "Equip";
                const buttonDisabled = !badge.Unlocked ? "disabled" : "";

                card.innerHTML =
                    '<div class="ab-badge-header">' +
                        '<div class="ab-badge-icon">' + iconGlyph(badge.Icon) + '</div>' +
                        '<div style="flex:1;">' +
                            '<div class="ab-badge-title">' + badge.Title + '</div>' +
                            '<div class="ab-badge-meta ' + rarityClass(badge.Rarity) + '">' + badge.Rarity + ' • ' + badge.Category + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ab-badge-description">' + badge.Description + '</div>' +
                    '<div class="ab-progress-text"><span>Progress</span><span>' + current + '/' + target + '</span></div>' +
                    '<div class="ab-progress-bar"><div class="ab-progress-fill" style="width:' + progress + '%;"></div></div>' +
                    '<div class="ab-badge-footer">' +
                        '<div class="' + (badge.Unlocked ? 'ab-unlocked' : 'ab-locked') + '">' + (badge.Unlocked ? 'Unlocked' : 'Locked') + '</div>' +
                        '<button type="button" class="ab-btn" ' + buttonDisabled + '>' + buttonLabel + '</button>' +
                    '</div>';

                if (badge.Unlocked) {
                    card.querySelector("button").addEventListener("click", function () {
                        if (isEquipped) {
                            unequipBadge(badge.Id);
                        } else {
                            equipBadge(badge.Id);
                        }
                    });
                }

                if (!badge.Unlocked) {
                    card.querySelector("button").style.opacity = "0.5";
                }

                grid.appendChild(card);
            });
        }

        async function loadSummary(userId) {
            const summary = await fetchJson("/Plugins/AchievementBadges/users/" + userId + "/summary");
            setSummary(summary);
            profileSubtitle.textContent = "Completion: " + ((summary && summary.Percentage != null) ? summary.Percentage : 0) + "%";
        }

        async function loadEquipped(userId) {
            const badges = await fetchJson("/Plugins/AchievementBadges/users/" + userId + "/equipped");
            renderEquippedBadges(badges);
            renderShowcase(badges);
        }

        async function loadLeaderboard() {
            const entries = await fetchJson("/Plugins/AchievementBadges/leaderboard?limit=10");

            if (!entries || !entries.length) {
                leaderboardBox.innerHTML = '<div class="ab-muted">No leaderboard data yet.</div>';
                return;
            }

            leaderboardBox.innerHTML = entries.map(function (entry, index) {
                return '<div class="ab-leaderboard-row">' +
                    '<div><strong>#' + (index + 1) + '</strong> • ' + (entry.UserName || entry.UserId) + '</div>' +
                    '<div>' + entry.Unlocked + ' unlocked • ' + entry.Score + ' pts • ' + entry.Percentage + '%</div>' +
                '</div>';
            }).join("");
        }

        async function loadServerStats() {
            const stats = await fetchJson("/Plugins/AchievementBadges/server/stats");

            serverStatsBox.innerHTML =
                '<div>Total users: ' + (stats.TotalUsers ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Total badges unlocked: ' + (stats.TotalBadgesUnlocked ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Total items watched: ' + (stats.TotalItemsWatched ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Total movies watched: ' + (stats.TotalMoviesWatched ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Total series completed: ' + (stats.TotalSeriesCompleted ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Most common badge: ' + (stats.MostCommonBadge || "None") + '</div>';
        }

        async function reloadAll() {
            if (!currentUserId) {
                throw new Error("No user ID was found for this page.");
            }

            profileTitle.textContent = "Achievement Profile • " + currentUserId;

            const badges = await fetchJson("/Plugins/AchievementBadges/users/" + currentUserId);
            await loadSummary(currentUserId);
            await loadEquipped(currentUserId);
            await loadLeaderboard();
            await loadServerStats();
            renderBadges(badges);
        }

        async function loadBadges() {
            if (!currentUserId) {
                setStatus("");
                setError("No user ID was found for this page.");
                return;
            }

            clearError();
            setStatus("Loading badges...");

            try {
                await reloadAll();
                setStatus("Badges loaded.");
            } catch (error) {
                grid.innerHTML = "";
                equippedRow.innerHTML = "";
                showcaseRow.innerHTML = "";
                equippedEmpty.style.display = "block";
                emptyState.style.display = "block";
                leaderboardBox.innerHTML = "Failed to load leaderboard.";
                serverStatsBox.innerHTML = "Failed to load server stats.";
                profileSubtitle.textContent = "Could not load profile showcase.";
                setSummary({ Unlocked: 0, Total: 0, Percentage: 0, EquippedCount: 0 });
                setStatus("");
                setError("Failed to load badges. " + error.message);
            }
        }

        async function simulatePlayback() {
            if (!currentUserId) {
                setStatus("");
                setError("No user ID was found for this page.");
                return;
            }

            clearError();
            setStatus("Simulating playback...");

            try {
                await fetchJson("/Plugins/AchievementBadges/users/" + currentUserId + "/simulate-playback", { method: "POST" });
                await reloadAll();
                setStatus("Playback simulated successfully.");
            } catch (error) {
                setStatus("");
                setError("Failed to simulate playback. " + error.message);
            }
        }

        async function equipBadge(badgeId) {
            clearError();
            setStatus("Equipping badge...");

            try {
                await fetchJson("/Plugins/AchievementBadges/users/" + currentUserId + "/equipped/" + badgeId, {
                    method: "POST"
                });
                await reloadAll();
                setStatus("Badge equipped.");
            } catch (error) {
                setStatus("");
                setError("Failed to equip badge. " + error.message);
            }
        }

        async function unequipBadge(badgeId) {
            clearError();
            setStatus("Unequipping badge...");

            try {
                await fetchJson("/Plugins/AchievementBadges/users/" + currentUserId + "/equipped/" + badgeId, {
                    method: "DELETE"
                });
                await reloadAll();
                setStatus("Badge unequipped.");
            } catch (error) {
                setStatus("");
                setError("Failed to unequip badge. " + error.message);
            }
        }

        async function useMyAccount() {
            clearError();
            setStatus("Detecting current user...");

            try {
                const detected = await getCurrentUserId();

                if (!detected) {
                    throw new Error("Could not determine current user.");
                }

                currentUserId = detected;
                await loadBadges();
            } catch (error) {
                setStatus("");
                setError("Failed to detect current user. " + error.message);
            }
        }

        tabBadgesBtn.addEventListener("click", function () { setActiveTab("badges"); });
        tabLeaderboardBtn.addEventListener("click", function () { setActiveTab("leaderboard"); });
        tabStatsBtn.addEventListener("click", function () { setActiveTab("stats"); });

        meBtn.addEventListener("click", useMyAccount);
        refreshBtn.addEventListener("click", loadBadges);
        simulateBtn.addEventListener("click", simulatePlayback);

        setActiveTab("badges");
        useMyAccount();
    }

    function mountRoute() {
        ensureStyles();

        let root = document.getElementById(ROOT_ID);
        if (!root) {
            root = createRoot();
            document.body.appendChild(root);
        }

        root.style.display = "block";
        setupPage(root);
    }

    function unmountRoute() {
        const root = document.getElementById(ROOT_ID);
        if (root) {
            root.style.display = "none";
        }
    }

    function onRouteChange() {
        if (window.location.hash.startsWith(ROUTE)) {
            mountRoute();
        } else {
            unmountRoute();
        }
    }

    window.addEventListener("hashchange", onRouteChange);
    window.addEventListener("popstate", onRouteChange);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onRouteChange);
    } else {
        onRouteChange();
    }
})();