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
        common:    { base: '#7a95ad', lighter: '#b0c6d8', darker: '#4e6678', bright: '#9fb3c8' },
        uncommon:  { base: '#28a77a', lighter: '#4cd9a4', darker: '#1a6e50', bright: '#34d399' },
        rare:      { base: '#4080d4', lighter: '#7ab3ff', darker: '#2558a0', bright: '#60a5fa' },
        epic:      { base: '#8a6ee0', lighter: '#b8a0ff', darker: '#5838a8', bright: '#a78bfa' },
        legendary: { base: '#d49a10', lighter: '#ffd048', darker: '#9a6e00', bright: '#f5b820' },
        mythic:    { base: '#b82e45', lighter: '#f05672', darker: '#7a1525', bright: '#dc3d56' }
    };

    var _abSound = null;
    try { _abSound = new Audio('data:audio/mpeg;base64,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9zmjYjPueIfvrrg8sJl0kkjAB7uR41Aa4pYcL9rtl8eIZjysJanrAlWnk1h6ouaGhAhmolKbJTOVcx2SmxH7SIv6GWpz6LNPqVXFO1cHlhMukkkYAPdyPGoDXFLDhftdsvjxDMeVhLU9YEq08msPVFzQ0IEM1EpTZKZyrmOyU2I/aRF/Qy1OfRZp9Sq4p2rAQrkAVn/QBe//nr0rOcmBxpAS5b+pOIzDb24RdWx+5murNDr1NuQjVQTGB+XKakpX3flICsfftJ19T7Xx+5Dc6lCuQBWf9AF7/+evSs5yYHGkBLlv6k4jMNvbhF1bH7ma6s0OvU3/+3IAtwACDhvRaflKTEHDei0/KUmITG9JqGFpMQmN6TUMLSa5CNVBMYH5cpqSlfd+UgKx9+0nX1PtfH7kNzqXLLQXrJAgABJv/KlrMZPCUjGNtOEQnckEAmUw56leK+azdTmYcqx0RheiAKTT7BQXvnaYAUN/2gTiv+LCrlloL1kgQAAk3/lS1mMnhKRjG2nCITuSCATKYc9SvFfNZupzMOVY6IwvRAFJp9goL3ztMAKG/7QJxX/FhUBQm6sBiZ/AoAAJbpJhjwGhDLjlSmSP+M6WLDUo/AQEMzZ4aqJJkLEu0Iz3qe2mx9z1Z7//KqE3VgMTP4FAABLdJMMeA0IZccqUyR/xnSxYalH4CAhmbPDVRJMhYl2hGe9T202PuerPf/5VCf8r7SRoAAEb5iBQXZlTWnGygAx7gv/7cAC9gAICGs5jGFpMQENZzGMLSYecbzmsZMkw843nNYyZJgaFxJNWIsRtgVhUVZlDrMUiLPXxYRa+jZ0oT/lfaSNAAAjfMQKC7Mqa042UAGPcEDQuJJqxFiNsCsKirModZikRZ6+LCLX0bOkt2S2AEAAADKxcAKp3GaYbxxMTNYWPf+V/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+3IAyoABpxbNephJyDTi2a9TCTkF9FsppuSnIL6LZTTclOT//////////////////////////LdktgBAAAAysXACqdxmmG8cTEzWFj3/lf/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7cADxAAb+CcjgZnkoGEE5HAzPJQAAAS4AAAAgAAAlwAAABP//////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+3IA/4AIsABLgAAACAAACXAAAAEAAAEuAAAAIAAAJcAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFRBR1hib3ggMzYwIEFjaGlldmVtZW50IFVubG9ja2VkIFhib3ggMzYwIEFjaGlldmVtZW50IFVubG9ja2VkIFhib3ggMzYwAAAAAAAAAAAAAAAAAAAAAAAAAAAAADIwMDcoYykgTWljcm9zb2Z0IENvcnAuICAgICAgICAgICAM'); _abSound.volume = 0.55; } catch(e) {}

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
                '<svg class="ab-xb-xbox" viewBox="0 0 24 24" width="34" height="34"><path fill="#fff" d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.223.021-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z"/></svg>' +
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

        // Play achievement sound
        if (_abSound && (!userPrefs || userPrefs.EnableSound !== false)) {
            try { _abSound.currentTime = 0; _abSound.play().catch(function(){}); } catch(e) {}
        }

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
            '.ab-xb-xbox{position:relative;z-index:3;opacity:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));}' +
            '.ab-xb-trophy{position:relative;z-index:3;color:#fff;font-size:40px !important;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));opacity:0;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}' +
            // Banner: solid base + vertical sheen gradient on top for depth
            '.ab-xb-banner{position:absolute;left:50%;top:7px;margin-left:-37px;width:75px;height:75px;border-radius:100px;' +
                'background-color:var(--ab-color,#39960C);' +
                'background-image:' +
                    'linear-gradient(90deg,rgba(0,0,0,0.20) 0%,transparent 14%,transparent 86%,rgba(0,0,0,0.20) 100%),' +
                    'linear-gradient(180deg,rgba(255,255,255,0.20) 0%,rgba(255,255,255,0.05) 30%,transparent 55%,rgba(0,0,0,0.22) 100%);' +
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
            '.ab-xb-play .ab-xb-xbox{animation:abXbXboxFade 10.5s forwards;}' +
            '.ab-xb-play .ab-xb-trophy{animation:abXbTrophyFade 10.5s forwards,abXbTrophyRotate 6s linear infinite;}' +
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
            '@keyframes abXbXboxFade{' +
                '0%{opacity:1;}17%{opacity:1;}22%{opacity:0;}88%{opacity:0;}93%{opacity:1;}100%{opacity:1;}' +
            '}' +
            '@keyframes abXbTrophyFade{' +
                '0%{opacity:0;}18%{opacity:0;}23%{opacity:1;}87%{opacity:1;}92%{opacity:0;}100%{opacity:0;}' +
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
