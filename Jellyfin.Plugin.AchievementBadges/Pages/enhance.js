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

    var rarityColor = {
        common: '#9aa5b1', uncommon: '#4caf50', rare: '#2196f3',
        epic: '#9c27b0', legendary: '#ff9800', mythic: '#f44336'
    };

    function showToast(badge) {
        if (visibleToastCount >= MAX_VISIBLE_TOASTS) {
            toastQueue.push(badge);
            return;
        }
        visibleToastCount++;
        var c = ensureToastContainer();
        var rarity = (badge.Rarity || 'common').toLowerCase();
        var color = rarityColor[rarity] || '#9aa5b1';
        var isRare = rarity !== 'common' && rarity !== 'uncommon';
        var scorePts = rarityScorePts[rarity] || 10;
        var label = isRare ? ((badge.Rarity || 'Rare') + ' achievement unlocked') : 'Achievement unlocked';

        var item = document.createElement('div');
        item.className = 'ab-xb';
        if (isRare) item.classList.add('ab-xb-rare');
        item.innerHTML =
            '<div class="ab-xb-circle" style="--ab-color:' + color + ';">' +
                '<span class="material-icons ab-xb-trophy">emoji_events</span>' +
            '</div>' +
            '<div class="ab-xb-banner" style="--ab-color:' + color + ';">' +
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
            var container = document.createElement('div');
            container.style.cssText = 'position:fixed;pointer-events:none;top:20px;right:20px;z-index:100000;width:400px;height:200px;overflow:visible;';
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
                p.style.cssText = 'position:absolute;top:20px;right:20px;width:' + size + 'px;height:' + size + 'px;' +
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
            '.videoPlayerContainer #ab-toast-container,' +
            'body:has(.videoPlayerContainer) #ab-toast-container { display: none !important; }' +

            // ===== Xbox-style achievement toast =====
            '.ab-xb{position:relative;width:355px;height:90px;font-family:"Segoe UI",system-ui,sans-serif;pointer-events:none;}' +
            '.ab-xb-circle{position:absolute;left:50%;top:7px;margin-left:-37px;width:75px;height:75px;border-radius:50%;background:var(--ab-color,#39960C);display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.1);z-index:2;box-shadow:0 4px 18px rgba(0,0,0,0.4);}' +
            '.ab-xb-circle::before,.ab-xb-circle::after{content:"";position:absolute;inset:0;border-radius:50%;background:var(--ab-color,#39960C);opacity:0;filter:brightness(1.25);}' +
            '.ab-xb-trophy{color:#fff;font-size:40px !important;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));}' +
            '.ab-xb-banner{position:absolute;left:50%;top:7px;margin-left:-37px;width:75px;height:75px;border-radius:100px;background:var(--ab-color,#39960C);opacity:0;overflow:hidden;z-index:1;box-shadow:0 6px 24px rgba(0,0,0,0.45);}' +
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
            '.ab-xb-play .ab-xb-banner{animation:abXbBanner 10.5s forwards;}' +
            '.ab-xb-play .ab-xb-text{animation:abXbText 10.5s forwards;}' +
            '.ab-xb-rare .ab-xb-banner{box-shadow:0 6px 28px rgba(0,0,0,0.45),0 0 40px var(--ab-color,#39960C);}' +
            '.ab-xb-rare .ab-xb-circle{box-shadow:0 4px 18px rgba(0,0,0,0.4),0 0 30px var(--ab-color,#39960C);}' +
            '@keyframes abXbCircle{' +
                '0%{opacity:0;transform:scale(0.1) translateX(0);}' +
                '4%{opacity:1;transform:scale(1.1) translateX(0);}' +
                '5%{transform:scale(1) translateX(0);}' +
                '11%{transform:scale(1) translateX(0);background-color:var(--ab-color,#39960C);}' +
                '24%{transform:scale(1) translateX(-140px);}' +
                '85%{transform:scale(1) translateX(-140px);opacity:1;}' +
                '89%{transform:scale(1) translateX(0);opacity:1;}' +
                '96%{transform:scale(1.1) translateX(0);}' +
                '98%{transform:scale(0.1) translateX(0);opacity:1;}' +
                '99%{opacity:0;}' +
                '100%{transform:scale(0.1) translateX(0);opacity:0;}' +
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
            '}';
        document.head.appendChild(style);

        fetchJson('Plugins/AchievementBadges/admin/ui-features').then(function (f) {
            if (f) { features = { EnableUnlockToasts: !!f.EnableUnlockToasts, EnableHomeWidget: !!f.EnableHomeWidget, EnableItemDetailRibbon: !!f.EnableItemDetailRibbon }; }
        }).finally(function () {
            pollUnlocks();
            setInterval(pollUnlocks, 30000);
            onRouteChange();
            window.addEventListener('hashchange', onRouteChange);
            new MutationObserver(onRouteChange).observe(document.body, { childList: true, subtree: true });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
