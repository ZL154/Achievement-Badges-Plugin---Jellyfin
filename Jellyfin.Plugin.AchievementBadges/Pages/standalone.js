(function () {
    var ROUTE_MATCH = "/achievements";
    var ROOT_ID = "achievementBadgesStandaloneRoot";

    var iconMap = {
        play_circle:'\u25b6', travel_explore:'\ud83e\udded', weekend:'\ud83d\udecb', chair:'\ud83e\ude91', home:'\ud83c\udfe0',
        movie_filter:'\ud83c\udf9e', live_tv:'\ud83d\udcfa', theaters:'\ud83c\udfad', local_fire_department:'\ud83d\udd25',
        bolt:'\u26a1', military_tech:'\ud83c\udfc6', auto_awesome:'\u2728', movie:'\ud83c\udfac', tv:'\ud83d\udcfa',
        dark_mode:'\ud83c\udf19', nights_stay:'\ud83c\udf03', bedtime:'\ud83d\ude34', wb_sunny:'\ud83c\udf05', light_mode:'\u2600',
        sunny:'\ud83c\udf1e', event:'\ud83d\udcc5', event_available:'\ud83d\uddd3', celebration:'\ud83c\udf89', stars:'\ud83c\udf1f',
        collections_bookmark:'\ud83d\udcda', inventory_2:'\ud83d\uddc3', today:'\ud83d\udcc6', calendar_month:'\ud83d\uddd3',
        favorite:'\u2764', timeline:'\ud83d\udcc8', insights:'\ud83d\udcca', all_inclusive:'\u267e', speed:'\ud83d\udca8',
        hourglass_bottom:'\u23f3', directions_run:'\ud83c\udfc3', sports_score:'\ud83c\udfc1', local_movies:'\ud83c\udf7f',
        emoji_events:'\ud83c\udfc6'
    };

    function icon(name) { return iconMap[(name || '').toLowerCase()] || '\ud83c\udfc5'; }

    function rarityClass(r) {
        var v = (r || '').toLowerCase();
        if (v === 'uncommon') return 'ab-r-uncommon';
        if (v === 'rare') return 'ab-r-rare';
        if (v === 'epic') return 'ab-r-epic';
        if (v === 'legendary') return 'ab-r-legendary';
        if (v === 'mythic') return 'ab-r-mythic';
        return 'ab-r-common';
    }

    function getApiClient() { return window.ApiClient || window.apiClient || null; }

    function buildUrl(path) {
        var clean = String(path || '').replace(/^\/+/, '');
        var api = getApiClient();
        if (api && typeof api.getUrl === 'function') return api.getUrl(clean);
        return '/' + clean;
    }

    function getAuthHeaders() {
        var api = getApiClient();
        var h = { 'Content-Type': 'application/json' };
        if (!api) return h;
        try {
            if (typeof api.accessToken === 'function') {
                var t = api.accessToken();
                if (t) h['X-Emby-Token'] = t;
            } else if (api._serverInfo && api._serverInfo.AccessToken) {
                h['X-Emby-Token'] = api._serverInfo.AccessToken;
            }
        } catch (e) {}
        return h;
    }

    function fetchJson(path, method) {
        return fetch(buildUrl(path), {
            method: method || 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
        }).then(function (r) {
            if (!r.ok) {
                return r.text().then(function (t) {
                    var msg = 'Error ' + r.status;
                    try { var b = JSON.parse(t); if (b && b.Message) msg = b.Message; } catch (e) {}
                    throw new Error(msg);
                });
            }
            if (r.status === 204) return null;
            return r.text().then(function (t) { return t ? JSON.parse(t) : null; });
        });
    }

    function getCurrentUserId() {
        var api = getApiClient();
        if (api) {
            try {
                if (typeof api.getCurrentUserId === 'function') {
                    var id = api.getCurrentUserId();
                    if (id) return Promise.resolve(id);
                }
                if (api._serverInfo && api._serverInfo.UserId) return Promise.resolve(api._serverInfo.UserId);
            } catch (e) {}
        }
        return fetchJson('Users/Me').then(function (me) {
            return me && me.Id ? me.Id : '';
        }).catch(function () { return ''; });
    }

    function injectStyles() {
        if (document.getElementById('ab-standalone-css')) return;
        var s = document.createElement('style');
        s.id = 'ab-standalone-css';
        s.textContent = '#' + ROOT_ID + '{position:fixed;inset:0;z-index:999999;overflow-y:auto;padding:2em;background:var(--theme-body-background,#181818);color:#fff;font-family:inherit;color-scheme:dark;}' +
            '#' + ROOT_ID + ' .ab-input,#' + ROOT_ID + ' .ab-select{padding:0.6em 0.9em;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(20,24,32,0.85);color:#fff;font-size:0.92em;font-family:inherit;appearance:none;-webkit-appearance:none;-moz-appearance:none;cursor:pointer;}' +
            '#' + ROOT_ID + ' .ab-select{background-image:url(\'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22><path fill=%22%23fff%22 d=%22M4 6l4 4 4-4z%22/></svg>\');background-repeat:no-repeat;background-position:right 0.7em center;padding-right:2em;}' +
            '#' + ROOT_ID + ' .ab-select option{background:#181b24;color:#fff;}' +
            '#' + ROOT_ID + ' .ab-input:focus,#' + ROOT_ID + ' .ab-select:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102,126,234,0.25);}' +
            '#' + ROOT_ID + ' .ab-badge-pts{font-size:0.72em;font-weight:700;padding:0.25em 0.55em;border-radius:999px;background:linear-gradient(135deg,rgba(102,126,234,0.25),rgba(118,75,162,0.25));border:1px solid rgba(102,126,234,0.35);color:#c7d2ff;white-space:nowrap;}' +
            '#' + ROOT_ID + ' .ab-prestige-btn{position:relative;padding:0.9em 2em;border-radius:12px;border:2px solid #ffd700;background:linear-gradient(135deg,#6b00ff 0%,#9c27b0 35%,#e91e63 70%,#ff6b35 100%);color:#fff;font-weight:800;font-size:1em;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;box-shadow:0 0 30px rgba(255,215,0,0.3),0 0 60px rgba(233,30,99,0.2);transition:transform 0.15s,box-shadow 0.3s;overflow:hidden;}' +
            '#' + ROOT_ID + ' .ab-prestige-btn::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,0.4) 50%,transparent 70%);transform:translateX(-100%);transition:transform 0.6s;}' +
            '#' + ROOT_ID + ' .ab-prestige-btn:hover{transform:translateY(-2px);box-shadow:0 6px 40px rgba(255,215,0,0.5),0 0 80px rgba(233,30,99,0.4);}' +
            '#' + ROOT_ID + ' .ab-prestige-btn:hover::before{transform:translateX(100%);}' +
            '#' + ROOT_ID + ' .ab-prestige-btn:disabled{opacity:0.55;cursor:not-allowed;background:linear-gradient(135deg,#333,#555);border-color:rgba(255,215,0,0.2);box-shadow:none;}' +
            '#' + ROOT_ID + ' .ab-prestige-btn:disabled:hover{transform:none;}' +
            '#' + ROOT_ID + ' .ab-wrap{max-width:1500px;margin:0 auto;}' +
            '#' + ROOT_ID + ' .ab-topbar{display:flex;justify-content:space-between;align-items:center;gap:1em;flex-wrap:wrap;margin-bottom:1.2em;}' +
            '#' + ROOT_ID + ' .ab-back{padding:0.6em 1em;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#fff;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:0.5em;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-hero{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1em;padding:1.4em;border-radius:18px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);}' +
            '#' + ROOT_ID + ' .ab-hero-left{display:flex;align-items:center;gap:1em;}' +
            '#' + ROOT_ID + ' .ab-hero-icon{width:60px;height:60px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);font-size:1.6em;}' +
            '#' + ROOT_ID + ' .ab-hero-title{font-size:1.25em;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-hero-sub{font-size:0.92em;opacity:0.8;margin-top:0.2em;}' +
            '#' + ROOT_ID + ' .ab-showcase{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.8em;margin-top:1em;}' +
            '#' + ROOT_ID + ' .ab-sc-card{display:flex;align-items:center;gap:0.6em;padding:0.7em;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);}' +
            '#' + ROOT_ID + ' .ab-sc-icon{width:36px;height:36px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-stats{margin-top:1.5em;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1em;}' +
            '#' + ROOT_ID + ' .ab-stat{padding:1em;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);}' +
            '#' + ROOT_ID + ' .ab-stat-t{font-size:0.9em;opacity:0.8;}' +
            '#' + ROOT_ID + ' .ab-stat-v{font-size:2em;font-weight:700;margin-top:0.2em;}' +
            '#' + ROOT_ID + ' .ab-tabs{margin-top:1.5em;display:flex;gap:0.65em;flex-wrap:wrap;}' +
            '#' + ROOT_ID + ' .ab-tab{padding:0.55em 0.95em;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);cursor:pointer;font-weight:700;color:#fff;}' +
            '#' + ROOT_ID + ' .ab-tab.active{background:rgba(255,255,255,0.12);}' +
            '#' + ROOT_ID + ' .ab-panel{margin-top:1.5em;}' +
            '#' + ROOT_ID + ' .ab-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1em;margin-top:1em;}' +
            '#' + ROOT_ID + ' .ab-card{padding:1em;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);}' +
            '#' + ROOT_ID + ' .ab-card-h{display:flex;gap:0.8em;align-items:center;margin-bottom:0.7em;}' +
            '#' + ROOT_ID + ' .ab-card-icon{width:42px;height:42px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);font-size:1.2em;flex-shrink:0;}' +
            '#' + ROOT_ID + ' .ab-card-title{font-size:1.05em;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-card-meta{font-size:0.92em;opacity:0.9;}' +
            '#' + ROOT_ID + ' .ab-desc{margin-top:0.5em;line-height:1.45;}' +
            '#' + ROOT_ID + ' .ab-prog-text{display:flex;justify-content:space-between;font-size:0.92em;margin:0.7em 0 0.35em;opacity:0.8;}' +
            '#' + ROOT_ID + ' .ab-prog-bar{height:10px;border-radius:999px;overflow:hidden;background:#0f1318;border:1px solid rgba(255,255,255,0.1);}' +
            '#' + ROOT_ID + ' .ab-prog-fill{height:100%;background:#60a5fa;}' +
            '#' + ROOT_ID + ' .ab-footer{margin-top:0.8em;display:flex;justify-content:space-between;align-items:center;gap:0.6em;flex-wrap:wrap;}' +
            '#' + ROOT_ID + ' .ab-btn{padding:0.5em 0.85em;border-radius:8px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;}' +
            '#' + ROOT_ID + ' .ab-unlocked{color:#4ade80;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-locked{color:#f87171;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-r-common{color:#9fb3c8;}' +
            '#' + ROOT_ID + ' .ab-r-uncommon{color:#34d399;}' +
            '#' + ROOT_ID + ' .ab-r-rare{color:#60a5fa;}' +
            '#' + ROOT_ID + ' .ab-r-epic{color:#a78bfa;}' +
            '#' + ROOT_ID + ' .ab-r-legendary{color:#fbbf24;}' +
            '#' + ROOT_ID + ' .ab-r-mythic{color:#f43f5e;}' +
            '#' + ROOT_ID + ' .ab-lb-row{display:flex;justify-content:space-between;gap:1em;padding:0.75em 0;border-bottom:1px solid rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-lb-row:last-child{border-bottom:none;}' +
            '#' + ROOT_ID + ' .ab-panel-card{padding:1.1em;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);}' +
            '#' + ROOT_ID + ' .ab-muted{opacity:0.7;}' +
            '#' + ROOT_ID + ' .ab-error{margin-top:1em;padding:1em;border:1px solid rgba(248,113,113,0.45);border-radius:12px;background:rgba(248,113,113,0.08);color:#fca5a5;}' +
            '#' + ROOT_ID + ' .ab-eyebrow{font-size:0.88em;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9fb3c8;margin-bottom:0.7em;}' +
            // Theme overrides that unlock as the user reaches higher ranks
            '#' + ROOT_ID + '.ab-theme-enthusiast .ab-hero{background:linear-gradient(135deg,rgba(33,150,243,0.15),rgba(255,255,255,0.05));}' +
            '#' + ROOT_ID + '.ab-theme-binger .ab-hero{background:linear-gradient(135deg,rgba(156,39,176,0.18),rgba(255,255,255,0.05));border-color:rgba(156,39,176,0.35);}' +
            '#' + ROOT_ID + '.ab-theme-connoisseur .ab-hero{background:linear-gradient(135deg,rgba(233,30,99,0.2),rgba(255,255,255,0.05));border-color:rgba(233,30,99,0.45);}' +
            '#' + ROOT_ID + '.ab-theme-maestro .ab-hero{background:linear-gradient(135deg,rgba(255,152,0,0.2),rgba(255,255,255,0.05));border-color:rgba(255,152,0,0.45);box-shadow:0 0 40px rgba(255,152,0,0.15);}' +
            '#' + ROOT_ID + '.ab-theme-legend .ab-hero{background:linear-gradient(135deg,rgba(244,67,54,0.22),rgba(255,152,0,0.15));border-color:#ff6b35;box-shadow:0 0 60px rgba(244,67,54,0.2);}' +
            '#' + ROOT_ID + '.ab-theme-immortal{background:radial-gradient(circle at top,#1a0f2e 0%,#0d0618 100%);}' +
            '#' + ROOT_ID + '.ab-theme-immortal .ab-hero{background:linear-gradient(135deg,rgba(255,215,0,0.22),rgba(156,39,176,0.15));border-color:#ffd700;box-shadow:0 0 80px rgba(255,215,0,0.3);}' +
            '@media(max-width:900px){#' + ROOT_ID + '{padding:1em;}}';
        document.head.appendChild(s);
    }

    var userId = '';
    var root = null;

    function el(id) { return root ? root.querySelector('#' + id) : null; }

    function createRoot() {
        var r = document.getElementById(ROOT_ID);
        if (r) { r.innerHTML = ''; } else { r = document.createElement('div'); r.id = ROOT_ID; }
        r.innerHTML =
            '<div class="ab-wrap">' +
                '<div class="ab-topbar">' +
                    '<h2 style="margin:0;">Achievements</h2>' +
                    '<a class="ab-back" href="/web/index.html#!/home">\u2190 Back Home</a>' +
                '</div>' +
                '<div class="ab-hero">' +
                    '<div style="flex:1;min-width:280px;">' +
                        '<div class="ab-hero-left">' +
                            '<div id="abSaRankIcon" class="ab-hero-icon">\ud83c\udfc5</div>' +
                            '<div>' +
                                '<div id="abSaTitle" class="ab-hero-title">Achievement Profile</div>' +
                                '<div id="abSaRankLabel" class="ab-hero-sub" style="font-size:1em; font-weight:600;">Rookie</div>' +
                                '<div id="abSaSub" class="ab-hero-sub" style="font-size:0.85em; opacity:0.8;">Loading...</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="margin-top:0.75em;">' +
                            '<div id="abSaRankBarText" class="ab-eyebrow" style="display:flex; justify-content:space-between;"><span>Rank progress</span><span id="abSaRankBarPct">0%</span></div>' +
                            '<div style="height:6px; border-radius:3px; background:rgba(255,255,255,0.12); overflow:hidden; margin-top:4px;">' +
                                '<div id="abSaRankBarFill" style="height:100%; width:0%; background:#667eea; transition:width 0.4s;"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="margin-top:1em;"><div class="ab-eyebrow">Showcase</div><div id="abSaShowcase" class="ab-showcase"><div class="ab-muted">Equip badges to build your showcase.</div></div></div>' +
                        '<div style="margin-top:1em;"><a id="abSaProfileCardLink" href="#" target="_blank" class="ab-muted" style="font-size:0.85em; text-decoration:underline;">Open shareable profile card</a></div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaError" style="display:none;" class="ab-error"></div>' +
                '<div class="ab-stats">' +
                    '<div class="ab-stat"><div class="ab-stat-t">Unlocked</div><div id="abSaUnlocked" class="ab-stat-v">0</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t">Total</div><div id="abSaTotal" class="ab-stat-v">0</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t">Completion</div><div id="abSaPct" class="ab-stat-v">0%</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t">Score</div><div id="abSaScore" class="ab-stat-v">0</div></div>' +
                '</div>' +
                '<div class="ab-tabs">' +
                    '<button type="button" class="ab-tab active" id="abSaTabBadges">My Badges</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabQuests">Quests</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabRecap">Recap</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabLb">Leaderboard</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabStats">Stats</button>' +
                '</div>' +
                '<div id="abSaPanelBadges" class="ab-panel">' +
                    '<div class="ab-filter-row" style="display:flex; gap:0.75em; flex-wrap:wrap; margin-bottom:1em; align-items:center;">' +
                        '<input type="search" id="abSaSearch" placeholder="Search badges by title, category, rarity..." class="ab-input" style="flex:1; min-width:240px;">' +
                        '<select id="abSaFilter" class="ab-select">' +
                            '<option value="all">All badges</option>' +
                            '<option value="unlocked">Unlocked only</option>' +
                            '<option value="locked">Locked only</option>' +
                            '<option value="close">Close to unlock (&gt;50%)</option>' +
                            '<option value="r-common">Rarity: Common</option>' +
                            '<option value="r-uncommon">Rarity: Uncommon</option>' +
                            '<option value="r-rare">Rarity: Rare</option>' +
                            '<option value="r-epic">Rarity: Epic</option>' +
                            '<option value="r-legendary">Rarity: Legendary</option>' +
                            '<option value="r-mythic">Rarity: Mythic</option>' +
                        '</select>' +
                        '<select id="abSaSort" class="ab-select" title="Sort order">' +
                            '<option value="default">Default</option>' +
                            '<option value="rarity-desc">Sort: Rarity (highest)</option>' +
                            '<option value="rarity-asc">Sort: Rarity (lowest)</option>' +
                            '<option value="progress-desc">Sort: Progress (most)</option>' +
                            '<option value="progress-asc">Sort: Progress (least)</option>' +
                            '<option value="title-asc">Sort: Title A-Z</option>' +
                        '</select>' +
                    '</div>' +
                    '<h3 style="margin:0 0 0.75em;">Equipped badges</h3>' +
                    '<div id="abSaEquippedEmpty" class="ab-muted" style="padding:0.8em;border:1px dashed rgba(255,255,255,0.16);border-radius:12px;">No equipped badges yet.</div>' +
                    '<div id="abSaEquipped" class="ab-grid"></div>' +
                    '<div id="abSaGrid" class="ab-grid" style="margin-top:1.5em;"></div>' +
                    '<div id="abSaEmptyFilter" class="ab-muted" style="display:none; margin-top:1em;">No badges match your filter.</div>' +
                '</div>' +
                '<div id="abSaPanelQuests" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<h3 style="margin:0 0 0.5em;">Daily quest</h3>' +
                        '<div class="ab-muted" style="font-size:0.85em; margin-bottom:0.75em;">Resets at midnight. Everyone shares the same daily challenge.</div>' +
                        '<div id="abSaDailyQuest">Loading...</div>' +
                        '<h3 style="margin:1.5em 0 0.5em;">Weekly quest</h3>' +
                        '<div class="ab-muted" style="font-size:0.85em; margin-bottom:0.75em;">Resets every Monday. Bigger reward, harder target.</div>' +
                        '<div id="abSaWeeklyQuest">Loading...</div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelRecap" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<div style="display:flex; gap:0.5em; margin-bottom:1em;">' +
                            '<button type="button" class="ab-btn" data-period="week">This week</button>' +
                            '<button type="button" class="ab-btn" data-period="month">This month</button>' +
                            '<button type="button" class="ab-btn" data-period="year">This year</button>' +
                        '</div>' +
                        '<div id="abSaRecap">Loading recap...</div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelLb" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<div class="ab-tabs" style="margin-bottom:1em;">' +
                            '<button type="button" class="ab-tab active" data-lb="score">Score</button>' +
                            '<button type="button" class="ab-tab" data-lb="movies">Movies</button>' +
                            '<button type="button" class="ab-tab" data-lb="episodes">Episodes</button>' +
                            '<button type="button" class="ab-tab" data-lb="hours">Hours</button>' +
                            '<button type="button" class="ab-tab" data-lb="streak">Best Streak</button>' +
                            '<button type="button" class="ab-tab" data-lb="series">Series</button>' +
                        '</div>' +
                        '<div id="abSaLb">Loading...</div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelStats" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<h3 style="margin:0 0 0.75em;">Your data</h3>' +
                        '<div id="abSaCharts" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1em;"></div>' +
                        '<h3 style="margin:1.5em 0 0.75em;">Score bank & prestige</h3>' +
                        '<div id="abSaBank">Loading...</div>' +
                        '<h3 style="margin:1.5em 0 0.75em;">Server stats</h3>' +
                        '<div id="abSaServerStats">Loading...</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        return r;
    }

    function showError(msg) {
        var e = el('abSaError');
        if (e) { e.textContent = msg; e.style.display = 'block'; }
    }

    function setTab(name) {
        var panels = { badges: 'abSaPanelBadges', quests: 'abSaPanelQuests', recap: 'abSaPanelRecap', lb: 'abSaPanelLb', stats: 'abSaPanelStats' };
        var tabs = { badges: 'abSaTabBadges', quests: 'abSaTabQuests', recap: 'abSaTabRecap', lb: 'abSaTabLb', stats: 'abSaTabStats' };
        for (var k in panels) {
            var p = el(panels[k]); if (p) p.style.display = k === name ? 'block' : 'none';
            var t = el(tabs[k]); if (t) t.classList.toggle('active', k === name);
        }
        if (name === 'recap') { loadRecap('week'); }
        if (name === 'stats') { loadStats(); }
        if (name === 'quests') { loadQuests(); }
    }

    function renderQuestCards(list, containerId) {
        var box = el(containerId);
        if (!box) return;
        if (!list || !list.length) { box.innerHTML = '<div class="ab-muted">No quests available.</div>'; return; }

        box.innerHTML = list.map(function (q) {
            var pct = q.Target ? Math.round(100 * (q.Current || 0) / q.Target) : 0;
            var borderColor = q.Completed ? '#4caf50' : 'rgba(255,255,255,0.1)';
            var glow = q.Completed ? 'box-shadow:0 0 20px rgba(76,175,80,0.15);' : '';
            return '<div style="padding:0.95em 1.1em; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid ' + borderColor + ';' + glow + ' margin-bottom:0.75em;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; gap:0.5em;">' +
                    '<div style="font-weight:700; font-size:1.05em;">' + escapeHtml(q.Title) + (q.Completed ? ' \u2713' : '') + '</div>' +
                    '<div style="font-size:0.78em; padding:0.25em 0.6em; border-radius:999px; background:rgba(102,126,234,0.2); color:#a3b5f7; font-weight:600;">+' + (q.Reward || 0) + ' pts</div>' +
                '</div>' +
                '<div class="ab-muted" style="font-size:0.88em; margin-top:0.3em;">' + escapeHtml(q.Description || '') + '</div>' +
                '<div style="height:8px; border-radius:4px; background:rgba(255,255,255,0.08); margin-top:0.85em; overflow:hidden;">' +
                    '<div style="height:100%; width:' + pct + '%; background:' + (q.Completed ? 'linear-gradient(90deg,#66bb6a,#4caf50)' : 'linear-gradient(90deg,#667eea,#764ba2)') + '; transition:width 0.4s;"></div>' +
                '</div>' +
                '<div class="ab-muted" style="font-size:0.78em; margin-top:0.35em; text-align:right;">' + (q.Current || 0) + ' / ' + (q.Target || 0) + '</div>' +
            '</div>';
        }).join('');
    }

    function loadQuests() {
        if (!userId) return;
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/quests').then(function (res) {
            renderQuestCards(res && res.Daily, 'abSaDailyQuest');
            renderQuestCards(res && res.Weekly, 'abSaWeeklyQuest');
        }).catch(function () {
            var d = el('abSaDailyQuest'); if (d) d.innerHTML = '<div class="ab-muted">Failed to load quests.</div>';
        });
    }

    function applyThemeForTier(tierName) {
        if (!root) return;
        var themeClass = 'ab-theme-' + (tierName || 'rookie').toLowerCase();
        var classes = root.className.split(/\s+/).filter(function (c) { return c.indexOf('ab-theme-') !== 0; });
        classes.push(themeClass);
        root.className = classes.join(' ');
    }

    var allBadges = [];
    var equippedIdsGlobal = {};
    var currentSearch = '';
    var currentFilter = 'all';
    var currentSort = 'default';
    var currentPrestige = 0;

    var rarityRank = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5, 'mythic': 6 };
    var rarityScore = { 'common': 10, 'uncommon': 20, 'rare': 35, 'epic': 60, 'legendary': 100, 'mythic': 150 };

    function scoreForBadge(b) {
        var base = rarityScore[(b.Rarity || '').toLowerCase()] || 10;
        var multiplier = 1 + 0.5 * (currentPrestige || 0);
        return Math.round(base * multiplier);
    }

    function passesFilter(b) {
        var q = currentSearch.toLowerCase();
        if (q) {
            var hay = [(b.Title || ''), (b.Category || ''), (b.Rarity || ''), (b.Description || '')].join(' ').toLowerCase();
            if (hay.indexOf(q) === -1) return false;
        }
        if (currentFilter === 'unlocked') return !!b.Unlocked;
        if (currentFilter === 'locked') return !b.Unlocked;
        if (currentFilter === 'close') {
            if (b.Unlocked) return false;
            var tar = b.TargetValue || 0, cur = b.CurrentValue || 0;
            return tar > 0 && (cur / tar) > 0.5;
        }
        if (currentFilter.indexOf('r-') === 0) {
            var want = currentFilter.substring(2);
            return (b.Rarity || '').toLowerCase() === want;
        }
        return true;
    }

    function applySort(arr) {
        var copy = arr.slice();
        switch (currentSort) {
            case 'rarity-desc':
                copy.sort(function (a, b) { return (rarityRank[(b.Rarity || '').toLowerCase()] || 0) - (rarityRank[(a.Rarity || '').toLowerCase()] || 0); });
                break;
            case 'rarity-asc':
                copy.sort(function (a, b) { return (rarityRank[(a.Rarity || '').toLowerCase()] || 0) - (rarityRank[(b.Rarity || '').toLowerCase()] || 0); });
                break;
            case 'progress-desc':
                copy.sort(function (a, b) {
                    var pa = (a.TargetValue || 0) > 0 ? (a.CurrentValue || 0) / a.TargetValue : 0;
                    var pb = (b.TargetValue || 0) > 0 ? (b.CurrentValue || 0) / b.TargetValue : 0;
                    return pb - pa;
                });
                break;
            case 'progress-asc':
                copy.sort(function (a, b) {
                    var pa = (a.TargetValue || 0) > 0 ? (a.CurrentValue || 0) / a.TargetValue : 0;
                    var pb = (b.TargetValue || 0) > 0 ? (b.CurrentValue || 0) / b.TargetValue : 0;
                    return pa - pb;
                });
                break;
            case 'title-asc':
                copy.sort(function (a, b) { return (a.Title || '').localeCompare(b.Title || ''); });
                break;
        }
        return copy;
    }

    function applyFilter() {
        var filtered = allBadges.filter(passesFilter);
        var sorted = applySort(filtered);
        renderBadges(sorted, equippedIdsGlobal);
        var empty = el('abSaEmptyFilter');
        if (empty) empty.style.display = (sorted.length === 0 && allBadges.length > 0) ? 'block' : 'none';
    }

    function loadRecap(period) {
        if (!userId) return;
        var box = el('abSaRecap'); if (box) box.innerHTML = 'Loading recap...';
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/recap?period=' + period).then(function (r) {
            if (!box) return;
            var topList = function (items, title) {
                if (!items || !items.length) return '';
                return '<div style="margin-top:1em;"><div class="ab-eyebrow">' + title + '</div><ul style="margin:0.3em 0 0; padding-left:1.2em;">' +
                    items.map(function (x) { return '<li>' + x.Name + ' \u2014 ' + x.Count + '</li>'; }).join('') + '</ul></div>';
            };
            box.innerHTML =
                '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.75em;">' +
                    '<div class="ab-stat"><div class="ab-stat-t">Items</div><div class="ab-stat-v">' + (r.TotalItems || 0) + '</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t">Movies</div><div class="ab-stat-v">' + (r.MoviesWatched || 0) + '</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t">Episodes</div><div class="ab-stat-v">' + (r.EpisodesWatched || 0) + '</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t">Days active</div><div class="ab-stat-v">' + (r.DaysWatched || 0) + '</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t">Unlocks</div><div class="ab-stat-v">' + (r.BadgesUnlocked || 0) + '</div></div>' +
                '</div>' +
                topList(r.TopGenres, 'Top genres') +
                topList(r.TopDirectors, 'Top directors') +
                topList(r.TopActors, 'Top actors');
        }).catch(function () {
            if (box) box.innerHTML = '<div class="ab-muted">Failed to load recap.</div>';
        });
    }

    var currentHeatmapDays = 90;

    function loadStats() {
        if (!userId) return;
        Promise.all([
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/bank'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/summary'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/recap?period=year'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/watch-calendar?days=' + currentHeatmapDays)
        ]).then(function (r) {
            var bank = r[0], summary = r[1], recap = r[2], calendar = r[3];
            var bankBox = el('abSaBank');
            if (bankBox) {
                var prestigeStars = '';
                for (var i = 0; i < (bank.PrestigeLevel || 0); i++) { prestigeStars += '\u2b50'; }
                currentPrestige = bank.PrestigeLevel || 0;
                var canPrestige = (summary && summary.Score >= 12000);
                var nextMultiplier = 1 + 0.5 * ((bank.PrestigeLevel || 0) + 1);
                bankBox.innerHTML =
                    '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.75em;">' +
                        '<div class="ab-stat"><div class="ab-stat-t">Score bank</div><div class="ab-stat-v">' + (bank.ScoreBank || 0) + '</div></div>' +
                        '<div class="ab-stat"><div class="ab-stat-t">Lifetime score</div><div class="ab-stat-v">' + (bank.LifetimeScore || 0) + '</div></div>' +
                        '<div class="ab-stat"><div class="ab-stat-t">Prestige</div><div class="ab-stat-v">' + (bank.PrestigeLevel || 0) + ' ' + prestigeStars + '</div></div>' +
                        '<div class="ab-stat"><div class="ab-stat-t">Best combo</div><div class="ab-stat-v">' + (bank.BestComboCount || 0) + '</div></div>' +
                    '</div>' +
                    '<div style="margin-top:1.25em; text-align:center;">' +
                        '<button type="button" class="ab-prestige-btn" id="abSaPrestigeBtn"' + (canPrestige ? '' : ' disabled') + '>' +
                            '\u2b50 Prestige \u2b50' +
                        '</button>' +
                        '<div class="ab-muted" style="font-size:0.8em; margin-top:0.5em;">' +
                            (canPrestige
                                ? 'Reset to earn prestige \u2b50 ' + ((bank.PrestigeLevel || 0) + 1) + ' and unlock a ' + nextMultiplier.toFixed(1) + 'x badge score multiplier'
                                : 'Reach 12000 score (Legend rank) to prestige. Currently ' + (summary.Score || 0) + ' / 12000') +
                        '</div>' +
                    '</div>';
                var pb = el('abSaPrestigeBtn');
                if (pb) pb.addEventListener('click', function () {
                    if (!confirm('Prestige resets your badges and counters but grants a permanent score multiplier and a prestige star. Continue?')) return;
                    fetchJson('Plugins/AchievementBadges/users/' + userId + '/prestige', 'POST').then(function (res) {
                        alert(res.Success ? ('Prestige level ' + res.PrestigeLevel + '! Badge rewards now scale ' + (1 + 0.5 * res.PrestigeLevel).toFixed(1) + 'x.') : res.Message);
                        loadAll(); loadStats();
                    });
                });
            }

            renderCharts(recap, summary, calendar);
        }).catch(function () { });
    }

    function renderCharts(recap, summary, calendar) {
        var box = el('abSaCharts'); if (!box) return;

        // Genre radar (SVG)
        var genres = (recap && recap.TopGenres) || [];
        var radarSvg = '';
        if (genres.length >= 3) {
            var max = Math.max.apply(null, genres.map(function (g) { return g.Count; }));
            var cx = 120, cy = 120, r = 90;
            var points = genres.map(function (g, i) {
                var angle = (Math.PI * 2 * i / genres.length) - Math.PI / 2;
                var pr = r * (g.Count / max);
                return (cx + Math.cos(angle) * pr) + ',' + (cy + Math.sin(angle) * pr);
            }).join(' ');
            var gridCircles = [0.33, 0.66, 1].map(function (s) {
                return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * s) + '" fill="none" stroke="rgba(255,255,255,0.1)" />';
            }).join('');
            var labels = genres.map(function (g, i) {
                var angle = (Math.PI * 2 * i / genres.length) - Math.PI / 2;
                var lx = cx + Math.cos(angle) * (r + 15);
                var ly = cy + Math.sin(angle) * (r + 15) + 4;
                return '<text x="' + lx + '" y="' + ly + '" fill="#ccc" font-size="11" text-anchor="middle">' + escapeHtml(g.Name) + '</text>';
            }).join('');
            radarSvg = '<svg viewBox="0 0 240 240" width="100%" height="240">' +
                gridCircles +
                '<polygon points="' + points + '" fill="rgba(102,126,234,0.35)" stroke="#667eea" stroke-width="2"/>' +
                labels +
                '</svg>';
        } else {
            radarSvg = '<div class="ab-muted">Not enough genre data yet.</div>';
        }

        // Watch heatmap (last 90 days)
        var heatSvg = renderHeatmap(calendar);

        // Duration histogram
        var histSvg = renderHistogram(summary);

        var heatHeader =
            '<div style="display:flex; justify-content:space-between; align-items:center; margin:0 0 0.5em;">' +
                '<h4 style="margin:0;">Watch heatmap</h4>' +
                '<select id="abSaHeatmapRange" class="ab-select" style="padding:0.3em 0.6em; font-size:0.8em;">' +
                    '<option value="30"' + (currentHeatmapDays === 30 ? ' selected' : '') + '>30 days</option>' +
                    '<option value="90"' + (currentHeatmapDays === 90 ? ' selected' : '') + '>90 days</option>' +
                    '<option value="180"' + (currentHeatmapDays === 180 ? ' selected' : '') + '>180 days</option>' +
                    '<option value="365"' + (currentHeatmapDays === 365 ? ' selected' : '') + '>1 year</option>' +
                '</select>' +
            '</div>';

        box.innerHTML =
            '<div class="ab-panel-card"><h4 style="margin:0 0 0.5em;">Genre radar</h4>' + radarSvg + '</div>' +
            '<div class="ab-panel-card" style="grid-column:span 2; min-width:0;">' + heatHeader + heatSvg + '</div>' +
            '<div class="ab-panel-card"><h4 style="margin:0 0 0.5em;">Stats snapshot</h4>' + histSvg + '</div>';

        var rangeEl = document.getElementById('abSaHeatmapRange');
        if (rangeEl) rangeEl.addEventListener('change', function () {
            currentHeatmapDays = parseInt(rangeEl.value, 10) || 90;
            loadStats();
        });
    }

    function renderHeatmap(calendar) {
        var counts = (calendar && calendar.Counts) || {};
        var days = (calendar && calendar.Days) || currentHeatmapDays || 90;
        var max = 0;
        for (var k in counts) { if (counts[k] > max) max = counts[k]; }
        if (max === 0) max = 1;

        var today = new Date();
        var cells = [];
        for (var i = days - 1; i >= 0; i--) {
            var d = new Date(today); d.setDate(today.getDate() - i);
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            cells.push({ date: d, key: key, count: counts[key] || 0 });
        }

        function colorFor(count) {
            if (count === 0) return 'rgba(255,255,255,0.05)';
            var intensity = Math.min(1, 0.15 + (count / max) * 0.85);
            return 'rgba(102, 126, 234, ' + intensity.toFixed(2) + ')';
        }

        // Cell size scales with total days so that larger ranges still fit
        var cellSize = days <= 30 ? 18 : days <= 90 ? 14 : days <= 180 ? 10 : 8;
        var gap = 2;
        var step = cellSize + gap;

        var svgCells = cells.map(function (c, i) {
            var col = Math.floor(i / 7);
            var row = i % 7;
            var tooltip = c.key + ' · ' + c.count + ' item' + (c.count === 1 ? '' : 's');
            return '<rect x="' + (col * step) + '" y="' + (row * step) + '" width="' + cellSize + '" height="' + cellSize + '" rx="2" fill="' + colorFor(c.count) + '"><title>' + tooltip + '</title></rect>';
        }).join('');

        var cols = Math.ceil(days / 7);
        var width = cols * step;
        var height = 7 * step;
        return '<svg viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="' + height + '" preserveAspectRatio="xMidYMid meet">' + svgCells + '</svg>' +
            '<div class="ab-muted" style="font-size:0.75em; margin-top:0.3em;">Last ' + days + ' days · hover for details · max ' + max + ' items/day</div>';
    }

    function renderHistogram(summary) {
        if (!summary) return '<div class="ab-muted">No data.</div>';
        var items = [
            { label: 'Unlocked', value: summary.Unlocked || 0, max: summary.Total || 1, color: '#4caf50' },
            { label: 'Score', value: summary.Score || 0, max: Math.max(5000, summary.Score || 0), color: '#667eea' },
            { label: 'Best streak', value: summary.BestWatchStreak || 0, max: Math.max(30, summary.BestWatchStreak || 0), color: '#ff9800' }
        ];
        return items.map(function (it) {
            var pct = Math.round(100 * it.value / (it.max || 1));
            return '<div style="margin:0.5em 0;">' +
                '<div style="display:flex; justify-content:space-between; font-size:0.85em;"><span>' + it.label + '</span><span>' + it.value + '</span></div>' +
                '<div style="height:6px; border-radius:3px; background:rgba(255,255,255,0.1); overflow:hidden;"><div style="height:100%; width:' + pct + '%; background:' + it.color + ';"></div></div>' +
                '</div>';
        }).join('');
    }

    function escapeHtml(s) { var d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }

    function loadCategoryLb(cat) {
        fetchJson('Plugins/AchievementBadges/leaderboard/' + cat + '?limit=10').then(function (lb) {
            var box = el('abSaLb'); if (!box) return;
            if (!lb || !lb.length) { box.innerHTML = '<div class="ab-muted">No data yet.</div>'; return; }
            box.innerHTML = lb.map(function (e, i) {
                return '<div class="ab-lb-row"><div><strong>#' + (i + 1) + '</strong> \u2022 ' + (e.UserName || e.UserId) + '</div><div>' + (e.Value || 0) + '</div></div>';
            }).join('');
        });
    }

    function renderShowcase(badges) {
        var sc = el('abSaShowcase'); if (!sc) return;
        sc.innerHTML = '';
        if (!badges || !badges.length) { sc.innerHTML = '<div class="ab-muted">Equip badges to build your showcase.</div>'; return; }
        badges.forEach(function (b) {
            var c = document.createElement('div'); c.className = 'ab-sc-card';
            c.innerHTML = '<div class="ab-sc-icon">' + icon(b.Icon) + '</div><div><div style="font-weight:700;">' + b.Title + '</div><div class="' + rarityClass(b.Rarity) + '" style="font-size:0.88em;">' + b.Rarity + '</div></div>';
            sc.appendChild(c);
        });
    }

    function renderEquipped(badges) {
        var row = el('abSaEquipped'), empty = el('abSaEquippedEmpty'); if (!row) return;
        row.innerHTML = '';
        if (!badges || !badges.length) { if (empty) empty.style.display = 'block'; return; }
        if (empty) empty.style.display = 'none';
        badges.forEach(function (b) {
            var c = document.createElement('div'); c.className = 'ab-card'; c.setAttribute('data-badge-id', b.Id);
            c.innerHTML = '<div class="ab-card-h"><div class="ab-card-icon">' + icon(b.Icon) + '</div><div style="flex:1;"><div class="ab-card-title">' + b.Title + '</div><div class="ab-card-meta ' + rarityClass(b.Rarity) + '">' + b.Rarity + '</div></div></div>' +
                '<div class="ab-footer"><div class="ab-unlocked">Equipped</div><button type="button" class="ab-btn">Unequip</button></div>';
            c.querySelector('button').addEventListener('click', function () { doUnequip(b.Id); });
            row.appendChild(c);
        });
    }

    function renderBadges(badges, equippedIds) {
        var grid = el('abSaGrid'); if (!grid) return;
        grid.innerHTML = '';
        if (!badges || !badges.length) return;
        badges.forEach(function (b) {
            var cur = b.CurrentValue || 0, tar = b.TargetValue || 0;
            var pct = tar > 0 ? Math.min(cur / tar * 100, 100) : 0;
            var eq = equippedIds && equippedIds[b.Id];
            var c = document.createElement('div'); c.className = 'ab-card';
            var pts = scoreForBadge(b);
            c.innerHTML = '<div class="ab-card-h"><div class="ab-card-icon">' + icon(b.Icon) + '</div><div style="flex:1;"><div class="ab-card-title">' + b.Title + '</div><div class="ab-card-meta ' + rarityClass(b.Rarity) + '">' + b.Rarity + ' \u2022 ' + b.Category + '</div></div><div class="ab-badge-pts" title="Points awarded on unlock' + (currentPrestige > 0 ? ' (prestige bonus applied)' : '') + '">+' + pts + ' pts</div></div>' +
                '<div class="ab-desc">' + b.Description + '</div>' +
                '<div class="ab-prog-text"><span>Progress</span><span>' + cur + '/' + tar + '</span></div>' +
                '<div class="ab-prog-bar"><div class="ab-prog-fill" style="width:' + pct + '%;"></div></div>' +
                '<div class="ab-footer"><div class="' + (b.Unlocked ? 'ab-unlocked' : 'ab-locked') + '">' + (b.Unlocked ? 'Unlocked' : 'Locked') + '</div>' +
                '<button type="button" class="ab-btn"' + (!b.Unlocked ? ' disabled style="opacity:0.5;"' : '') + '>' + (eq ? 'Unequip' : 'Equip') + '</button></div>';
            if (b.Unlocked) {
                c.querySelector('.ab-footer button').addEventListener('click', function () {
                    if (eq) doUnequip(b.Id); else doEquip(b.Id);
                });
            }
            grid.appendChild(c);
        });
    }

    function loadAll() {
        if (!userId) { showError('Could not detect user.'); return Promise.resolve(); }
        var eqIds = {};
        // fire login ping (safe even if it fails)
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/login-ping', 'POST').catch(function () {});

        return Promise.all([
            fetchJson('Plugins/AchievementBadges/users/' + userId),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/summary'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/equipped'),
            fetchJson('Plugins/AchievementBadges/leaderboard?limit=10'),
            fetchJson('Plugins/AchievementBadges/server/stats'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/rank')
        ]).then(function (results) {
            var badges = results[0], summary = results[1], equipped = results[2], lb = results[3], stats = results[4], rank = results[5];

            var sub = el('abSaSub');
            if (sub) sub.textContent = 'Completion: ' + ((summary && summary.Percentage != null) ? summary.Percentage : 0) + '% \u2022 Score: ' + (summary ? (summary.Score || 0) : 0);
            var u = el('abSaUnlocked'); if (u) u.textContent = summary ? summary.Unlocked : 0;
            var t = el('abSaTotal'); if (t) t.textContent = summary ? summary.Total : 0;
            var p = el('abSaPct'); if (p) p.textContent = (summary && typeof summary.Percentage === 'number' ? summary.Percentage.toFixed(1) : '0') + '%';
            var sc = el('abSaScore'); if (sc) sc.textContent = summary ? (summary.Score || 0) : 0;

            if (rank && rank.Tier) {
                applyThemeForTier(rank.Tier.Name);
                var lbl = el('abSaRankLabel');
                if (lbl) { lbl.textContent = rank.Tier.Name; lbl.style.color = rank.Tier.Color || ''; }
                var fill = el('abSaRankBarFill');
                if (fill) {
                    fill.style.width = (rank.ProgressToNext || 0) + '%';
                    fill.style.background = (rank.Tier.Color || '#667eea');
                }
                var pct = el('abSaRankBarPct');
                if (pct) {
                    if (rank.NextTier) {
                        pct.textContent = rank.Score + ' / ' + rank.NextTier.MinScore + ' to ' + rank.NextTier.Name;
                    } else {
                        pct.textContent = 'Max rank';
                    }
                }
            }

            var cardLink = el('abSaProfileCardLink');
            if (cardLink) cardLink.href = buildUrl('Plugins/AchievementBadges/users/' + userId + '/profile-card');

            allBadges = badges || [];
            renderShowcase(equipped);
            renderEquipped(equipped);
            if (equipped) equipped.forEach(function (b) { eqIds[b.Id] = true; });
            equippedIdsGlobal = eqIds;
            applyFilter();

            var lbBox = el('abSaLb');
            if (lbBox) {
                if (!lb || !lb.length) { lbBox.innerHTML = '<div class="ab-muted">No data yet.</div>'; }
                else {
                    lbBox.innerHTML = lb.map(function (e, i) {
                        return '<div class="ab-lb-row"><div><strong>#' + (i + 1) + '</strong> \u2022 ' + (e.UserName || e.UserId) + '</div><div>' + (e.Score || 0) + ' pts \u2022 ' + e.Unlocked + ' unlocked</div></div>';
                    }).join('');
                }
            }

            var stBox = el('abSaServerStats');
            if (stBox && stats) {
                stBox.innerHTML = '<div>Total users: ' + (stats.TotalUsers || 0) + '</div>' +
                    '<div style="margin-top:0.4em;">Badges unlocked: ' + (stats.TotalBadgesUnlocked || 0) + '</div>' +
                    '<div style="margin-top:0.4em;">Items watched: ' + (stats.TotalItemsWatched || 0) + '</div>' +
                    '<div style="margin-top:0.4em;">Movies watched: ' + (stats.TotalMoviesWatched || 0) + '</div>' +
                    '<div style="margin-top:0.4em;">Series completed: ' + (stats.TotalSeriesCompleted || 0) + '</div>' +
                    '<div style="margin-top:0.4em;">Most common badge: ' + (stats.MostCommonBadge || 'None') + '</div>';
            }
        }).catch(function (err) {
            showError('Failed to load achievements. ' + (err && err.message ? err.message : String(err)));
        });
    }

    function doEquip(badgeId) {
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/equipped/' + badgeId, 'POST').then(function () { return loadAll(); }).catch(function (e) { showError('Failed to equip. ' + e.message); });
    }

    function doUnequip(badgeId) {
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/equipped/' + badgeId, 'DELETE').then(function () { return loadAll(); }).catch(function (e) { showError('Failed to unequip. ' + e.message); });
    }

    function mountRoute() {
        injectStyles();
        root = document.getElementById(ROOT_ID);
        if (!root) {
            root = createRoot();
            document.body.appendChild(root);
        } else {
            root = createRoot();
        }
        root.style.display = 'block';

        el('abSaTabBadges').addEventListener('click', function () { setTab('badges'); });
        el('abSaTabQuests').addEventListener('click', function () { setTab('quests'); });
        el('abSaTabRecap').addEventListener('click', function () { setTab('recap'); });
        el('abSaTabLb').addEventListener('click', function () { setTab('lb'); });
        el('abSaTabStats').addEventListener('click', function () { setTab('stats'); loadStats(); });
        setTab('badges');

        var search = el('abSaSearch');
        if (search) search.addEventListener('input', function () {
            currentSearch = search.value || '';
            applyFilter();
        });
        var filter = el('abSaFilter');
        if (filter) filter.addEventListener('change', function () {
            currentFilter = filter.value || 'all';
            applyFilter();
        });
        var sortEl = el('abSaSort');
        if (sortEl) sortEl.addEventListener('change', function () {
            currentSort = sortEl.value || 'default';
            applyFilter();
        });

        var recapBtns = root.querySelectorAll('#abSaPanelRecap button[data-period]');
        recapBtns.forEach(function (btn) {
            btn.addEventListener('click', function () { loadRecap(btn.getAttribute('data-period')); });
        });

        var lbBtns = root.querySelectorAll('#abSaPanelLb button[data-lb]');
        lbBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                lbBtns.forEach(function (x) { x.classList.remove('active'); });
                btn.classList.add('active');
                loadCategoryLb(btn.getAttribute('data-lb'));
            });
        });

        getCurrentUserId().then(function (id) {
            userId = id;
            if (!id) { showError('Could not detect your user account. Please log in.'); return; }
            return loadAll();
        });
    }

    function unmountRoute() {
        var r = document.getElementById(ROOT_ID);
        if (r) r.style.display = 'none';
    }

    function isAchievementsRoute() {
        var hash = window.location.hash || '';
        return hash.indexOf(ROUTE_MATCH) !== -1;
    }

    function onRouteChange() {
        if (isAchievementsRoute()) {
            mountRoute();
        } else {
            unmountRoute();
        }
    }

    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onRouteChange);
    } else {
        onRouteChange();
    }
})();
