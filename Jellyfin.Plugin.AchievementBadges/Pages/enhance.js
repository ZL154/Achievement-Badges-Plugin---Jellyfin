(function () {
    if (window.__abEnhanceLoaded) return;
    window.__abEnhanceLoaded = true;

    var TOAST_ID = 'ab-toast-container';
    var HOME_ID = 'ab-home-widget';
    var DETAIL_ID = 'ab-detail-ribbon';
    var LAST_SEEN_KEY = 'ab-last-unlock-seen';
    var SHOWN_IDS_KEY = 'ab-shown-unlock-ids';
    var REDUCED_MOTION_KEY = 'ab-reduced-motion';
    var MAX_VISIBLE_TOASTS = 3;
    var toastQueue = [];
    var visibleToastCount = 0;
    var features = { EnableUnlockToasts: true, EnableHomeWidget: false, EnableItemDetailRibbon: false };

    function isReducedMotion() {
        try {
            if (localStorage.getItem(REDUCED_MOTION_KEY) === 'true') return true;
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (e) { return false; }
    }

    function getShownIds() {
        try {
            var raw = sessionStorage.getItem(SHOWN_IDS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }
    function markShown(id) {
        try {
            var map = getShownIds();
            map[id] = Date.now();
            sessionStorage.setItem(SHOWN_IDS_KEY, JSON.stringify(map));
        } catch (e) {}
    }

    function getApi() { return window.ApiClient || window.apiClient || null; }

    function getUserId() {
        var api = getApi(); if (!api) return '';
        try {
            if (typeof api.getCurrentUserId === 'function') { var id = api.getCurrentUserId(); if (id) return id; }
            if (api._serverInfo && api._serverInfo.UserId) return api._serverInfo.UserId;
        } catch (e) { }
        return '';
    }

    function buildUrl(p) {
        var api = getApi(); var c = p.replace(/^\/+/, '');
        return (api && typeof api.getUrl === 'function') ? api.getUrl(c) : '/' + c;
    }

    function authHeaders() {
        var h = { 'Content-Type': 'application/json' };
        var api = getApi(); if (!api) return h;
        try {
            if (typeof api.accessToken === 'function') { var t = api.accessToken(); if (t) h['X-Emby-Token'] = t; }
            else if (api._serverInfo && api._serverInfo.AccessToken) h['X-Emby-Token'] = api._serverInfo.AccessToken;
        } catch (e) { }
        return h;
    }

    function fetchJson(path) {
        return fetch(buildUrl(path), { headers: authHeaders(), credentials: 'include' })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(r.statusText); });
    }

    function ensureToastContainer() {
        var c = document.getElementById(TOAST_ID);
        if (c) return c;
        c = document.createElement('div');
        c.id = TOAST_ID;
        c.style.cssText = 'position:fixed;bottom:24px;left:0;right:0;z-index:99999;display:flex;flex-direction:column;align-items:center;gap:14px;pointer-events:none;';
        document.body.appendChild(c);
        return c;
    }

    var rarityScorePts = { common: 10, uncommon: 20, rare: 35, epic: 60, legendary: 100, mythic: 150 };

    // Xbox-style shades per rarity: base (solid), lighter (::before pulse + highlight),
    // darker (::after pulse + shadow), bright (color-shifted state while banner is expanded).
    // Mirrors the original codepen where #39960C base shifts to #42ae0e at 24%-85%.
    var rarityShades = {
        common:    { base: '#9fb3c8', lighter: '#c0d1e0', darker: '#6b7d90', bright: '#aec2d3' },
        uncommon:  { base: '#34d399', lighter: '#5ee5b0', darker: '#1d9268', bright: '#3de0a4' },
        rare:      { base: '#60a5fa', lighter: '#8ec3ff', darker: '#2f6cc4', bright: '#72b5ff' },
        epic:      { base: '#a78bfa', lighter: '#c9b4ff', darker: '#6b4ed0', bright: '#b89aff' },
        legendary: { base: '#f5b820', lighter: '#ffd358', darker: '#b88200', bright: '#ffc93d' },
        mythic:    { base: '#dc3d56', lighter: '#ff6b82', darker: '#8b1a2d', bright: '#ef4e68' }
    };

    var rarityColor = {
        common: '#9fb3c8', uncommon: '#34d399', rare: '#60a5fa',
        epic: '#a78bfa', legendary: '#fbbf24', mythic: '#f43f5e'
    };

    function showToast(badge) {
        if (visibleToastCount >= MAX_VISIBLE_TOASTS) {
            toastQueue.push(badge);
            return;
        }
        visibleToastCount++;
        var c = ensureToastContainer();
        var rarity = (badge.Rarity || 'common').toLowerCase();
        var shades = rarityShades[rarity] || rarityShades.common;
        var color = shades.base;
        var isRare = rarity !== 'common' && rarity !== 'uncommon';
        var scorePts = rarityScorePts[rarity] || 10;
        var label = isRare ? ((badge.Rarity || 'Rare') + ' achievement unlocked') : 'Achievement unlocked';
        var styleVars =
            '--ab-color:' + shades.base + ';' +
            '--ab-color-lighter:' + shades.lighter + ';' +
            '--ab-color-darker:' + shades.darker + ';' +
            '--ab-color-bright:' + shades.bright + ';';

        var item = document.createElement('div');
        item.className = 'ab-xb ab-xb-' + rarity;
        item.setAttribute('style', styleVars);
        if (isRare) item.classList.add('ab-xb-rare');
        item.innerHTML =
            '<div class="ab-xb-circle">' +
                '<span class="ab-xb-shimmer"></span>' +
                '<span class="material-icons ab-xb-trophy">emoji_events</span>' +
            '</div>' +
            '<div class="ab-xb-banner">' +
                '<span class="ab-xb-shimmer ab-xb-shimmer-banner"></span>' +
                '<div class="ab-xb-text">' +
                    '<div class="ab-xb-label">' + label + '</div>' +
                    '<div class="ab-xb-row">' +
                        '<span class="ab-xb-score">G ' + scorePts + '</span>' +
                        '<span class="ab-xb-sep"> \u2013 </span>' +
                        '<span class="ab-xb-name">' + escape(badge.Title || '') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        c.appendChild(item);

        // Kick off the animation on the next frame so CSS transitions start cleanly
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                item.classList.add('ab-xb-play');
            });
        });

        if (isRare && !isReducedMotion() && (!userPrefs || userPrefs.EnableConfetti !== false)) {
            setTimeout(function () { fireConfetti(color); }, 400);
        }

        setTimeout(function () {
            item.remove();
            visibleToastCount--;
            if (toastQueue.length > 0 && visibleToastCount < MAX_VISIBLE_TOASTS) {
                var next = toastQueue.shift();
                showToast(next);
            }
        }, 11000);
    }

    function showMilestoneToast(milestone) {
        var c = ensureToastContainer();
        var color = '#ffd700';
        var toast = document.createElement('div');
        toast.style.cssText =
            'pointer-events:auto;min-width:340px;max-width:420px;padding:18px 20px;border-radius:14px;' +
            'background:linear-gradient(135deg,rgba(255,215,0,0.18),rgba(15,18,28,0.97));' +
            'border:2px solid ' + color + ';color:#fff;box-shadow:0 12px 40px rgba(0,0,0,0.7),0 0 60px rgba(255,215,0,0.4);' +
            'font-family:system-ui,sans-serif;animation:abSlideIn 0.4s cubic-bezier(.22,.61,.36,1);';
        toast.innerHTML =
            '<div style="display:flex;align-items:center;gap:14px;">' +
                '<div style="width:50px;height:50px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 0 30px ' + color + 'aa;">🎉</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.8;font-weight:700;color:' + color + ';">MILESTONE REACHED</div>' +
                    '<div style="font-size:18px;font-weight:900;margin-top:2px;">' + milestone + '% complete!</div>' +
                    '<div style="font-size:11px;opacity:0.7;font-weight:600;">You\'ve unlocked ' + milestone + '% of all achievements</div>' +
                '</div>' +
            '</div>';
        c.appendChild(toast);
        if (!isReducedMotion()) {
            fireConfetti(color);
            setTimeout(function () { fireConfetti('#ff6b35'); }, 200);
            setTimeout(function () { fireConfetti('#e91e63'); }, 400);
        }
        setTimeout(function () {
            toast.style.transition = 'opacity 0.5s, transform 0.5s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(30px)';
            setTimeout(function () { toast.remove(); }, 550);
        }, 8000);
    }

    function fireConfetti(accentColor) {
        if (isReducedMotion()) return;
        if (userPrefs && userPrefs.EnableConfetti === false) return;
        try {
            // Anchor the burst to the toast container so particles radiate from
            // the actual toast position (bottom-center), not a screen corner.
            var anchor = document.getElementById(TOAST_ID);
            var originTop, originLeft;
            if (anchor && anchor.getBoundingClientRect) {
                var r = anchor.getBoundingClientRect();
                originTop = r.top + r.height / 2;
                originLeft = r.left + r.width / 2;
            } else {
                originTop = window.innerHeight - 70;
                originLeft = window.innerWidth / 2;
            }

            var container = document.createElement('div');
            container.style.cssText = 'position:fixed;pointer-events:none;top:' + originTop + 'px;left:' + originLeft + 'px;z-index:100000;width:0;height:0;overflow:visible;';
            document.body.appendChild(container);

            var colors = ['#ffd700', '#ff6b35', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', accentColor];
            for (var i = 0; i < 28; i++) {
                var p = document.createElement('div');
                var angle = Math.random() * 360;
                var distance = 60 + Math.random() * 120;
                var dx = Math.cos(angle * Math.PI / 180) * distance;
                var dy = Math.sin(angle * Math.PI / 180) * distance;
                var size = 6 + Math.random() * 6;
                var color = colors[i % colors.length];
                var rot = Math.random() * 360;
                p.style.cssText = 'position:absolute;top:0;left:0;margin-left:' + (-size/2) + 'px;margin-top:' + (-size/2) + 'px;width:' + size + 'px;height:' + size + 'px;' +
                    'background:' + color + ';border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';' +
                    'transform:translate(0,0) rotate(0deg);opacity:1;' +
                    'transition:transform 0.9s cubic-bezier(.22,.61,.36,1),opacity 0.9s;';
                container.appendChild(p);
                (function (el, dx, dy, rot) {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)';
                            el.style.opacity = '0';
                        });
                    });
                })(p, dx, dy, rot);
            }
            setTimeout(function () { container.remove(); }, 1200);
        } catch (e) {}
    }

    function escape(s) { var d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }

    var userPrefs = null;
    var userPrefsFetchedAt = 0;

    function ensureUserPrefs(uid) {
        var now = Date.now();
        if (userPrefs && (now - userPrefsFetchedAt) < 5 * 60 * 1000) return Promise.resolve(userPrefs);
        return fetchJson('Plugins/AchievementBadges/users/' + uid + '/preferences')
            .then(function (p) {
                userPrefs = p || { EnableUnlockToasts: true, EnableMilestoneToasts: true, EnableConfetti: true };
                userPrefsFetchedAt = now;
                return userPrefs;
            })
            .catch(function () {
                userPrefs = { EnableUnlockToasts: true, EnableMilestoneToasts: true, EnableConfetti: true };
                return userPrefs;
            });
    }

    function pollUnlocks() {
        if (!features.EnableUnlockToasts) return;
        var uid = getUserId(); if (!uid) return;
        // On the very first poll of a fresh browser, seed LAST_SEEN to now so we
        // don't replay old unlocks. Subsequent polls use the stored value.
        var stored = localStorage.getItem(LAST_SEEN_KEY);
        if (!stored) {
            var now = new Date().toISOString();
            localStorage.setItem(LAST_SEEN_KEY, now);
            return; // skip the first fetch entirely — there can be nothing new
        }
        var since = stored;
        var shown = getShownIds();

        ensureUserPrefs(uid).then(function (prefs) {
            if (prefs.EnableUnlockToasts === false) return null;
            return fetchJson('Plugins/AchievementBadges/users/' + uid + '/unlocks-since?since=' + encodeURIComponent(since));
        }).then(function (res) {
            if (!res) return null;
            if (res.Badges) {
                res.Badges.forEach(function (b) {
                    var key = b.Id + '|' + (b.UnlockedAt || '');
                    if (!shown[key]) {
                        showToast(b);
                        markShown(key);
                    }
                });
            }
            if (res.Now) { localStorage.setItem(LAST_SEEN_KEY, res.Now); }
            if (userPrefs && userPrefs.EnableMilestoneToasts === false) return null;
            return fetchJson('Plugins/AchievementBadges/users/' + uid + '/check-milestones');
        }).then(function (m) {
            if (m && m.NewlyReached && m.NewlyReached.length) {
                m.NewlyReached.forEach(function (pct, i) {
                    setTimeout(function () { showMilestoneToast(pct); }, i * 1500);
                });
            }
        }).catch(function () { });
    }

    // Home widget removed in v1.5.5 - it was unreliable (flashed then got
    // clobbered by other home-page plugins rebuilding the DOM). Users can
    // get the same info on the standalone achievements page.
    function injectHomeWidget() { /* no-op */ }

    // ---------- Item detail ribbon ----------------------------------

    function injectItemRibbon() {
        if (!features.EnableItemDetailRibbon) return;
        if (document.getElementById(DETAIL_ID)) return;
        if (!/#!?\/details/.test(window.location.hash)) return;

        var anchor = document.querySelector('.detailPagePrimaryContent') || document.querySelector('.itemDetailPage .detailSectionContent');
        if (!anchor) return;

        var uid = getUserId(); if (!uid) return;

        var ribbon = document.createElement('div');
        ribbon.id = DETAIL_ID;
        ribbon.style.cssText = 'margin:0.75em 0;padding:0.75em 1em;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);font-size:0.85em;display:flex;align-items:center;gap:0.75em;';
        ribbon.innerHTML = '<span style="font-size:1.2em;">🏆</span><span id="ab-ribbon-text">Loading achievement progress...</span>';
        anchor.insertBefore(ribbon, anchor.firstChild);

        fetchJson('Plugins/AchievementBadges/users/' + uid + '/summary').then(function (s) {
            var t = document.getElementById('ab-ribbon-text');
            if (t && s) {
                t.textContent = s.Unlocked + ' / ' + s.Total + ' achievements unlocked (' + (s.Percentage || 0) + '%) · Score ' + (s.Score || 0);
            }
        }).catch(function () { });
    }

    // ---------- Bootstrap -------------------------------------------

    function onRouteChange() {
        injectHomeWidget();
        injectItemRibbon();
    }

    // Expose a global test helper so the admin page can preview toasts
    window.abAchievementTestToast = function (rarity) {
        var titles = {
            common: 'Test Common Badge',
            uncommon: 'Test Uncommon Badge',
            rare: 'Test Rare Badge',
            epic: 'Test Epic Badge',
            legendary: 'Test Legendary Badge',
            mythic: 'Test Mythic Badge'
        };
        var key = (rarity || 'common').toLowerCase();
        showToast({
            Id: 'test-' + key,
            Title: titles[key] || 'Test Badge',
            Rarity: key.charAt(0).toUpperCase() + key.slice(1),
            Icon: 'emoji_events',
            UnlockedAt: new Date().toISOString()
        });
    };

    function start() {
        var style = document.createElement('style');
        style.textContent =
            // Hide our injected header/sidebar badges + toasts when the video player is active
            '.videoOsdBottom ~ * #ab-header-badges,' +
            '.videoPlayer #ab-header-badges,' +
            'body.videoPlayerContainerPresent #ab-header-badges,' +
            'body.videoOsdOpen #ab-header-badges,' +
            'body.osd-open #ab-header-badges,' +
            'body:has(.videoPlayerContainer) #ab-header-badges,' +
            'body:has(.videoOsdBottom) #ab-header-badges,' +
            'body:has(.videoPlayer) #ab-header-badges,' +
            'body:has(#videoOsdPage) #ab-header-badges,' +
            'body:has(.mainAnimatedPage.videoOsdPage) #ab-header-badges { display: none !important; }' +
            // Toast container stays visible during playback so unlocks fire mid-watch.
            // Force it above the video OSD layers.
            '#ab-toast-container{z-index:2147483647 !important;}' +

            // ===== Xbox-style achievement toast =====
            '.ab-xb{position:relative;width:355px;height:90px;font-family:"Segoe UI",system-ui,sans-serif;pointer-events:none;}' +
            // Circle: solid base color + radial highlight so it looks spherical (3D), not flat
            '.ab-xb-circle{position:absolute;left:50%;top:7px;margin-left:-37px;width:75px;height:75px;border-radius:50%;' +
                'background-color:var(--ab-color,#39960C);' +
                'background-image:radial-gradient(circle at 34% 30%,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0.08) 30%,rgba(255,255,255,0) 60%),' +
                                 'radial-gradient(circle at 70% 88%,rgba(0,0,0,0.22) 0%,rgba(0,0,0,0) 65%);' +
                'display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.1);z-index:2;' +
                'box-shadow:0 4px 14px rgba(0,0,0,0.4);' +
                'overflow:hidden;}' +
            '.ab-xb-circle::before{content:"";position:absolute;inset:0;border-radius:50%;background:var(--ab-color-lighter,#40a90e);opacity:0;z-index:0;}' +
            '.ab-xb-circle::after{content:"";position:absolute;inset:0;border-radius:50%;background:var(--ab-color-darker,#32830a);opacity:0;z-index:0;}' +
            '.ab-xb-trophy{position:relative;z-index:3;color:#fff;font-size:40px !important;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));}' +
            // Banner: solid base + vertical sheen gradient on top for depth
            '.ab-xb-banner{position:absolute;left:50%;top:7px;margin-left:-37px;width:75px;height:75px;border-radius:100px;' +
                'background-color:var(--ab-color,#39960C);' +
                'background-image:linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 35%,rgba(0,0,0,0) 60%,rgba(0,0,0,0.18) 100%);' +
                'opacity:0;overflow:hidden;z-index:1;' +
                'box-shadow:0 6px 20px rgba(0,0,0,0.45);}' +
            // Shimmer sweep (diagonal white gleam) - lives on both circle + banner, tiers animate it
            '.ab-xb-shimmer{position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;overflow:hidden;z-index:2;}' +
            '.ab-xb-shimmer::after{content:"";position:absolute;top:-50%;left:-60%;width:40%;height:200%;' +
                'background:linear-gradient(115deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 35%,rgba(255,255,255,0.55) 50%,rgba(255,255,255,0) 65%,rgba(255,255,255,0) 100%);' +
                'transform:translateX(0) skewX(-18deg);}' +
            '.ab-xb-shimmer-banner{border-radius:100px;}' +
            '.ab-xb-text{position:absolute;left:95px;top:0;right:20px;height:100%;display:flex;flex-direction:column;justify-content:center;opacity:0;transform:translateY(85px);color:#fff;white-space:nowrap;}' +
            '.ab-xb-label{font-size:13px;font-weight:500;opacity:0.95;line-height:1.3;}' +
            '.ab-xb-row{font-size:15px;font-weight:700;display:flex;align-items:center;gap:4px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.ab-xb-score{font-weight:800;}' +
            '.ab-xb-sep{opacity:0.8;}' +
            '.ab-xb-name{overflow:hidden;text-overflow:ellipsis;}' +
            // Animations
            '.ab-xb-play .ab-xb-circle{animation:abXbCircle 10.5s forwards;}' +
            '.ab-xb-play .ab-xb-circle::before{animation:abXbPulse 10.5s forwards;animation-delay:0s;}' +
            '.ab-xb-play .ab-xb-circle::after{animation:abXbPulse 10.5s forwards;animation-delay:0.1s;}' +
            '.ab-xb-play .ab-xb-trophy{animation:abXbTrophyRotate 6s linear infinite;}' +
            '.ab-xb-play .ab-xb-banner{animation:abXbBanner 10.5s forwards,abXbBannerFill 10.5s forwards;}' +
            '.ab-xb-play .ab-xb-text{animation:abXbText 10.5s forwards;}' +
            // Shimmer: sweeps across the banner + circle while banner is expanded
            '.ab-xb-play .ab-xb-shimmer{animation:abXbShimmerOpacity 10.5s forwards;}' +
            '.ab-xb-play .ab-xb-shimmer::after{animation:abXbShimmerSweep 10.5s forwards;}' +
            // Subtle colored halo for rare+ (NOT a neon blast). Layers drop shadow + small colored ring.
            '.ab-xb-rare .ab-xb-banner{box-shadow:0 6px 20px rgba(0,0,0,0.45),0 0 16px rgba(96,165,250,0.30);}' +
            '.ab-xb-rare .ab-xb-circle{box-shadow:0 4px 14px rgba(0,0,0,0.4),0 0 12px rgba(96,165,250,0.25),inset 0 0 12px rgba(255,255,255,0.12);}' +
            '.ab-xb-epic .ab-xb-banner{box-shadow:0 6px 20px rgba(0,0,0,0.45),0 0 18px rgba(167,139,250,0.34);}' +
            '.ab-xb-epic .ab-xb-circle{box-shadow:0 4px 14px rgba(0,0,0,0.4),0 0 14px rgba(167,139,250,0.30),inset 0 0 12px rgba(255,255,255,0.12);}' +
            '.ab-xb-legendary .ab-xb-banner{box-shadow:0 6px 20px rgba(0,0,0,0.45),0 0 22px rgba(245,184,32,0.36);}' +
            '.ab-xb-legendary .ab-xb-circle{box-shadow:0 4px 14px rgba(0,0,0,0.4),0 0 16px rgba(245,184,32,0.34),inset 0 0 12px rgba(255,255,255,0.14);}' +
            '.ab-xb-mythic .ab-xb-banner{box-shadow:0 6px 20px rgba(0,0,0,0.45),0 0 24px rgba(220,61,86,0.40);}' +
            '.ab-xb-mythic .ab-xb-circle{box-shadow:0 4px 14px rgba(0,0,0,0.4),0 0 18px rgba(220,61,86,0.36),inset 0 0 12px rgba(255,255,255,0.14);}' +
            // Legendary + mythic shimmer sweeps twice
            '.ab-xb-legendary.ab-xb-play .ab-xb-shimmer::after,.ab-xb-mythic.ab-xb-play .ab-xb-shimmer::after{animation:abXbShimmerSweep 10.5s forwards,abXbShimmerSweep2 10.5s forwards;}' +
            '@keyframes abXbCircle{' +
                '0%{opacity:0;transform:scale(0.1) translateX(0);background-color:var(--ab-color,#39960C);}' +
                '4%{opacity:1;transform:scale(1.1) translateX(0);}' +
                '5%{transform:scale(1) translateX(0);}' +
                '11%{transform:scale(1) translateX(0);background-color:var(--ab-color,#39960C);}' +
                '24%{transform:scale(1) translateX(-140px);background-color:var(--ab-color-bright,#42ae0e);}' +
                '85%{transform:scale(1) translateX(-140px);opacity:1;background-color:var(--ab-color-bright,#42ae0e);}' +
                '89%{transform:scale(1) translateX(0);opacity:1;background-color:var(--ab-color,#39960C);}' +
                '96%{transform:scale(1.1) translateX(0);}' +
                '98%{transform:scale(0.1) translateX(0);opacity:1;}' +
                '99%{opacity:0;}' +
                '100%{transform:scale(0.1) translateX(0);opacity:0;}' +
            '}' +
            '@keyframes abXbBannerFill{' +
                '0%{background-color:var(--ab-color,#39960C);}' +
                '11%{background-color:var(--ab-color,#39960C);}' +
                '24%{background-color:var(--ab-color-bright,#42ae0e);}' +
                '85%{background-color:var(--ab-color-bright,#42ae0e);}' +
                '89%{background-color:var(--ab-color,#39960C);}' +
                '100%{background-color:var(--ab-color,#39960C);}' +
            '}' +
            '@keyframes abXbPulse{' +
                '0%{transform:scale(0);opacity:0;}' +
                '2%{opacity:1;}' +
                '5%{transform:scale(1);opacity:0.8;}' +
                '6%{opacity:0;}' +
                '100%{transform:scale(1);opacity:0;}' +
            '}' +
            '@keyframes abXbBanner{' +
                '0%{width:75px;margin-left:-37px;opacity:0;}' +
                '2%{opacity:0;}' +
                '4%{opacity:1;}' +
                '11%{width:75px;margin-left:-37px;}' +
                '24%{width:355px;margin-left:-177px;}' +
                '85%{width:355px;margin-left:-177px;opacity:1;}' +
                '89%{width:75px;margin-left:-37px;opacity:1;}' +
                '90%{opacity:0;}' +
                '100%{opacity:0;}' +
            '}' +
            '@keyframes abXbText{' +
                '0%{transform:translateY(85px);opacity:0;}' +
                '20%{transform:translateY(85px);opacity:0;}' +
                '25%{transform:translateY(0);opacity:1;}' +
                '79%{transform:translateY(0);opacity:1;}' +
                '84%{transform:translateY(-115px);opacity:0;}' +
                '100%{opacity:0;}' +
            '}' +
            '@keyframes abXbTrophyRotate{' +
                '0%{transform:rotateY(0deg);}' +
                '50%{transform:rotateY(360deg);}' +
                '100%{transform:rotateY(0deg);}' +
            '}' +
            '@keyframes abXbShimmerOpacity{' +
                '0%,27%{opacity:0;}' +
                '30%{opacity:1;}' +
                '82%{opacity:1;}' +
                '84%,100%{opacity:0;}' +
            '}' +
            '@keyframes abXbShimmerSweep{' +
                '0%,28%{transform:translateX(0) skewX(-18deg);}' +
                '46%{transform:translateX(900%) skewX(-18deg);}' +
                '100%{transform:translateX(900%) skewX(-18deg);}' +
            '}' +
            '@keyframes abXbShimmerSweep2{' +
                '0%,58%{transform:translateX(0) skewX(-18deg);opacity:0;}' +
                '59%{opacity:1;}' +
                '76%{transform:translateX(900%) skewX(-18deg);opacity:1;}' +
                '77%,100%{opacity:0;}' +
            '}';
        document.head.appendChild(style);

        fetchJson('Plugins/AchievementBadges/admin/ui-features').then(function (f) {
            if (f) { features = { EnableUnlockToasts: !!f.EnableUnlockToasts, EnableHomeWidget: !!f.EnableHomeWidget, EnableItemDetailRibbon: !!f.EnableItemDetailRibbon }; }
        }).finally(function () {
            pollUnlocks();
            setInterval(pollUnlocks, 8000);
            onRouteChange();
            window.addEventListener('hashchange', onRouteChange);
            new MutationObserver(onRouteChange).observe(document.body, { childList: true, subtree: true });

            // Hook Jellyfin's playback events so unlocks earned mid-watch
            // surface within a second instead of waiting for the next poll tick.
            function bindPlaybackEvents() {
                try {
                    if (window.Events && window.Events.on && !window._abPlaybackBound) {
                        window._abPlaybackBound = true;
                        var burst = function () {
                            pollUnlocks();
                            setTimeout(pollUnlocks, 1500);
                            setTimeout(pollUnlocks, 4000);
                        };
                        window.Events.on(window, 'playbackstart', burst);
                        window.Events.on(window, 'playbackstop', burst);
                        window.Events.on(window, 'playbackprogress', function () {
                            var now = Date.now();
                            if (!window._abLastProgressPoll || now - window._abLastProgressPoll > 7000) {
                                window._abLastProgressPoll = now;
                                pollUnlocks();
                            }
                        });
                    }
                } catch (e) { }
            }
            bindPlaybackEvents();
            setTimeout(bindPlaybackEvents, 2000);
            setTimeout(bindPlaybackEvents, 6000);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
