(function () {
    const ROUTE = "#!/achievements";
    const ROOT_ID = "achievementBadgesShellRoot";
    const PROFILE_ROOT_ID = "achievementBadgesProfileShowcase";
    const HOME_WIDGET_ID = "achievementBadgesHomeWidget";
    const SIDEBAR_ID = "achievementsSidebarEntry";

    function rarityClass(rarity) {
        const value = (rarity || "").toLowerCase();
        if (value === "uncommon") return "rarity-uncommon";
        if (value === "rare") return "rarity-rare";
        if (value === "epic") return "rarity-epic";
        if (value === "legendary") return "rarity-legendary";
        if (value === "mythic") return "rarity-mythic";
        return "rarity-common";
    }

    function rarityWeight(rarity) {
        const value = (rarity || "").toLowerCase();
        if (value === "mythic") return 6;
        if (value === "legendary") return 5;
        if (value === "epic") return 4;
        if (value === "rare") return 3;
        if (value === "uncommon") return 2;
        return 1;
    }

    function rarityCardClass(rarity, unlocked) {
        const value = (rarity || "common").toLowerCase();
        return "ab-card-" + value + (unlocked ? " ab-card-unlocked" : " ab-card-locked");
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
            local_movies: "🍿",
            emoji_events: "🏆"
        };

        return map[key] || "🏅";
    }

    function getApiClient() {
        return window.ApiClient || window.apiClient || null;
    }

    function normaliseApiPath(path) {
        return String(path || "").replace(/^\/+/, "");
    }

    async function fetchJson(path, options) {
        const apiClient = getApiClient();
        const cleanPath = normaliseApiPath(path);

        if (apiClient && typeof apiClient.getJSON === "function" && !options) {
            return await apiClient.getJSON(apiClient.getUrl(cleanPath));
        }

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
                } catch (_) {
                }

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
            } catch (_) {
            }

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
                    if (id) {
                        return id;
                    }
                }

                if (apiClient._serverInfo && apiClient._serverInfo.UserId) {
                    return apiClient._serverInfo.UserId;
                }
            }

            const me = await fetchJson("Users/Me");
            return me && me.Id ? me.Id : "";
        } catch (_) {
            return "";
        }
    }

    function ensureGlobalStyles() {
        if (document.getElementById("achievementBadgesShellStyles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "achievementBadgesShellStyles";
        style.textContent = `
            #${ROOT_ID}{
                position:fixed;
                inset:0;
                z-index:999999;
                overflow-y:auto;
                padding:2em;
                background:
                    radial-gradient(circle at top left, rgba(96,165,250,0.10), transparent 28%),
                    radial-gradient(circle at top right, rgba(167,139,250,0.08), transparent 24%),
                    linear-gradient(180deg, #151922 0%, #1b202b 100%);
                color:var(--theme-primary-color, #fff);
                display:none;
            }
            #${ROOT_ID} .ab-wrap{
                max-width:1500px;
                margin:0 auto;
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
                border-radius:12px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.05);
                color:#fff;
                cursor:pointer;
                text-decoration:none;
                display:inline-flex;
                align-items:center;
                gap:0.5em;
                font-weight:700;
                backdrop-filter: blur(10px);
            }
            #${ROOT_ID} .ab-hero{
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                flex-wrap:wrap;
                gap:1em;
                padding:1.4em;
                border-radius:22px;
                background:linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
                border:1px solid rgba(255,255,255,0.12);
                box-shadow:0 18px 40px rgba(0,0,0,0.24);
                backdrop-filter: blur(12px);
            }
            #${ROOT_ID} .ab-hero-left{
                display:flex;
                align-items:center;
                gap:1em;
                min-width:260px;
            }
            #${ROOT_ID} .ab-hero-icon{
                width:64px;
                height:64px;
                border-radius:999px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
                border:1px solid rgba(255,255,255,0.14);
                box-shadow:0 10px 24px rgba(0,0,0,0.22);
                font-size:1.7em;
                flex-shrink:0;
            }
            #${ROOT_ID} .ab-hero-title{
                font-size:1.3em;
                font-weight:800;
                line-height:1.2;
            }
            #${ROOT_ID} .ab-hero-subtitle{
                font-size:0.94em;
                opacity:0.84;
                margin-top:0.2em;
            }
            #${ROOT_ID} .ab-hero-actions{
                display:flex;
                gap:0.6em;
                flex-wrap:wrap;
                align-items:center;
            }
            #${ROOT_ID} .ab-featured-hero{
                margin-top:1.25em;
                display:grid;
                grid-template-columns:minmax(280px, 1.15fr) minmax(280px, 1fr);
                gap:1em;
            }
            #${ROOT_ID} .ab-featured-primary,
            #${ROOT_ID} .ab-featured-secondary{
                border-radius:20px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.05);
                backdrop-filter: blur(12px);
                box-shadow:0 16px 34px rgba(0,0,0,0.20);
            }
            #${ROOT_ID} .ab-featured-primary{
                padding:1.25em;
                display:flex;
                gap:1em;
                align-items:center;
                min-height:200px;
            }
            #${ROOT_ID} .ab-featured-primary-icon{
                width:92px;
                height:92px;
                border-radius:999px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:2.25em;
                flex-shrink:0;
                border:1px solid rgba(255,255,255,0.14);
                background:linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
                box-shadow:0 14px 30px rgba(0,0,0,0.22);
            }
            #${ROOT_ID} .ab-featured-overline{
                font-size:0.8em;
                font-weight:800;
                letter-spacing:0.08em;
                text-transform:uppercase;
                color:#9fb3c8;
                margin-bottom:0.4em;
            }
            #${ROOT_ID} .ab-featured-title{
                font-size:1.5em;
                font-weight:900;
                line-height:1.15;
            }
            #${ROOT_ID} .ab-featured-description{
                margin-top:0.6em;
                opacity:0.92;
                line-height:1.5;
            }
            #${ROOT_ID} .ab-featured-meta{
                margin-top:0.8em;
                display:flex;
                flex-wrap:wrap;
                gap:0.6em;
                align-items:center;
            }
            #${ROOT_ID} .ab-chip{
                display:inline-flex;
                align-items:center;
                gap:0.35em;
                padding:0.45em 0.75em;
                border-radius:999px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.06);
                font-size:0.9em;
                font-weight:700;
            }
            #${ROOT_ID} .ab-featured-secondary{
                padding:1em;
            }
            #${ROOT_ID} .ab-featured-secondary-grid{
                display:grid;
                grid-template-columns:1fr;
                gap:0.8em;
            }
            #${ROOT_ID} .ab-featured-mini{
                display:flex;
                gap:0.8em;
                align-items:center;
                padding:0.85em;
                border-radius:14px;
                border:1px solid rgba(255,255,255,0.10);
                background:rgba(255,255,255,0.04);
            }
            #${ROOT_ID} .ab-featured-mini-icon{
                width:52px;
                height:52px;
                border-radius:999px;
                display:flex;
                align-items:center;
                justify-content:center;
                flex-shrink:0;
                font-size:1.3em;
                border:1px solid rgba(255,255,255,0.14);
                background:linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06));
            }
            #${ROOT_ID} .ab-section-eyebrow,
            #${HOME_WIDGET_ID} .ab-section-eyebrow{
                font-size:0.84em;
                font-weight:800;
                letter-spacing:0.08em;
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
            #${ROOT_ID} .ab-showcase-card,
            #${PROFILE_ROOT_ID} .ab-showcase-card,
            #${HOME_WIDGET_ID} .ab-showcase-card{
                display:flex;
                align-items:center;
                gap:0.6em;
                padding:0.8em;
                border-radius:14px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.05);
                backdrop-filter: blur(8px);
            }
            #${ROOT_ID} .ab-showcase-icon,
            #${ROOT_ID} .ab-badge-icon,
            #${PROFILE_ROOT_ID} .ab-showcase-icon,
            #${HOME_WIDGET_ID} .ab-showcase-icon{
                width:44px;
                height:44px;
                border-radius:999px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06));
                border:1px solid rgba(255,255,255,0.14);
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
            #${ROOT_ID} .ab-badge-card,
            #${HOME_WIDGET_ID} .ab-home-card{
                padding:1em;
                border-radius:16px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.05);
                backdrop-filter: blur(10px);
            }
            #${ROOT_ID} .ab-stat-card,
            #${HOME_WIDGET_ID} .ab-home-card{
                box-shadow:0 10px 26px rgba(0,0,0,0.18);
            }
            #${ROOT_ID} .ab-stat-title,
            #${HOME_WIDGET_ID} .ab-stat-title{
                font-size:0.9em;
                opacity:0.8;
            }
            #${ROOT_ID} .ab-stat-value,
            #${HOME_WIDGET_ID} .ab-stat-value{
                font-size:2em;
                font-weight:800;
                margin-top:0.2em;
                letter-spacing:-0.02em;
            }
            #${ROOT_ID} .ab-tabs{
                margin-top:1.5em;
                display:flex;
                gap:0.65em;
                flex-wrap:wrap;
            }
            #${ROOT_ID} .ab-tab{
                padding:0.6em 1em;
                border-radius:12px;
                border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.04);
                cursor:pointer;
                font-weight:700;
                color:#fff;
            }
            #${ROOT_ID} .ab-tab.active{
                background:rgba(255,255,255,0.14);
                box-shadow:0 6px 18px rgba(0,0,0,0.16);
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
                font-size:1.06em;
                font-weight:800;
                line-height:1.2;
            }
            #${ROOT_ID} .ab-badge-meta{
                font-size:0.92em;
                opacity:0.95;
            }
            #${ROOT_ID} .ab-badge-description,
            #${HOME_WIDGET_ID} .ab-badge-description{
                margin-top:0.55em;
                line-height:1.45;
                opacity:0.92;
            }
            #${ROOT_ID} .ab-progress-text,
            #${HOME_WIDGET_ID} .ab-progress-text{
                display:flex;
                justify-content:space-between;
                font-size:0.92em;
                margin:0.8em 0 0.35em 0;
                opacity:0.86;
            }
            #${ROOT_ID} .ab-progress-bar,
            #${HOME_WIDGET_ID} .ab-progress-bar{
                height:12px;
                border-radius:999px;
                overflow:hidden;
                background:rgba(10,13,18,0.85);
                border:1px solid rgba(255,255,255,0.10);
                box-shadow: inset 0 2px 8px rgba(0,0,0,0.26);
            }
            #${ROOT_ID} .ab-progress-fill,
            #${HOME_WIDGET_ID} .ab-progress-fill{
                height:100%;
                background:linear-gradient(90deg, #60a5fa, #93c5fd);
                box-shadow:0 0 18px rgba(96,165,250,0.28);
            }
            #${ROOT_ID} .ab-badge-footer{
                margin-top:0.85em;
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:0.6em;
                flex-wrap:wrap;
            }
            #${ROOT_ID} .ab-btn,
            #${HOME_WIDGET_ID} .ab-btn,
            #${ROOT_ID} .ab-filter-btn,
            #${ROOT_ID} .ab-sort-select,
            #${ROOT_ID} .ab-search-input{
                padding:0.58em 0.9em;
                border-radius:10px;
                border:1px solid rgba(255,255,255,0.14);
                background:rgba(255,255,255,0.05);
                color:#fff;
            }
            #${ROOT_ID} .ab-btn,
            #${HOME_WIDGET_ID} .ab-btn,
            #${ROOT_ID} .ab-filter-btn{
                cursor:pointer;
                text-decoration:none;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                font-weight:700;
            }
            #${ROOT_ID} .ab-filter-btn.active{
                background:rgba(255,255,255,0.18);
                border-color:rgba(255,255,255,0.24);
                box-shadow:0 8px 18px rgba(0,0,0,0.16);
            }
            #${ROOT_ID} .ab-controls{
                margin-top:1.25em;
                display:flex;
                flex-wrap:wrap;
                gap:0.75em;
                align-items:center;
            }
            #${ROOT_ID} .ab-filter-group{
                display:flex;
                flex-wrap:wrap;
                gap:0.55em;
            }
            #${ROOT_ID} .ab-search-input{
                min-width:220px;
            }
            #${ROOT_ID} .ab-sort-select{
                min-width:170px;
            }
            #${ROOT_ID} .ab-unlocked{
                color:#4ade80;
                font-weight:800;
            }
            #${ROOT_ID} .ab-locked{
                color:#f87171;
                font-weight:800;
            }
            #${ROOT_ID} .ab-card-locked{
                opacity:0.88;
            }
            #${ROOT_ID} .ab-card-unlocked{
                transform:translateY(0);
                transition:transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
            }
            #${ROOT_ID} .ab-card-unlocked:hover{
                transform:translateY(-2px);
            }
            #${ROOT_ID} .ab-card-common{
                border-color:rgba(159,179,200,0.20);
                box-shadow:0 8px 22px rgba(0,0,0,0.16);
            }
            #${ROOT_ID} .ab-card-uncommon{
                border-color:rgba(52,211,153,0.28);
                box-shadow:0 0 0 1px rgba(52,211,153,0.12), 0 10px 24px rgba(0,0,0,0.18), 0 0 24px rgba(52,211,153,0.10);
            }
            #${ROOT_ID} .ab-card-rare{
                border-color:rgba(96,165,250,0.30);
                box-shadow:0 0 0 1px rgba(96,165,250,0.12), 0 10px 24px rgba(0,0,0,0.18), 0 0 26px rgba(96,165,250,0.12);
            }
            #${ROOT_ID} .ab-card-epic{
                border-color:rgba(167,139,250,0.32);
                box-shadow:0 0 0 1px rgba(167,139,250,0.14), 0 12px 28px rgba(0,0,0,0.20), 0 0 28px rgba(167,139,250,0.14);
            }
            #${ROOT_ID} .ab-card-legendary{
                border-color:rgba(251,191,36,0.34);
                box-shadow:0 0 0 1px rgba(251,191,36,0.16), 0 12px 30px rgba(0,0,0,0.22), 0 0 30px rgba(251,191,36,0.16);
            }
            #${ROOT_ID} .ab-card-mythic{
                border-color:rgba(244,63,94,0.36);
                box-shadow:0 0 0 1px rgba(244,63,94,0.18), 0 12px 32px rgba(0,0,0,0.24), 0 0 34px rgba(244,63,94,0.18);
            }
            #${ROOT_ID} .ab-card-unlocked.ab-card-common{
                background:linear-gradient(180deg, rgba(159,179,200,0.10), rgba(255,255,255,0.04));
            }
            #${ROOT_ID} .ab-card-unlocked.ab-card-uncommon{
                background:linear-gradient(180deg, rgba(52,211,153,0.12), rgba(255,255,255,0.04));
            }
            #${ROOT_ID} .ab-card-unlocked.ab-card-rare{
                background:linear-gradient(180deg, rgba(96,165,250,0.12), rgba(255,255,255,0.04));
            }
            #${ROOT_ID} .ab-card-unlocked.ab-card-epic{
                background:linear-gradient(180deg, rgba(167,139,250,0.13), rgba(255,255,255,0.04));
            }
            #${ROOT_ID} .ab-card-unlocked.ab-card-legendary{
                background:linear-gradient(180deg, rgba(251,191,36,0.14), rgba(255,255,255,0.04));
            }
            #${ROOT_ID} .ab-card-unlocked.ab-card-mythic{
                background:linear-gradient(180deg, rgba(244,63,94,0.16), rgba(255,255,255,0.04));
            }
            #${ROOT_ID} .ab-card-locked .ab-badge-icon{
                filter:saturate(0.65);
                opacity:0.82;
            }
            #${ROOT_ID} .ab-card-unlocked .ab-badge-icon{
                box-shadow:0 0 18px rgba(255,255,255,0.08);
            }
            #${ROOT_ID} .rarity-common,
            #${PROFILE_ROOT_ID} .rarity-common,
            #${HOME_WIDGET_ID} .rarity-common{ color:#9fb3c8; }
            #${ROOT_ID} .rarity-uncommon,
            #${PROFILE_ROOT_ID} .rarity-uncommon,
            #${HOME_WIDGET_ID} .rarity-uncommon{ color:#34d399; }
            #${ROOT_ID} .rarity-rare,
            #${PROFILE_ROOT_ID} .rarity-rare,
            #${HOME_WIDGET_ID} .rarity-rare{ color:#60a5fa; }
            #${ROOT_ID} .rarity-epic,
            #${PROFILE_ROOT_ID} .rarity-epic,
            #${HOME_WIDGET_ID} .rarity-epic{ color:#a78bfa; }
            #${ROOT_ID} .rarity-legendary,
            #${PROFILE_ROOT_ID} .rarity-legendary,
            #${HOME_WIDGET_ID} .rarity-legendary{ color:#fbbf24; }
            #${ROOT_ID} .rarity-mythic,
            #${PROFILE_ROOT_ID} .rarity-mythic,
            #${HOME_WIDGET_ID} .rarity-mythic{ color:#f43f5e; }
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
                border-radius:14px;
                background:rgba(248,113,113,0.08);
                color:#fca5a5;
            }
            #${ROOT_ID} .ab-toast-stack{
                position:fixed;
                right:1.25em;
                bottom:1.25em;
                display:flex;
                flex-direction:column;
                gap:0.75em;
                z-index:1000000;
            }
            #${ROOT_ID} .ab-toast{
                min-width:280px;
                max-width:360px;
                padding:0.9em 1em;
                border-radius:16px;
                border:1px solid rgba(255,255,255,0.14);
                background:rgba(20,24,32,0.96);
                box-shadow:0 14px 34px rgba(0,0,0,0.30);
                display:flex;
                gap:0.8em;
                align-items:center;
                backdrop-filter: blur(10px);
            }
            #${ROOT_ID} .ab-toast-icon{
                width:42px;
                height:42px;
                border-radius:999px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06));
                border:1px solid rgba(255,255,255,0.14);
                flex-shrink:0;
                font-size:1.15em;
            }
            #${ROOT_ID} .ab-toast-title{
                font-weight:800;
                line-height:1.2;
            }
            #${ROOT_ID} .ab-toast-subtitle{
                font-size:0.9em;
                opacity:0.86;
                margin-top:0.15em;
            }
            #${ROOT_ID} .ab-muted,
            #${HOME_WIDGET_ID} .ab-muted{ opacity:0.8; }
            #${ROOT_ID} .ab-leaderboard-row{
                display:flex;
                justify-content:space-between;
                gap:1em;
                padding:0.85em 0;
                border-bottom:1px solid rgba(255,255,255,0.08);
                flex-wrap:wrap;
            }
            #${ROOT_ID} .ab-leaderboard-row:last-child{
                border-bottom:none;
            }
            #${PROFILE_ROOT_ID}{
                margin-top:1em;
                margin-bottom:1em;
                padding:1em;
                border:1px solid rgba(255,255,255,0.12);
                border-radius:16px;
                background:rgba(255,255,255,0.04);
                backdrop-filter: blur(10px);
            }
            #${PROFILE_ROOT_ID} .ab-profile-grid{
                display:grid;
                grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
                gap:0.75em;
            }
            #${HOME_WIDGET_ID}{
                margin-top:1em;
                margin-bottom:1em;
            }
            #${HOME_WIDGET_ID} .ab-home-grid{
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
                gap:1em;
            }
            #${HOME_WIDGET_ID} .ab-home-top{
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:1em;
                flex-wrap:wrap;
                margin-bottom:0.8em;
            }
            @media (max-width: 1100px){
                #${ROOT_ID} .ab-featured-hero{
                    grid-template-columns:1fr;
                }
            }
            @media (max-width: 900px){
                #${ROOT_ID}{
                    padding:1em;
                }
                #${ROOT_ID} .ab-controls{
                    flex-direction:column;
                    align-items:stretch;
                }
                #${ROOT_ID} .ab-search-input,
                #${ROOT_ID} .ab-sort-select{
                    min-width:0;
                    width:100%;
                }
                #${ROOT_ID} .ab-featured-primary{
                    flex-direction:column;
                    align-items:flex-start;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function findSidebarContainer() {
        return (
            document.querySelector(".mainDrawer-scrollContainer .itemsContainer") ||
            document.querySelector(".mainDrawer-scrollContainer") ||
            document.querySelector(".navMenuItems") ||
            document.querySelector(".mainDrawer") ||
            document.querySelector(".drawerContent")
        );
    }

    function ensureSidebarEntry() {
        if (document.getElementById(SIDEBAR_ID)) {
            return;
        }

        const sidebar = findSidebarContainer();
        if (!sidebar) {
            return;
        }

        const item = document.createElement("a");
        item.id = SIDEBAR_ID;
        item.href = "/web/index.html#!/achievements";
        item.className = "navMenuOption";
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.gap = "1em";

        item.innerHTML = `
            <span class="material-icons">emoji_events</span>
            <span>Achievements</span>
        `;

        sidebar.appendChild(item);

        item.addEventListener("click", function (event) {
            event.preventDefault();
            window.location.hash = "#!/achievements";
        });
    }

    function createRouteRoot() {
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

                <div id="abFeaturedHero" class="ab-featured-hero">
                    <div id="abFeaturedPrimary" class="ab-featured-primary">
                        <div class="ab-featured-primary-icon">🏅</div>
                        <div>
                            <div class="ab-featured-overline">Signature Badge</div>
                            <div class="ab-featured-title">No featured badge yet</div>
                            <div class="ab-featured-description">Equip a badge to create your signature identity.</div>
                            <div class="ab-featured-meta">
                                <span class="ab-chip">Featured</span>
                            </div>
                        </div>
                    </div>

                    <div class="ab-featured-secondary">
                        <div class="ab-section-eyebrow">Featured Loadout</div>
                        <div id="abFeaturedSecondaryGrid" class="ab-featured-secondary-grid">
                            <div class="ab-muted">Equip up to 3 badges to build your profile flair.</div>
                        </div>
                    </div>
                </div>

                <div id="abStatus" class="ab-status"></div>
                <div id="abError" class="ab-error"></div>

                <div style="margin-top:1.5em;">
                    <div class="ab-section-eyebrow">Recent Unlocks</div>
                    <div id="abRecentUnlocks" class="ab-badge-grid"></div>
                    <div id="abRecentUnlocksEmpty" class="ab-panel-card" style="margin-top:1em;">No achievements unlocked yet. Start watching to build your history.</div>
                </div>

                <div style="margin-top:1.5em;">
                    <div class="ab-section-eyebrow">Next Up</div>
                    <div id="abNextBadges" class="ab-badge-grid"></div>
                    <div id="abNextBadgesEmpty" class="ab-panel-card" style="margin-top:1em;">You have unlocked everything currently available.</div>
                </div>

                <div class="ab-stats">
                    <div class="ab-stat-card"><div class="ab-stat-title">Unlocked</div><div id="abUnlocked" class="ab-stat-value">0</div></div>
                    <div class="ab-stat-card"><div class="ab-stat-title">Total</div><div id="abTotal" class="ab-stat-value">0</div></div>
                    <div class="ab-stat-card"><div class="ab-stat-title">Completion</div><div id="abPercentage" class="ab-stat-value">0%</div></div>
                    <div class="ab-stat-card"><div class="ab-stat-title">Equipped</div><div id="abEquippedCount" class="ab-stat-value">0</div></div>
                    <div class="ab-stat-card"><div class="ab-stat-title">Score</div><div id="abScore" class="ab-stat-value">0</div></div>
                    <div class="ab-stat-card"><div class="ab-stat-title">Current Streak</div><div id="abCurrentStreak" class="ab-stat-value">0</div></div>
                    <div class="ab-stat-card"><div class="ab-stat-title">Best Streak</div><div id="abBestStreak" class="ab-stat-value">0</div></div>
                </div>

                <div class="ab-tabs">
                    <button class="ab-tab active" id="abTabBadgesBtn">My Badges</button>
                    <button class="ab-tab" id="abTabLeaderboardBtn">Leaderboard</button>
                    <button class="ab-tab" id="abTabStatsBtn">Stats</button>
                </div>

                <div id="abPanelBadges" class="ab-panel">
                    <div class="ab-controls">
                        <input id="abSearchInput" class="ab-search-input" type="text" placeholder="Search badges" />
                        <select id="abSortSelect" class="ab-sort-select">
                            <option value="default">Sort: Default</option>
                            <option value="progress">Sort: Progress</option>
                            <option value="rarity">Sort: Rarity</option>
                            <option value="newest">Sort: Newest unlocked</option>
                        </select>
                        <div class="ab-filter-group">
                            <button class="ab-filter-btn active" data-filter="all">All</button>
                            <button class="ab-filter-btn" data-filter="unlocked">Unlocked</button>
                            <button class="ab-filter-btn" data-filter="locked">Locked</button>
                            <button class="ab-filter-btn" data-filter="equipped">Equipped</button>
                        </div>
                    </div>

                    <h3 style="margin:1.25em 0 0.75em 0;">Equipped badges</h3>
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

                <div id="abToastStack" class="ab-toast-stack"></div>
            </div>
        `;
        document.body.appendChild(root);
        return root;
    }

    let routePageInitialised = false;

    function setupRoutePage(root) {
        if (routePageInitialised) {
            return;
        }
        routePageInitialised = true;

        const meBtn = root.querySelector("#abMeBtn");
        const refreshBtn = root.querySelector("#abRefreshBtn");
        const simulateBtn = root.querySelector("#abSimulateBtn");

        const tabBadgesBtn = root.querySelector("#abTabBadgesBtn");
        const tabLeaderboardBtn = root.querySelector("#abTabLeaderboardBtn");
        const tabStatsBtn = root.querySelector("#abTabStatsBtn");

        const panelBadges = root.querySelector("#abPanelBadges");
        const panelLeaderboard = root.querySelector("#abPanelLeaderboard");
        const panelStats = root.querySelector("#abPanelStats");

        const searchInput = root.querySelector("#abSearchInput");
        const sortSelect = root.querySelector("#abSortSelect");
        const filterButtons = Array.from(root.querySelectorAll(".ab-filter-btn"));

        const statusText = root.querySelector("#abStatus");
        const errorBox = root.querySelector("#abError");
        const emptyState = root.querySelector("#abEmpty");
        const grid = root.querySelector("#abGrid");
        const equippedRow = root.querySelector("#abEquippedRow");
        const equippedEmpty = root.querySelector("#abEquippedEmpty");
        const leaderboardBox = root.querySelector("#abLeaderboard");
        const serverStatsBox = root.querySelector("#abServerStats");
        const showcaseRow = root.querySelector("#abShowcaseRow");
        const featuredPrimary = root.querySelector("#abFeaturedPrimary");
        const featuredSecondaryGrid = root.querySelector("#abFeaturedSecondaryGrid");
        const recentUnlocksRow = root.querySelector("#abRecentUnlocks");
        const recentUnlocksEmpty = root.querySelector("#abRecentUnlocksEmpty");
        const nextBadgesRow = root.querySelector("#abNextBadges");
        const nextBadgesEmpty = root.querySelector("#abNextBadgesEmpty");
        const profileTitle = root.querySelector("#abProfileTitle");
        const profileSubtitle = root.querySelector("#abProfileSubtitle");
        const unlockedValue = root.querySelector("#abUnlocked");
        const totalValue = root.querySelector("#abTotal");
        const percentageValue = root.querySelector("#abPercentage");
        const equippedCountValue = root.querySelector("#abEquippedCount");
        const scoreValue = root.querySelector("#abScore");
        const currentStreakValue = root.querySelector("#abCurrentStreak");
        const bestStreakValue = root.querySelector("#abBestStreak");
        const toastStack = root.querySelector("#abToastStack");

        let currentUserId = "";
        let allBadgesCache = [];
        let activeFilter = "all";
        const seenUnlockedBadgeIds = new Set();
        let unlockPollStarted = false;

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
            scoreValue.textContent = summary && summary.Score != null ? summary.Score : 0;
            currentStreakValue.textContent = summary && summary.CurrentWatchStreak != null ? summary.CurrentWatchStreak : 0;
            bestStreakValue.textContent = summary && summary.BestWatchStreak != null ? summary.BestWatchStreak : 0;
        }

        function setActiveTab(name) {
            panelBadges.style.display = name === "badges" ? "block" : "none";
            panelLeaderboard.style.display = name === "leaderboard" ? "block" : "none";
            panelStats.style.display = name === "stats" ? "block" : "none";

            tabBadgesBtn.classList.toggle("active", name === "badges");
            tabLeaderboardBtn.classList.toggle("active", name === "leaderboard");
            tabStatsBtn.classList.toggle("active", name === "stats");
        }

        function createSmallBadgeCard(badge, subtitle) {
            const card = document.createElement("div");
            card.className = "ab-badge-card " + rarityCardClass(badge.Rarity, badge.Unlocked);
            card.innerHTML =
                '<div class="ab-badge-header">' +
                    '<div class="ab-badge-icon">' + iconGlyph(badge.Icon) + '</div>' +
                    '<div style="flex:1;">' +
                        '<div class="ab-badge-title">' + badge.Title + '</div>' +
                        '<div class="ab-badge-meta ' + rarityClass(badge.Rarity) + '">' + badge.Rarity + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ab-badge-description">' + subtitle + '</div>';
            return card;
        }

        function renderFeaturedLoadout(badges) {
            const equipped = Array.isArray(badges) ? badges.slice(0, 3) : [];

            if (!equipped.length) {
                featuredPrimary.className = "ab-featured-primary";
                featuredPrimary.innerHTML =
                    '<div class="ab-featured-primary-icon">🏅</div>' +
                    '<div>' +
                        '<div class="ab-featured-overline">Signature Badge</div>' +
                        '<div class="ab-featured-title">No featured badge yet</div>' +
                        '<div class="ab-featured-description">Equip a badge to create your signature identity.</div>' +
                        '<div class="ab-featured-meta"><span class="ab-chip">Featured</span></div>' +
                    '</div>';

                featuredSecondaryGrid.innerHTML = '<div class="ab-muted">Equip up to 3 badges to build your profile flair.</div>';
                return;
            }

            const primary = equipped[0];

            featuredPrimary.className = "ab-featured-primary " + rarityCardClass(primary.Rarity, true);
            featuredPrimary.innerHTML =
                '<div class="ab-featured-primary-icon">' + iconGlyph(primary.Icon) + '</div>' +
                '<div>' +
                    '<div class="ab-featured-overline">Signature Badge</div>' +
                    '<div class="ab-featured-title">' + primary.Title + '</div>' +
                    '<div class="ab-featured-description">' + primary.Description + '</div>' +
                    '<div class="ab-featured-meta">' +
                        '<span class="ab-chip ' + rarityClass(primary.Rarity) + '">' + primary.Rarity + '</span>' +
                        '<span class="ab-chip">' + primary.Category + '</span>' +
                        '<span class="ab-chip">Primary</span>' +
                    '</div>' +
                '</div>';

            const secondary = equipped.slice(1);

            if (!secondary.length) {
                featuredSecondaryGrid.innerHTML = '<div class="ab-muted">Equip more badges to expand your featured loadout.</div>';
                return;
            }

            featuredSecondaryGrid.innerHTML = "";

            secondary.forEach(function (badge, index) {
                const item = document.createElement("div");
                item.className = "ab-featured-mini " + rarityCardClass(badge.Rarity, true);
                item.innerHTML =
                    '<div class="ab-featured-mini-icon">' + iconGlyph(badge.Icon) + '</div>' +
                    '<div style="flex:1;">' +
                        '<div style="font-weight:800;">' + badge.Title + '</div>' +
                        '<div class="' + rarityClass(badge.Rarity) + '" style="font-size:0.9em;margin-top:0.15em;">' + badge.Rarity + ' • Slot ' + (index + 2) + '</div>' +
                    '</div>';

                featuredSecondaryGrid.appendChild(item);
            });
        }

        function renderRecentUnlocks(badges) {
            recentUnlocksRow.innerHTML = "";

            if (!badges || badges.length === 0) {
                recentUnlocksEmpty.style.display = "block";
                return;
            }

            recentUnlocksEmpty.style.display = "none";

            badges.forEach(function (badge) {
                let unlockedText = "Unlocked recently";

                if (badge.UnlockedAt) {
                    const unlockedDate = new Date(badge.UnlockedAt);
                    unlockedText = "Unlocked: " + unlockedDate.toLocaleString();
                }

                recentUnlocksRow.appendChild(createSmallBadgeCard(badge, unlockedText));
            });
        }

        function renderNextBadges(badges) {
            nextBadgesRow.innerHTML = "";

            if (!badges || badges.length === 0) {
                nextBadgesEmpty.style.display = "block";
                return;
            }

            nextBadgesEmpty.style.display = "none";

            badges.forEach(function (badge) {
                const current = badge.CurrentValue || 0;
                const target = badge.TargetValue || 0;
                const remaining = Math.max(target - current, 0);
                const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

                const card = document.createElement("div");
                card.className = "ab-badge-card " + rarityCardClass(badge.Rarity, badge.Unlocked);
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
                        '<div class="ab-muted">' + remaining + ' remaining</div>' +
                    '</div>';

                nextBadgesRow.appendChild(card);
            });
        }

        function renderShowcase(badges) {
            showcaseRow.innerHTML = "";

            if (!badges || badges.length === 0) {
                showcaseRow.innerHTML = '<div class="ab-muted">No showcase yet. Equip badges as you unlock them.</div>';
                return;
            }

            badges.forEach(function (badge, index) {
                const card = document.createElement("div");
                card.className = "ab-showcase-card";
                card.innerHTML =
                    '<div class="ab-showcase-icon">' + iconGlyph(badge.Icon) + '</div>' +
                    '<div>' +
                        '<div style="font-weight:800;">' + badge.Title + (index === 0 ? ' ★' : '') + '</div>' +
                        '<div class="' + rarityClass(badge.Rarity) + '" style="font-size:0.88em;">' + badge.Rarity + '</div>' +
                    '</div>';

                showcaseRow.appendChild(card);
            });
        }

        function renderEquippedBadges(badges) {
            equippedRow.innerHTML = "";

            if (!badges || badges.length === 0) {
                equippedEmpty.style.display = "block";
                renderFeaturedLoadout([]);
                return;
            }

            equippedEmpty.style.display = "none";
            renderFeaturedLoadout(badges);

            badges.forEach(function (badge, index) {
                const card = document.createElement("div");
                card.className = "ab-badge-card " + rarityCardClass(badge.Rarity, true);
                card.setAttribute("data-badge-id", badge.Id);

                card.innerHTML =
                    '<div class="ab-badge-header">' +
                        '<div class="ab-badge-icon">' + iconGlyph(badge.Icon) + '</div>' +
                        '<div style="flex:1;">' +
                            '<div class="ab-badge-title">' + badge.Title + (index === 0 ? ' ★' : '') + '</div>' +
                            '<div class="ab-badge-meta ' + rarityClass(badge.Rarity) + '">' + badge.Rarity + (index === 0 ? ' • Signature' : ' • Equipped') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ab-badge-footer">' +
                        '<div class="ab-unlocked">' + (index === 0 ? 'Primary Equipped' : 'Equipped') + '</div>' +
                        '<button type="button" class="ab-btn">Unequip</button>' +
                    '</div>';

                card.querySelector("button").addEventListener("click", function () {
                    unequipBadge(badge.Id);
                });

                equippedRow.appendChild(card);
            });
        }

        function applyBadgeFilteringAndSorting(badges, equippedIds) {
            let filtered = badges.slice();
            const searchTerm = (searchInput.value || "").trim().toLowerCase();

            if (searchTerm) {
                filtered = filtered.filter(function (badge) {
                    return (
                        (badge.Title || "").toLowerCase().includes(searchTerm) ||
                        (badge.Description || "").toLowerCase().includes(searchTerm) ||
                        (badge.Category || "").toLowerCase().includes(searchTerm) ||
                        (badge.Rarity || "").toLowerCase().includes(searchTerm)
                    );
                });
            }

            if (activeFilter === "unlocked") {
                filtered = filtered.filter(function (badge) { return !!badge.Unlocked; });
            } else if (activeFilter === "locked") {
                filtered = filtered.filter(function (badge) { return !badge.Unlocked; });
            } else if (activeFilter === "equipped") {
                filtered = filtered.filter(function (badge) { return equippedIds.has(badge.Id); });
            }

            const sortMode = sortSelect.value || "default";

            if (sortMode === "progress") {
                filtered.sort(function (a, b) {
                    const aTarget = a.TargetValue || 0;
                    const bTarget = b.TargetValue || 0;
                    const aProgress = aTarget > 0 ? (a.CurrentValue || 0) / aTarget : 0;
                    const bProgress = bTarget > 0 ? (b.CurrentValue || 0) / bTarget : 0;
                    return bProgress - aProgress;
                });
            } else if (sortMode === "rarity") {
                filtered.sort(function (a, b) {
                    return rarityWeight(b.Rarity) - rarityWeight(a.Rarity);
                });
            } else if (sortMode === "newest") {
                filtered.sort(function (a, b) {
                    const aTime = a.UnlockedAt ? new Date(a.UnlockedAt).getTime() : 0;
                    const bTime = b.UnlockedAt ? new Date(b.UnlockedAt).getTime() : 0;
                    return bTime - aTime;
                });
            }

            return filtered;
        }

        function renderBadges(badges) {
            grid.innerHTML = "";

            if (!badges || badges.length === 0) {
                emptyState.style.display = "block";
                return;
            }

            const equippedIds = new Set(
                Array.from(equippedRow.children)
                    .map(function (card) {
                        return card.getAttribute("data-badge-id");
                    })
                    .filter(Boolean)
            );

            const viewBadges = applyBadgeFilteringAndSorting(badges, equippedIds);

            if (viewBadges.length === 0) {
                emptyState.style.display = "block";
                emptyState.textContent = "No badges matched your current search or filters.";
                return;
            }

            emptyState.style.display = "none";
            emptyState.textContent = "Start watching to unlock your first achievement.";

            viewBadges.forEach(function (badge) {
                const current = badge.CurrentValue || 0;
                const target = badge.TargetValue || 0;
                const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                const isEquipped = equippedIds.has(badge.Id);

                const card = document.createElement("div");
                card.className = "ab-badge-card " + rarityCardClass(badge.Rarity, badge.Unlocked);

                const buttonLabel = isEquipped ? "Unequip" : "Equip";
                const buttonDisabled = !badge.Unlocked ? "disabled" : "";

                card.innerHTML =
                    '<div class="ab-badge-header">' +
                        '<div class="ab-badge-icon">' + iconGlyph(badge.Icon) + '</div>' +
                        '<div style="flex:1;">' +
                            '<div class="ab-badge-title">' + badge.Title + (isEquipped ? ' ★' : '') + '</div>' +
                            '<div class="ab-badge-meta ' + rarityClass(badge.Rarity) + '">' + badge.Rarity + ' • ' + badge.Category + (isEquipped ? ' • Equipped' : '') + '</div>' +
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

        function showUnlockToast(badge) {
            if (!toastStack) {
                return;
            }

            const toast = document.createElement("div");
            toast.className = "ab-toast";

            toast.innerHTML =
                '<div class="ab-toast-icon">' + iconGlyph(badge.Icon) + '</div>' +
                '<div>' +
                    '<div class="ab-toast-title">Achievement unlocked</div>' +
                    '<div class="ab-toast-subtitle">' + badge.Title + '</div>' +
                    '<div class="' + rarityClass(badge.Rarity) + '" style="font-size:0.88em;margin-top:0.15em;">' + badge.Rarity + '</div>' +
                '</div>';

            toastStack.appendChild(toast);

            window.setTimeout(function () {
                toast.remove();
            }, 4500);
        }

        async function pollUnlockedBadges() {
            if (!currentUserId) {
                return;
            }

            try {
                const badges = await fetchJson("Plugins/AchievementBadges/users/" + currentUserId + "/newly-unlocked");

                if (!Array.isArray(badges)) {
                    return;
                }

                badges
                    .sort(function (a, b) {
                        const aTime = a.UnlockedAt ? new Date(a.UnlockedAt).getTime() : 0;
                        const bTime = b.UnlockedAt ? new Date(b.UnlockedAt).getTime() : 0;
                        return aTime - bTime;
                    })
                    .forEach(function (badge) {
                        if (!seenUnlockedBadgeIds.has(badge.Id)) {
                            seenUnlockedBadgeIds.add(badge.Id);
                            showUnlockToast(badge);
                        }
                    });
            } catch (_) {
            }
        }

        function startUnlockPolling() {
            if (unlockPollStarted) {
                return;
            }

            unlockPollStarted = true;

            window.setInterval(function () {
                const rootElement = document.getElementById(ROOT_ID);
                if (rootElement && rootElement.style.display !== "none") {
                    pollUnlockedBadges();
                }
            }, 5000);
        }

        async function loadSummary(userId) {
            const summary = await fetchJson("Plugins/AchievementBadges/users/" + userId + "/summary");
            setSummary(summary);
            profileSubtitle.textContent =
                "Completion: " +
                ((summary && summary.Percentage != null) ? summary.Percentage : 0) +
                "% • Score: " +
                ((summary && summary.Score != null) ? summary.Score : 0) +
                " • Streak: " +
                ((summary && summary.CurrentWatchStreak != null) ? summary.CurrentWatchStreak : 0);
        }

        async function loadEquipped(userId) {
            const badges = await fetchJson("Plugins/AchievementBadges/users/" + userId + "/equipped");
            renderEquippedBadges(badges);
            renderShowcase(badges);
        }

        async function loadRecentUnlocks(userId) {
            const badges = await fetchJson("Plugins/AchievementBadges/users/" + userId + "/recent-unlocks?limit=8");
            renderRecentUnlocks(badges);
        }

        async function loadNextBadges(userId) {
            const badges = await fetchJson("Plugins/AchievementBadges/users/" + userId + "/next-badges?limit=5");
            renderNextBadges(badges);
        }

        async function loadLeaderboard() {
            const entries = await fetchJson("Plugins/AchievementBadges/leaderboard?limit=10");

            if (!entries || !entries.length) {
                leaderboardBox.innerHTML = '<div class="ab-muted">No leaderboard data yet.</div>';
                return;
            }

            leaderboardBox.innerHTML = entries.map(function (entry, index) {
                const displayName = entry.UserName || entry.UserId || "Unknown";

                return '<div class="ab-leaderboard-row">' +
                    '<div><strong>#' + (index + 1) + '</strong> • ' + displayName + '</div>' +
                    '<div>Score: ' + (entry.Score ?? 0) + ' • Best streak: ' + (entry.BestWatchStreak ?? 0) + ' • ' + entry.Unlocked + ' unlocked • ' + entry.Percentage + '%</div>' +
                '</div>';
            }).join("");
        }

        async function loadServerStats() {
            const stats = await fetchJson("Plugins/AchievementBadges/server/stats");

            serverStatsBox.innerHTML =
                '<div>Total users: ' + (stats.TotalUsers ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Total badges unlocked: ' + (stats.TotalBadgesUnlocked ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Total items watched: ' + (stats.TotalItemsWatched ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Total movies watched: ' + (stats.TotalMoviesWatched ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Total series completed: ' + (stats.TotalSeriesCompleted ?? 0) + '</div>' +
                '<div style="margin-top:0.45em;">Most common badge: ' + (stats.MostCommonBadge || "None") + '</div>' +
                '<div style="margin-top:0.45em;">Total achievement score: ' + (stats.TotalAchievementScore ?? 0) + '</div>';
        }

        async function reloadAll() {
            if (!currentUserId) {
                throw new Error("No user ID was found for this page.");
            }

            profileTitle.textContent = "Achievement Profile • " + currentUserId;

            const badges = await fetchJson("Plugins/AchievementBadges/users/" + currentUserId);
            allBadgesCache = Array.isArray(badges) ? badges.slice() : [];

            await loadSummary(currentUserId);
            await loadEquipped(currentUserId);
            await loadRecentUnlocks(currentUserId);
            await loadNextBadges(currentUserId);
            await loadLeaderboard();
            await loadServerStats();
            renderBadges(allBadgesCache);
        }

        async function loadBadges() {
            if (!currentUserId) {
                setStatus("");
                setError("No user ID was found for this page.");
                return;
            }

            clearError();
            setStatus("Loading badges...");
            startUnlockPolling();

            try {
                await reloadAll();
                setStatus("Badges loaded.");
            } catch (error) {
                grid.innerHTML = "";
                equippedRow.innerHTML = "";
                showcaseRow.innerHTML = "";
                featuredSecondaryGrid.innerHTML = '<div class="ab-muted">Equip up to 3 badges to build your profile flair.</div>';
                featuredPrimary.className = "ab-featured-primary";
                featuredPrimary.innerHTML =
                    '<div class="ab-featured-primary-icon">🏅</div>' +
                    '<div><div class="ab-featured-overline">Signature Badge</div><div class="ab-featured-title">No featured badge yet</div><div class="ab-featured-description">Equip a badge to create your signature identity.</div><div class="ab-featured-meta"><span class="ab-chip">Featured</span></div></div>';
                recentUnlocksRow.innerHTML = "";
                nextBadgesRow.innerHTML = "";
                allBadgesCache = [];
                equippedEmpty.style.display = "block";
                emptyState.style.display = "block";
                recentUnlocksEmpty.style.display = "block";
                nextBadgesEmpty.style.display = "block";
                leaderboardBox.innerHTML = "Failed to load leaderboard.";
                serverStatsBox.innerHTML = "Failed to load server stats.";
                profileSubtitle.textContent = "Could not load profile showcase.";
                setSummary({
                    Unlocked: 0,
                    Total: 0,
                    Percentage: 0,
                    EquippedCount: 0,
                    Score: 0,
                    CurrentWatchStreak: 0,
                    BestWatchStreak: 0
                });
                setStatus("");
                setError("Failed to load badges. " + (error && error.message ? error.message : "Unknown error."));
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
                await fetchJson("Plugins/AchievementBadges/users/" + currentUserId + "/simulate-playback", {
                    method: "POST"
                });
                await reloadAll();
                setStatus("Playback simulated successfully.");
            } catch (error) {
                setStatus("");
                setError("Failed to simulate playback. " + (error && error.message ? error.message : "Unknown error."));
            }
        }

        async function equipBadge(badgeId) {
            clearError();
            setStatus("Equipping badge...");

            try {
                await fetchJson("Plugins/AchievementBadges/users/" + currentUserId + "/equipped/" + badgeId, {
                    method: "POST"
                });
                await reloadAll();
                setStatus("Badge equipped.");
            } catch (error) {
                setStatus("");
                setError("Failed to equip badge. " + (error && error.message ? error.message : "Unknown error."));
            }
        }

        async function unequipBadge(badgeId) {
            clearError();
            setStatus("Unequipping badge...");

            try {
                await fetchJson("Plugins/AchievementBadges/users/" + currentUserId + "/equipped/" + badgeId, {
                    method: "DELETE"
                });
                await reloadAll();
                setStatus("Badge unequipped.");
            } catch (error) {
                setStatus("");
                setError("Failed to unequip badge. " + (error && error.message ? error.message : "Unknown error."));
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
                startUnlockPolling();
                await loadBadges();
            } catch (error) {
                setStatus("");
                setError("Failed to detect current user. " + (error && error.message ? error.message : "Unknown error."));
            }
        }

        function setFilter(nextFilter) {
            activeFilter = nextFilter;
            filterButtons.forEach(function (button) {
                button.classList.toggle("active", button.getAttribute("data-filter") === nextFilter);
            });
            renderBadges(allBadgesCache);
        }

        searchInput.addEventListener("input", function () {
            renderBadges(allBadgesCache);
        });

        sortSelect.addEventListener("change", function () {
            renderBadges(allBadgesCache);
        });

        filterButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                setFilter(button.getAttribute("data-filter") || "all");
            });
        });

        tabBadgesBtn.addEventListener("click", function () { setActiveTab("badges"); });
        tabLeaderboardBtn.addEventListener("click", function () { setActiveTab("leaderboard"); });
        tabStatsBtn.addEventListener("click", function () { setActiveTab("stats"); });

        meBtn.addEventListener("click", useMyAccount);
        refreshBtn.addEventListener("click", loadBadges);
        simulateBtn.addEventListener("click", simulatePlayback);

        setActiveTab("badges");
        window.setTimeout(function () {
            useMyAccount();
        }, 0);
    }

    function ensureProfileShowcaseContainer() {
        let wrapper = document.getElementById(PROFILE_ROOT_ID);
        if (wrapper) {
            return wrapper;
        }

        const host =
            document.querySelector(".itemDetailPage .detailPagePrimaryContainer") ||
            document.querySelector(".content-primary") ||
            document.querySelector(".verticalSection") ||
            document.querySelector("[data-role='content']");

        if (!host) {
            return null;
        }

        wrapper = document.createElement("div");
        wrapper.id = PROFILE_ROOT_ID;
        wrapper.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:1em;flex-wrap:wrap;margin-bottom:0.8em;">' +
                '<div style="font-size:1.05em;font-weight:700;">🏅 Achievements Showcase</div>' +
                '<a href="/web/index.html#!/achievements" style="color:#7dd3fc;text-decoration:none;font-weight:600;">Open Achievements</a>' +
            '</div>' +
            '<div id="achievementBadgesProfileItems" class="ab-profile-grid"></div>';

        host.prepend(wrapper);
        return wrapper;
    }

    async function injectProfileShowcase() {
        if (window.location.hash.startsWith(ROUTE)) {
            return;
        }

        const userId = await getCurrentUserId();
        if (!userId) {
            return;
        }

        const wrapper = ensureProfileShowcaseContainer();
        if (!wrapper) {
            return;
        }

        const items = wrapper.querySelector("#achievementBadgesProfileItems");
        if (!items) {
            return;
        }

        try {
            const badges = await fetchJson("Plugins/AchievementBadges/users/" + userId + "/equipped");
            items.innerHTML = "";

            if (!badges || badges.length === 0) {
                items.innerHTML = '<div class="ab-muted">No equipped badges yet.</div>';
                return;
            }

            badges.forEach(function (badge, index) {
                const card = document.createElement("div");
                card.className = "ab-showcase-card";
                card.innerHTML =
                    '<div class="ab-showcase-icon">' + iconGlyph(badge.Icon) + '</div>' +
                    '<div>' +
                        '<div style="font-weight:800;">' + badge.Title + (index === 0 ? ' ★' : '') + '</div>' +
                        '<div class="' + rarityClass(badge.Rarity) + '" style="font-size:0.88em;">' + badge.Rarity + '</div>' +
                    '</div>';

                items.appendChild(card);
            });
        } catch (_) {
            items.innerHTML = '<div style="color:#fca5a5;">Failed to load badges.</div>';
        }
    }

    function findHomeHost() {
        return (
            document.querySelector(".homeSectionsContainer") ||
            document.querySelector(".sections") ||
            document.querySelector(".skinBody .page") ||
            document.querySelector(".mainAnimatedPage .page") ||
            document.querySelector(".page")
        );
    }

    function ensureHomeWidgetContainer() {
        let wrapper = document.getElementById(HOME_WIDGET_ID);
        if (wrapper) {
            return wrapper;
        }

        const host = findHomeHost();
        if (!host) {
            return null;
        }

        wrapper = document.createElement("div");
        wrapper.id = HOME_WIDGET_ID;
        wrapper.innerHTML = `
            <div class="ab-home-card">
                <div class="ab-home-top">
                    <div style="font-size:1.05em;font-weight:700;">🏅 Achievements</div>
                    <a href="/web/index.html#!/achievements" class="ab-btn">Open Achievements</a>
                </div>

                <div class="ab-home-grid">
                    <div class="ab-home-card">
                        <div class="ab-stat-title">Unlocked</div>
                        <div id="abHomeUnlocked" class="ab-stat-value">0</div>
                    </div>

                    <div class="ab-home-card">
                        <div class="ab-stat-title">Completion</div>
                        <div id="abHomeCompletion" class="ab-stat-value">0%</div>
                    </div>

                    <div class="ab-home-card">
                        <div class="ab-stat-title">Score</div>
                        <div id="abHomeScore" class="ab-stat-value">0</div>
                    </div>

                    <div class="ab-home-card">
                        <div class="ab-stat-title">Streak</div>
                        <div id="abHomeStreak" class="ab-stat-value">0</div>
                    </div>

                    <div class="ab-home-card">
                        <div class="ab-section-eyebrow">Recent Unlock</div>
                        <div id="abHomeRecent">Loading...</div>
                    </div>

                    <div class="ab-home-card">
                        <div class="ab-section-eyebrow">Next Up</div>
                        <div id="abHomeNext">Loading...</div>
                    </div>
                </div>
            </div>
        `;

        host.prepend(wrapper);
        return wrapper;
    }

    function renderHomeBadge(container, badge, fallbackText, showProgress) {
        if (!container) {
            return;
        }

        if (!badge) {
            container.innerHTML = '<div class="ab-muted">' + fallbackText + '</div>';
            return;
        }

        const current = badge.CurrentValue || 0;
        const target = badge.TargetValue || 0;
        const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

        let extra = '<div class="' + rarityClass(badge.Rarity) + '" style="font-size:0.88em;margin-top:0.15em;">' + badge.Rarity + '</div>';

        if (showProgress) {
            extra +=
                '<div class="ab-progress-text"><span>Progress</span><span>' + current + '/' + target + '</span></div>' +
                '<div class="ab-progress-bar"><div class="ab-progress-fill" style="width:' + progress + '%;"></div></div>';
        }

        container.innerHTML =
            '<div class="ab-showcase-card">' +
                '<div class="ab-showcase-icon">' + iconGlyph(badge.Icon) + '</div>' +
                '<div style="flex:1;">' +
                    '<div style="font-weight:700;">' + badge.Title + '</div>' +
                    extra +
                '</div>' +
            '</div>';
    }

    async function injectHomeWidget() {
        if (window.location.hash.startsWith(ROUTE)) {
            return;
        }

        const hash = window.location.hash || "";
        const isHomeLike =
            hash === "" ||
            hash === "#!/home" ||
            hash.startsWith("#!/home?");

        if (!isHomeLike) {
            const existing = document.getElementById(HOME_WIDGET_ID);
            if (existing) {
                existing.remove();
            }
            return;
        }

        const userId = await getCurrentUserId();
        if (!userId) {
            return;
        }

        const wrapper = ensureHomeWidgetContainer();
        if (!wrapper) {
            return;
        }

        const unlockedEl = wrapper.querySelector("#abHomeUnlocked");
        const completionEl = wrapper.querySelector("#abHomeCompletion");
        const scoreEl = wrapper.querySelector("#abHomeScore");
        const streakEl = wrapper.querySelector("#abHomeStreak");
        const recentEl = wrapper.querySelector("#abHomeRecent");
        const nextEl = wrapper.querySelector("#abHomeNext");

        try {
            const [summary, recentUnlocks, nextBadges] = await Promise.all([
                fetchJson("Plugins/AchievementBadges/users/" + userId + "/summary"),
                fetchJson("Plugins/AchievementBadges/users/" + userId + "/recent-unlocks?limit=1"),
                fetchJson("Plugins/AchievementBadges/users/" + userId + "/next-badges?limit=1")
            ]);

            unlockedEl.textContent = summary && summary.Unlocked != null ? summary.Unlocked : 0;
            completionEl.textContent =
                summary && typeof summary.Percentage === "number"
                    ? summary.Percentage.toFixed(1) + "%"
                    : "0%";
            scoreEl.textContent = summary && summary.Score != null ? summary.Score : 0;
            streakEl.textContent = summary && summary.CurrentWatchStreak != null ? summary.CurrentWatchStreak : 0;

            renderHomeBadge(
                recentEl,
                Array.isArray(recentUnlocks) && recentUnlocks.length > 0 ? recentUnlocks[0] : null,
                "No unlocks yet.",
                false
            );

            renderHomeBadge(
                nextEl,
                Array.isArray(nextBadges) && nextBadges.length > 0 ? nextBadges[0] : null,
                "Everything unlocked.",
                true
            );
        } catch (_) {
            recentEl.innerHTML = '<div class="ab-muted">Failed to load.</div>';
            nextEl.innerHTML = '<div class="ab-muted">Failed to load.</div>';
        }
    }

    function mountRoute() {
        ensureGlobalStyles();
        ensureSidebarEntry();

        const root = createRouteRoot();
        root.style.display = "block";
        setupRoutePage(root);

        const notFound = document.querySelector(".exceptionContainer");
        if (notFound) {
            notFound.style.display = "none";
        }
    }

    function unmountRoute() {
        const root = document.getElementById(ROOT_ID);
        if (root) {
            root.style.display = "none";
        }

        const notFound = document.querySelector(".exceptionContainer");
        if (notFound) {
            notFound.style.display = "";
        }
    }

    function onRouteChange() {
        ensureGlobalStyles();
        ensureSidebarEntry();

        if (window.location.hash.startsWith(ROUTE)) {
            mountRoute();
        } else {
            unmountRoute();
            injectProfileShowcase();
            injectHomeWidget();
        }
    }

    function start() {
        onRouteChange();

        window.addEventListener("hashchange", onRouteChange);
        window.addEventListener("popstate", onRouteChange);

        const observer = new MutationObserver(function () {
            ensureSidebarEntry();

            if (!window.location.hash.startsWith(ROUTE)) {
                injectProfileShowcase();
                injectHomeWidget();
            }
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