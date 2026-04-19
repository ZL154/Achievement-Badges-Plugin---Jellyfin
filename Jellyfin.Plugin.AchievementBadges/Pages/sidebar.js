(function(){
    try { console.log('[AchievementBadges] sidebar.js loaded'); } catch(e){}
    function escapeHtml(s){ var d=document.createElement('div'); d.textContent=s==null?'':String(s); return d.innerHTML; }
    var SIDEBAR_ID='ab-sidebar-entry';
    var SHOWCASE_ID='ab-sidebar-showcase';
    var HEADER_ID='ab-header-badges';

    // Inject a style rule to hide the header badge row on narrow screens.
    // 5 equipped badges at 30px each eat ~170px of horizontal space, which
    // on phones pushes the hamburger menu and profile icon off the right
    // edge of the header and makes them unreachable. The sidebar entry
    // still works, so the user can still get to their achievements page
    // from the nav drawer — we just hide the desktop-only header strip.
    try {
        if (!document.getElementById('ab-header-styles')) {
            var s = document.createElement('style');
            s.id = 'ab-header-styles';
            s.textContent =
                '@media (max-width: 640px){' +
                    '#ab-header-badges{display:none !important;}' +
                '}';
            (document.head || document.documentElement).appendChild(s);
        }
    } catch(e) {}
    // Allowlist of Material Icons glyph names that actually render in the
    // current Material Icons font. Must stay in sync with standalone.js.
    // Anything not in here falls back to emoji_events, otherwise the font
    // shows the raw text ("CASSETTE", "VINYL") in the sidebar pills / header.
    var VALID_SET=(function(){
        var arr=['play_circle','travel_explore','weekend','chair','home','movie_filter','live_tv','theaters','local_fire_department','bolt','military_tech','auto_awesome','movie','tv','dark_mode','nights_stay','bedtime','wb_sunny','light_mode','sunny','event','event_available','celebration','stars','collections_bookmark','inventory_2','today','calendar_month','favorite','timeline','insights','all_inclusive','speed','rocket_launch','whatshot','emoji_events','cake','help','settings','push_pin','schedule','star','emoji_objects','public','new_releases','verified','workspace_premium','school','science','psychology','self_improvement','fitness_center','sports_esports','music_note','headphones','album','library_music','radio','audiotrack','mic','piano','queue_music','videocam','photo_camera','image','thermostat','ac_unit','cloud','filter_drama','nightlight','shield','security','lock','diamond','paid','savings','account_balance','shopping_cart','redeem','card_giftcard','loyalty','groups','person','face','mood','thumb_up','handshake','pets','eco','lightbulb','tips_and_updates','edit','draw','brush','palette','build','code','devices','phone_android','phone_iphone','laptop','monitor','watch','headset','speaker','volume_up','notifications','campaign','flag','bookmark','tag','description','article','chat','mail','share','download','upload','sync','refresh','replay','replay_circle_filled','history','update','access_time','timer','alarm','hourglass_empty','hourglass_bottom','hourglass_top','hourglass_full','autorenew','loop','fast_forward','fast_rewind','skip_next','skip_previous','play_arrow','pause','circle','category','extension','casino','local_bar','restaurant','local_pizza','icecream','local_cafe','coffee','liquor','wine_bar','nightlife','attractions','park','beach_access','spa','hiking','directions_bike','directions_run','directions_walk','flight','flight_takeoff','directions_car','explore','map','place','language','translate','trending_up','date_range','calendar_today','calendar_view_week','event_repeat','menu_book','library_books','auto_stories','auto_awesome_motion','auto_fix_high','av_timer','award_star','bed','check_circle','connected_tv','fastfood','festival','flash_on','gavel','local_movies','movie_creation','record_voice_over','repeat','repeat_on','rocket','sports_martial_arts','sports_score','swap_horiz','theater_comedy','wb_twilight'];
        var s={}; for(var i=0;i<arr.length;i++) s[arr[i]]=1; return s;
    })();
    function icName(n){
        var s=(n||'emoji_events').toString().toLowerCase().replace(/[^a-z0-9_]/g,'');
        if(!s||!VALID_SET[s]) return 'emoji_events';
        return s;
    }
    var rarityColors={common:'#9fb3c8',uncommon:'#34d399',rare:'#60a5fa',epic:'#a78bfa',legendary:'#fbbf24',mythic:'#f43f5e'};
    function rc(r){return rarityColors[(r||'').toLowerCase()]||'#9fb3c8';}

    function getApi(){return window.ApiClient||window.apiClient||null;}
    function getUserId(){
        var api=getApi();if(!api)return '';
        try{if(typeof api.getCurrentUserId==='function'){var id=api.getCurrentUserId();if(id)return id;}
        if(api._serverInfo&&api._serverInfo.UserId)return api._serverInfo.UserId;}catch(e){}return '';
    }
    function buildUrl(p){var api=getApi();var c=p.replace(/^\/+/,'');return(api&&typeof api.getUrl==='function')?api.getUrl(c):'/'+c;}
    function authHeaders(){
        var h={'Content-Type':'application/json'};var api=getApi();if(!api)return h;
        try{if(typeof api.accessToken==='function'){var t=api.accessToken();if(t)h['X-Emby-Token']=t;}
        else if(api._serverInfo&&api._serverInfo.AccessToken)h['X-Emby-Token']=api._serverInfo.AccessToken;}catch(e){}return h;
    }
    function fetchEquipped(){
        var uid=getUserId();if(!uid)return Promise.resolve([]);
        return fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/equipped'),{headers:authHeaders(),credentials:'include'})
            .then(function(r){return r.ok?r.json():[];}).catch(function(){return [];});
    }

    // Lightweight i18n for the sidebar entry. Loads the user's preferred
    // language and re-applies the few translatable bits (sidebar label,
    // header tooltip) once it resolves.
    var _abSidebarTranslations = {};
    function tr(key, fallback){
        if (_abSidebarTranslations && Object.prototype.hasOwnProperty.call(_abSidebarTranslations, key)){
            return _abSidebarTranslations[key];
        }
        return fallback != null ? fallback : key;
    }
    function loadSidebarTranslations(){
        var uid = getUserId();
        var prefP = uid
            ? fetch(buildUrl('Plugins/AchievementBadges/users/' + uid + '/preferences'), { headers: authHeaders(), credentials: 'include' })
                .then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
            : Promise.resolve(null);
        var pubP = fetch(buildUrl('Plugins/AchievementBadges/public-config'), { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
        return Promise.all([prefP, pubP]).then(function(parts){
            var prefs = parts[0] || {};
            var cfg = parts[1] || {};
            var userLang = (prefs.Language || prefs.language || 'default').toString().toLowerCase();
            var adminLang = (cfg.DefaultLanguage || cfg.defaultLanguage || 'en').toString().toLowerCase();
            var lang = (userLang === 'default' || !userLang) ? adminLang : userLang;
            lang = (lang || 'en').replace(/[^a-z-]/g, '') || 'en';
            return fetch(buildUrl('Plugins/AchievementBadges/translations/' + lang), { headers: authHeaders(), credentials: 'include' })
                .then(function(r){ return r.ok ? r.json() : {}; })
                .then(function(data){ _abSidebarTranslations = data || {}; applyTranslations(); })
                .catch(function(){});
        }).catch(function(){});
    }
    function applyTranslations(){
        var sb = document.getElementById(SIDEBAR_ID);
        if (sb){
            var span = sb.querySelector('.navMenuOptionText');
            if (span) span.textContent = tr('sidebar.achievements', 'Achievements');
        }
        var hdr = document.getElementById(HEADER_ID);
        if (hdr){
            hdr.title = tr('sidebar.equipped_badges', 'Equipped Badges');
        }
    }

    // Cached flag: should we show the equipped-badge showcase UI at all?
    // Resolved from (a) admin force-hide config and (b) per-user preference.
    // Starts as null; once resolved becomes true/false. While null we
    // tentatively allow injection so the UI appears quickly, and hide after
    // if the config says otherwise.
    var _showcaseEnabled = null;
    function resolveShowcaseEnabled(){
        if (_showcaseEnabled !== null) return Promise.resolve(_showcaseEnabled);
        // Track whether EITHER fetch actually succeeded — when both fail
        // (e.g. on page refresh before auth / ApiClient mounts), we must
        // NOT fall through to `_showcaseEnabled = true` because a failed
        // call doesn't mean the admin hasn't force-hidden. Keep the flag
        // `null` so the periodic re-resolve retries.
        var anySucceeded = false;
        var pubPromise = fetch(buildUrl('Plugins/AchievementBadges/public-config'), { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ if (r.ok) { anySucceeded = true; return r.json(); } return null; }).catch(function(){ return null; });
        var prefPromise = (function(){
            var uid = getUserId(); if (!uid) return Promise.resolve(null);
            return fetch(buildUrl('Plugins/AchievementBadges/users/' + uid + '/preferences'), { headers: authHeaders(), credentials: 'include' })
                .then(function(r){ if (r.ok) { anySucceeded = true; return r.json(); } return null; }).catch(function(){ return null; });
        })();
        return Promise.all([pubPromise, prefPromise]).then(function(results){
            var pub = results[0], prefs = results[1];
            if (pub && pub.ForceHideEquippedShowcase) { _showcaseEnabled = false; installShowcaseWatchdog(); return false; }
            if (prefs && prefs.ShowEquippedShowcase === false) { _showcaseEnabled = false; installShowcaseWatchdog(); return false; }
            // If BOTH fetches failed, keep _showcaseEnabled null so the
            // next pass retries. Don't assume the showcase should be on
            // — that was the root cause of "force-hide broken on refresh":
            // public-config fetch 401'd before ApiClient mounted, both
            // fell to null, and the fallback flipped the flag to true.
            if (!anySucceeded) {
                _showcaseEnabled = null;
                return null;
            }
            _showcaseEnabled = true;
            restoreShowcaseCss();
            return true;
        });
    }
    function removeShowcaseDom(){
        var sc = document.getElementById(SHOWCASE_ID); if (sc && sc.parentNode) sc.parentNode.removeChild(sc);
        var hdr = document.getElementById(HEADER_ID); if (hdr && hdr.parentNode) hdr.parentNode.removeChild(hdr);
        // CSS-based double-safety: even if some other script re-creates the
        // elements between removeShowcaseDom() calls, they're hidden
        // visually. `!important` beats any inline display value. Only
        // added once; removed when showcase is re-enabled.
        if (!document.getElementById('ab-force-hide-css')) {
            var st = document.createElement('style');
            st.id = 'ab-force-hide-css';
            st.textContent = '#' + SHOWCASE_ID + ', #' + HEADER_ID + ' { display: none !important; visibility: hidden !important; }';
            (document.head || document.documentElement).appendChild(st);
        }
    }
    function restoreShowcaseCss(){
        var s = document.getElementById('ab-force-hide-css');
        if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    // When showcase is disabled we install a permanent watchdog that keeps
    // removing the showcase/header DOM whenever anything re-creates it. This
    // is essential on upgrades from pre-v1.7.0 where the old bloated inline
    // script is STILL in the user's cached index.html and keeps re-inserting
    // the pills on a setInterval. The admin's plugin upgrade would strip it
    // from disk, but Jellyfin's static caching / browser caching often
    // keeps the old HTML alive for a while. This watchdog kills the DOM
    // in both cases.
    var _showcaseWatchdogInstalled = false;
    function installShowcaseWatchdog(){
        if (_showcaseWatchdogInstalled) return;
        _showcaseWatchdogInstalled = true;
        // Aggressive sweep every 250ms — cheap (just two getElementById).
        setInterval(function(){ if (_showcaseEnabled === false) removeShowcaseDom(); }, 250);
        // Also a MutationObserver so we react immediately when something
        // adds either element, not just on the next tick.
        try {
            if (document.body) {
                new MutationObserver(function(muts){
                    if (_showcaseEnabled !== false) return;
                    for (var i = 0; i < muts.length; i++) {
                        var m = muts[i];
                        for (var j = 0; j < m.addedNodes.length; j++) {
                            var n = m.addedNodes[j];
                            if (!n || n.nodeType !== 1) continue;
                            if (n.id === SHOWCASE_ID || n.id === HEADER_ID) {
                                if (n.parentNode) n.parentNode.removeChild(n);
                            } else if (n.querySelector) {
                                // Added subtree might contain them nested.
                                var nested = n.querySelector('#' + SHOWCASE_ID + ', #' + HEADER_ID);
                                if (nested && nested.parentNode) nested.parentNode.removeChild(nested);
                            }
                        }
                    }
                }).observe(document.body, { childList: true, subtree: true });
            }
        } catch(e) {}
    }

    function injectSidebar(){
        try {
            if(document.getElementById(SIDEBAR_ID)){ return; }
            var allItems = document.querySelectorAll('.navMenuOption');
            var anchorItem = null;
            var anchorPlacement = 'after';
            for(var i=0;i<allItems.length;i++){
                var itxt = (allItems[i].textContent||'').trim().toLowerCase();
                if(/^plugin\s*(settings|pages)$/.test(itxt)){
                    anchorItem = allItems[i];
                    anchorPlacement = 'after';
                    break;
                }
            }
            if(!anchorItem){
                for(var j=0;j<allItems.length;j++){
                    var jhref = (allItems[j].getAttribute('href')||'').toLowerCase();
                    if(jhref.indexOf('home.html')>=0 || jhref.indexOf('#/home')>=0){
                        anchorItem = allItems[j];
                        anchorPlacement = 'after';
                        break;
                    }
                }
            }
            if(!anchorItem && allItems.length){
                anchorItem = allItems[0];
                anchorPlacement = 'before';
            }
            if(!anchorItem){ return; }

            var parent = anchorItem.parentElement;
            if(!parent){ return; }
            console.log('[AchievementBadges] injectSidebar: anchor=', (anchorItem.textContent||'').trim(), 'placement=', anchorPlacement);

            var a = document.createElement('a');
            a.id = SIDEBAR_ID;
            a.href = 'javascript:void(0)';
            a.className = anchorItem.className || 'navMenuOption emby-button';
            a.setAttribute('role','menuitem');
            a.style.cursor = 'pointer';
            a.innerHTML =
                '<span class="material-icons navMenuOptionIcon" style="font-family:Material Icons;">emoji_events</span>' +
                '<span class="navMenuOptionText">' + tr('sidebar.achievements', 'Achievements') + '</span>';
            a.addEventListener('click', function(e){
                e.preventDefault(); e.stopPropagation();
                window.location.hash = '/achievements';
            });

            if(anchorPlacement === 'after'){
                if(anchorItem.nextSibling){ parent.insertBefore(a, anchorItem.nextSibling); }
                else { parent.appendChild(a); }
            } else {
                parent.insertBefore(a, anchorItem);
            }

            // Only add the equipped-showcase strip if enabled (admin override +
            // per-user pref). If still resolving, tentatively skip — the strip
            // gets added later on the next inject pass if allowed.
            if (_showcaseEnabled !== false) {
                var showcase = document.createElement('div');
                showcase.id = SHOWCASE_ID;
                showcase.style.cssText = 'display:flex;gap:4px;padding:2px 12px 8px 42px;flex-wrap:wrap;';
                if(a.nextSibling){ parent.insertBefore(showcase, a.nextSibling); }
                else { parent.appendChild(showcase); }
            }

            refreshShowcases();
        } catch(e) { console.error('[AchievementBadges] injectSidebar error:', e); }
    }

    function injectHeader(){
        try {
            if (_showcaseEnabled === false) return; // admin or user disabled
            if(document.getElementById(HEADER_ID)){ return; }
            var headerRight=document.querySelector('.headerRight')||document.querySelector('.skinHeader .headerButton:last-child');
            if(!headerRight){ return; }
            console.log('[AchievementBadges] injectHeader: found header, adding badges container');
            var container=document.createElement('div');container.id=HEADER_ID;
            container.style.cssText='display:flex;align-items:center;gap:3px;margin-right:6px;';
            container.title=tr('sidebar.equipped_badges', 'Equipped Badges');
            container.style.cursor='pointer';
            container.addEventListener('click',function(){window.location.hash='/achievements';});
            var parent=headerRight.parentElement;
            if(parent)parent.insertBefore(container,headerRight);
            refreshShowcases();
        } catch(e) { console.error('[AchievementBadges] injectHeader error:', e); }
    }

    function refreshShowcases(){
        fetchEquipped().then(function(badges){
            var sc=document.getElementById(SHOWCASE_ID);
            if(sc){
                sc.innerHTML='';
                if(badges&&badges.length){
                    badges.forEach(function(b){
                        var color=rc(b.Rarity);
                        var pill=document.createElement('div');pill.title=b.Title+' ('+b.Rarity+')';
                        pill.style.cssText='display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 5px;border-radius:999px;background:'+color+'1a;border:1px solid '+color+';font-size:11px;cursor:default;line-height:1;';
                        pill.innerHTML='<span class="material-icons" style="font-family:Material Icons;font-size:15px;line-height:1;color:#fff;opacity:0.95;">'+icName(b.Icon)+'</span><span style="color:'+color+';font-weight:700;line-height:1;">'+escapeHtml(b.Title)+'</span>';
                        sc.appendChild(pill);
                    });
                }
            }
            var hdr=document.getElementById(HEADER_ID);
            if(hdr){
                hdr.innerHTML='';
                if(badges&&badges.length){
                    badges.forEach(function(b){
                        var color=rc(b.Rarity);
                        var dot=document.createElement('div');dot.title=b.Title+' ('+b.Rarity+')';
                        dot.style.cssText='width:30px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:'+color+'26;border:1.5px solid '+color+';box-shadow:0 0 12px '+color+'55;';
                        dot.innerHTML='<span class="material-icons" style="font-family:Material Icons;font-size:16px;line-height:1;color:#fff;">'+icName(b.Icon)+'</span>';
                        hdr.appendChild(dot);
                    });
                }
            }
        });
    }

    function tryInject(){
        // Resolve showcase flag on first pass; if disabled, ensure any
        // previously-injected showcase DOM is cleaned up.
        resolveShowcaseEnabled().then(function (enabled) {
            if (!enabled) removeShowcaseDom();
            injectSidebar();
            injectHeader();
        });
        // Idempotent — mounts the friends button/drawer exactly once, but
        // is cheap to call repeatedly so the retry loop covers the case
        // where document.body wasn't ready on the first start() call.
        try { ensureFriendsDrawer(); } catch(e) {}
    }

    // Listen for live preference changes broadcast from the achievements
    // page. When the user toggles ShowEquippedShowcase we want the sidebar
    // pills and header dots to update immediately without a hard refresh.
    // Live-apply corner changes from the standalone settings panel.
    try {
        window.addEventListener('ab:friends-corner-changed', function (ev) {
            if (ev && ev.detail && typeof ev.detail.corner === 'string') {
                applyCorner(ev.detail.corner);
            }
        });
    } catch (e) {}

    try {
        window.addEventListener('ab:showcase-pref-changed', function (ev) {
            // If the event includes the new value, use it directly instead
            // of re-fetching /preferences — saves a race where the pref POST
            // hasn't landed yet and the server still returns the OLD state.
            if (ev && ev.detail && typeof ev.detail.show === 'boolean') {
                _showcaseEnabled = ev.detail.show;
                if (!ev.detail.show) {
                    installShowcaseWatchdog();
                    removeShowcaseDom();
                }
                tryInject();
                return;
            }
            _showcaseEnabled = null;
            tryInject();
        });
    } catch (e) {}

    // Re-resolve the showcase flag on every meaningful navigation event +
    // a frequent timer, so an ADMIN toggling ForceHideEquippedShowcase
    // propagates to every open client within ~15s (admin can't broadcast
    // to other users' tabs cross-origin). Resetting _showcaseEnabled to
    // null forces resolveShowcaseEnabled to re-fetch public-config + prefs
    // from the server.
    function forceResolveShowcase(){
        _showcaseEnabled = null;
        resolveShowcaseEnabled().then(function(enabled){
            if (!enabled) removeShowcaseDom();
        });
    }
    // Install the watchdog unconditionally on script load. It's idempotent
    // (only runs actions when _showcaseEnabled === false) so pays nothing
    // when showcase is enabled. This guarantees that the moment the flag
    // resolves to false (even mid-page-load), the showcase DOM gets
    // swept out immediately — before the watchdog install used to be
    // gated on the resolve completing, so a slow server response could
    // leave the showcase visible on refresh until the next hashchange.
    installShowcaseWatchdog();
    // Tighter poll: 5s instead of 15s for faster admin-flip propagation.
    setInterval(forceResolveShowcase, 5000);
    try {
        window.addEventListener('hashchange', forceResolveShowcase);
        document.addEventListener('visibilitychange', function(){
            if (document.visibilityState === 'visible') forceResolveShowcase();
        });
    } catch(e) {}

    // ====================== Friends drawer ==============================
    // Global floating button + Xbox-guide-style side drawer. Lives in
    // sidebar.js so it's available on EVERY Jellyfin page, not just the
    // achievements tab. Anchored bottom-LEFT per user feedback.
    function rarityColour(r){ return rarityColors[(r||'').toLowerCase()] || rarityColors.common; }
    function renderEquippedDots(eq, size){
        if (!eq || !eq.length) return '';
        var px = size || 16;
        return '<span style="display:inline-flex;gap:3px;vertical-align:middle;">' +
            eq.slice(0,5).map(function(b){
                var c = rarityColour(b.Rarity);
                return '<span title="'+escapeHtml(b.Title||'')+'" style="width:'+px+'px;height:'+px+'px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:'+c+'26;border:1.5px solid '+c+';box-shadow:0 0 6px '+c+'55;">' +
                    '<span class="material-icons" style="font-family:Material Icons;font-size:'+Math.max(10,px-6)+'px;line-height:1;color:#fff;">'+icName(b.Icon)+'</span>' +
                '</span>';
            }).join('') +
        '</span>';
    }

    var _friendsMounted = false;
    var _friendsOpen = false;
    var _friendsCachedUsers = null;
    var _friendsSimpleMode = false;
    var _friendsCornerApplied = null;
    // Chat / messaging state
    var _friendUnread = {};         // map of otherUserId → unreadCount
    var _chatOpen = false;          // is the chat pane currently visible?
    var _chatPeerId = null;         // for DMs: the other user's id (also keeps per-peer mute working)
    var _chatConvId = null;         // conversation id (DM or group)
    var _chatConvType = 'dm';       // 'dm' | 'group'
    var _chatParticipants = [];     // [{userId,userName}] for groups
    var _chatPeerName = null;       // display name for header
    var _chatPeerOnline = false;    // online state for header dot
    var _chatPollTimer = null;      // setInterval id for in-chat polling
    var _chatUnreadPollTimer = null;// setInterval id for drawer unread polling
    var _chatMsgsPollTimer = null;  // messages-tab poll while that tab is active
    var _chatLastRenderHash = '';   // to suppress flicker if nothing changed
    var _chatPendingAttachment = null; // { Id, FileName, MimeType, ... } before send
    var _activeFdTab = 'friends';   // track which fd-tab is visible
    // Before mounting, check the admin master switch + user's corner pref.
    // If the admin has turned the friends feature off entirely, we simply
    // don't render the floating button. Periodic re-resolve catches admin
    // flips within ~15s without requiring a refresh.
    function resolveFriendsConfig(){
        var uid = getUserId();
        var pub = fetch(buildUrl('Plugins/AchievementBadges/public-config'), { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
        var pref = uid ? fetch(buildUrl('Plugins/AchievementBadges/users/' + uid + '/preferences'), { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }) : Promise.resolve(null);
        return Promise.all([pub, pref]).then(function(results){
            var p = results[0] || {};
            var pr = results[1] || {};
            return {
                enabled: p.FriendsEnabled !== false,
                simple: !!(p.FriendsSimpleMode || p.friendsSimpleMode),
                corner: (pr.FriendsButtonCorner || pr.friendsButtonCorner || 'bottom-left').toLowerCase()
            };
        });
    }

    function applyCorner(corner){
        var btn = document.getElementById('abFriendsBtn');
        var drawer = document.getElementById('abFriendsDrawer');
        if (!btn) return;
        btn.style.left = 'auto'; btn.style.right = 'auto';
        btn.style.top = 'auto'; btn.style.bottom = 'auto';
        var slideFromLeft = corner.indexOf('left') >= 0;
        if (corner === 'top-left') { btn.style.left = '1em'; btn.style.top = '1.2em'; btn.style.bottom = 'auto'; }
        else if (corner === 'top-right') { btn.style.right = '1em'; btn.style.top = '1.2em'; btn.style.bottom = 'auto'; }
        else if (corner === 'bottom-right') { btn.style.right = '1em'; btn.style.bottom = '1.2em'; btn.style.top = 'auto'; }
        else { btn.style.left = '1em'; btn.style.bottom = '1.2em'; btn.style.top = 'auto'; } // bottom-left default
        if (drawer) {
            // Slide direction matches the button's horizontal anchor.
            drawer.style.left = slideFromLeft ? '0' : 'auto';
            drawer.style.right = slideFromLeft ? 'auto' : '0';
            drawer.style.borderLeft = slideFromLeft ? '1px solid rgba(255,255,255,0.08)' : 'none';
            drawer.style.borderRight = slideFromLeft ? 'none' : '1px solid rgba(255,255,255,0.08)';
            // When mounting on the right, slide OUT to the right (translateX(100%))
            // instead of to the left.
            drawer.dataset.abSlideDir = slideFromLeft ? 'left' : 'right';
            drawer.style.transform = _friendsOpen ? 'translateX(0)' : (slideFromLeft ? 'translateX(-100%)' : 'translateX(100%)');
        }
        _friendsCornerApplied = corner;
    }

    function ensureFriendsDrawer(){
        if (_friendsMounted) return;
        // If a button already exists in the DOM (e.g. sidebar.js was
        // loaded twice due to the upgrade cache-bust serving both
        // versions in-flight), mark mounted and bail so we don't stack
        // a second button on top.
        if (document.getElementById('abFriendsBtn')) { _friendsMounted = true; return; }
        // Reserve the slot synchronously so a second ensureFriendsDrawer
        // call during the config fetch can't race in and spawn a duplicate.
        _friendsMounted = true;
        resolveFriendsConfig().then(function(cfg){
            if (!cfg.enabled) { _friendsMounted = false; return; }
            _friendsSimpleMode = cfg.simple;
            _actuallyMount();
            applyCorner(cfg.corner);
            // Kick off background unread-count poll so the button's red
            // dot lights up even when the drawer is closed. 20s cadence
            // keeps traffic trivial.
            if (_chatUnreadPollTimer) clearInterval(_chatUnreadPollTimer);
            refreshUnreadCounts();
            _chatUnreadPollTimer = setInterval(refreshUnreadCounts, 20000);
        }).catch(function(){ _friendsMounted = false; });
    }

    // Track the admin's FriendsEnabled verdict separately from the page-
    // context auto-hide (dashboard/playback). Button is visible only when
    // BOTH gates say "show".
    var _friendsAdminEnabled = true;
    // Periodic reconcile: admin toggles / user corner changes propagate
    // without a hard refresh.
    setInterval(function(){
        resolveFriendsConfig().then(function(cfg){
            _friendsAdminEnabled = !!cfg.enabled;
            var btn = document.getElementById('abFriendsBtn');
            if (!cfg.enabled) {
                // Admin disabled feature — physically remove the DOM so
                // there's no window in which the button can be visible.
                // display:none alone races with sync/applyCorner/mount.
                _destroyAllFriendsDom();
                return;
            }
            if (!_friendsMounted) {
                if (document.getElementById('abFriendsBtn')) { _friendsMounted = true; return; }
                _friendsSimpleMode = cfg.simple;
                _friendsMounted = true;
                _actuallyMount();
                applyCorner(cfg.corner);
            } else {
                // Re-run the context-aware visibility check — don't
                // unconditionally clear display here (that was overriding
                // the dashboard/playback auto-hide).
                if (typeof window.__abSyncFriendsBtnVisibility === 'function') {
                    window.__abSyncFriendsBtnVisibility();
                }
                if (_friendsSimpleMode !== cfg.simple) {
                    _friendsSimpleMode = cfg.simple;
                    applySimpleModeUi();
                    try { loadFriends(); } catch(e) {}
                }
                if (cfg.corner !== _friendsCornerApplied) applyCorner(cfg.corner);
            }
        });
    }, 15000);

    // Toggle the Requests + Find tab buttons in simple mode. Rendered
    // always but hidden via display:none so the switch is instant
    // without rebuilding the drawer.
    function applySimpleModeUi(){
        var drawer = document.getElementById('abFriendsDrawer');
        if (!drawer) return;
        // Toggle the class — CSS above handles the actual hiding via
        // `!important` so nothing can accidentally override it.
        drawer.classList.toggle('ab-fd-drawer-simple', !!_friendsSimpleMode);
        // Belt-and-braces: also flip inline display on each element so
        // old cached stylesheets (that don't have the new CSS rules)
        // still hide the tabs.
        drawer.querySelectorAll('[data-ab-hide-in-simple]').forEach(function(el){
            el.style.display = _friendsSimpleMode ? 'none' : '';
        });
        // If the active tab was Requests/Find and we just switched to
        // simple mode, drop back to the Friends tab.
        if (_friendsSimpleMode) {
            var activeTab = drawer.querySelector('.ab-fd-tab.active');
            if (activeTab && activeTab.getAttribute('data-ab-fdtab') !== 'friends') {
                var friendsTab = drawer.querySelector('[data-ab-fdtab="friends"]');
                if (friendsTab) friendsTab.click();
            }
        }
    }

    // Stamp our build id on every DOM node we create, so a newer version
    // loaded alongside an older cached copy can detect and clean up the
    // stale artifacts before mounting fresh.
    var AB_SIDEBAR_VER = '1.7.16';
    function _destroyStaleFriendsDom(){
        ['abFriendsBtn', 'abFriendsDrawer', 'abFriendsBackdrop'].forEach(function(id){
            var n = document.getElementById(id);
            if (n && n.dataset && n.dataset.abVer !== AB_SIDEBAR_VER && n.parentNode) {
                n.parentNode.removeChild(n);
            }
        });
    }
    // Physically remove every friends DOM node regardless of version —
    // used when the admin disables the friends feature entirely, because
    // merely toggling display:none isn't enough: the user sees the
    // button for up to 500ms until the sync loop catches up, and the
    // visibility logic can race with the admin-gate logic. Just remove.
    function _destroyAllFriendsDom(){
        ['abFriendsBtn', 'abFriendsDrawer', 'abFriendsBackdrop'].forEach(function(id){
            var n = document.getElementById(id);
            if (n && n.parentNode) n.parentNode.removeChild(n);
        });
        _friendsMounted = false;
        _friendsOpen = false;
    }
    function _actuallyMount(){
        // Remove any stale older-version button/drawer/backdrop so we
        // don't end up with two buttons when the browser has both the
        // pre-upgrade and post-upgrade sidebar.js loaded in the same
        // document (e.g. cached index.html pointing at the old URL plus
        // the newly injected tag with the ?v= cache-buster).
        _destroyStaleFriendsDom();
        // If OUR version is already mounted, nothing to do.
        var existingBtn = document.getElementById('abFriendsBtn');
        if (existingBtn && existingBtn.dataset.abVer === AB_SIDEBAR_VER) return;

        // One-time stylesheet.
        if (!document.getElementById('ab-friends-styles')) {
            var fst = document.createElement('style');
            fst.id = 'ab-friends-styles';
            fst.textContent =
                '#abFriendsBtn{position:fixed;left:1em;bottom:1.2em;width:52px;height:52px;border-radius:16px;border:none;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;box-shadow:0 8px 22px rgba(102,126,234,0.45),inset 0 0 0 1px rgba(255,255,255,0.1);cursor:pointer;z-index:9999998;display:flex;align-items:center;justify-content:center;transition:transform 0.15s,box-shadow 0.15s;}' +
                '#abFriendsBtn:hover{transform:scale(1.08);box-shadow:0 12px 28px rgba(102,126,234,0.6),inset 0 0 0 1px rgba(255,255,255,0.2);}' +
                '#abFriendsBtn .material-icons{font-size:1.6em;}' +
                '#abFriendsBadge{position:absolute;top:-5px;right:-5px;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:0.7em;font-weight:800;display:none;align-items:center;justify-content:center;box-shadow:0 0 0 2px rgba(10,12,18,0.92);}' +
                '#abFriendsBackdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);z-index:9999997;opacity:0;transition:opacity 0.22s;}' +
                '#abFriendsDrawer{display:none;position:fixed;top:0;left:0;width:min(360px,92vw);height:100vh;background:linear-gradient(170deg,#1a1f2e 0%,#0d1017 100%);border-right:1px solid rgba(255,255,255,0.08);box-shadow:10px 0 40px rgba(0,0,0,0.6);z-index:9999999;flex-direction:column;transform:translateX(-100%);transition:transform 0.28s cubic-bezier(.22,.9,.3,1);color:#fff;font-family:inherit;}' +
                '.ab-fd-header{padding:1.1em 1.2em 0.9em;display:flex;align-items:center;gap:0.6em;border-bottom:1px solid rgba(255,255,255,0.06);background:linear-gradient(90deg,rgba(102,126,234,0.1),transparent);}' +
                '.ab-fd-ico{background:linear-gradient(135deg,#667eea,#764ba2);width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1em;color:#fff;}' +
                '.ab-fd-title{font-weight:800;font-size:1.05em;flex:1;letter-spacing:0.2px;}' +
                '.ab-fd-close{background:rgba(255,255,255,0.06);border:none;color:#fff;cursor:pointer;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}' +
                '.ab-fd-close:hover{background:rgba(255,255,255,0.15);}' +
                '.ab-fd-tabs{display:flex;padding:0.6em 0.8em;gap:0.35em;border-bottom:1px solid rgba(255,255,255,0.06);}' +
                '.ab-fd-tab{flex:1;padding:0.6em 0.6em;background:transparent;border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#c7d2fe;font-size:0.82em;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.3em;transition:all 0.15s;}' +
                '.ab-fd-tab:hover{background:rgba(255,255,255,0.05);}' +
                '.ab-fd-tab.active{background:linear-gradient(135deg,rgba(102,126,234,0.22),rgba(118,75,162,0.22));border-color:rgba(102,126,234,0.55);color:#fff;box-shadow:0 4px 12px rgba(102,126,234,0.2);}' +
                // Simple mode: CSS-based hide for Requests + Find tabs and
                // the associated panes. `!important` beats inline display
                // so even if something else flips display back on, these
                // stay hidden while the drawer carries the simple class.
                '#abFriendsDrawer.ab-fd-drawer-simple [data-ab-hide-in-simple]{display:none !important;}' +
                '#abFriendsDrawer.ab-fd-drawer-simple #abFriendsPaneRequests, #abFriendsDrawer.ab-fd-drawer-simple #abFriendsPaneFind{display:none !important;}' +
                '.ab-fd-body{flex:1;overflow-y:auto;padding:0.8em;}' +
                '.ab-fd-row{display:flex;align-items:center;gap:0.7em;padding:0.7em 0.55em;border-radius:12px;transition:background 0.15s;margin-bottom:0.2em;}' +
                '.ab-fd-row:hover{background:rgba(255,255,255,0.04);}' +
                // Use background-color + background-image SEPARATELY so
                // setting background-image via inline style (for Jellyfin
                // avatars) doesn't get clobbered by the gradient background
                // on `.online`. The online state now shows only via the
                // inset box-shadow ring + the green status dot (::after).
                '.ab-fd-avatar{width:40px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800;font-size:0.9em;position:relative;background-color:#1e293b;background-image:linear-gradient(135deg,#334155,#1e293b);color:#cbd5e1;background-size:cover;background-position:center;background-repeat:no-repeat;overflow:hidden;}' +
                '.ab-fd-avatar.online{color:#bbf7d0;box-shadow:inset 0 0 0 2px #4ade80;}' +
                '.ab-fd-avatar::after{content:"";position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:999px;background:rgba(255,255,255,0.22);border:2px solid #0d1017;}' +
                '.ab-fd-avatar.online::after{background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,0.8);}' +
                '.ab-fd-info{flex:1;min-width:0;}' +
                '.ab-fd-name{font-weight:700;font-size:0.95em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
                '.ab-fd-status{font-size:0.75em;opacity:0.65;margin-top:0.1em;}' +
                '.ab-fd-status.online{color:#86efac;opacity:0.9;}' +
                '.ab-fd-actions{display:flex;gap:0.3em;}' +
                '.ab-fd-act{padding:0.4em 0.7em;border-radius:8px;border:none;background:rgba(255,255,255,0.06);color:#c7d2fe;font-size:0.8em;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:0.3em;transition:all 0.15s;}' +
                '.ab-fd-act:hover{background:rgba(255,255,255,0.14);color:#fff;}' +
                '.ab-fd-act.accept{background:rgba(74,222,128,0.18);color:#86efac;}' +
                '.ab-fd-act.accept:hover{background:rgba(74,222,128,0.3);}' +
                '.ab-fd-act.decline{background:rgba(239,68,68,0.15);color:#fca5a5;}' +
                '.ab-fd-act.decline:hover{background:rgba(239,68,68,0.3);}' +
                '.ab-fd-act .material-icons{font-size:1em;}' +
                '.ab-fd-section{font-size:0.72em;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.45);font-weight:700;margin:0.85em 0.4em 0.4em;}' +
                '.ab-fd-empty{text-align:center;padding:2em 1em;color:rgba(255,255,255,0.5);}' +
                '.ab-fd-empty .material-icons{font-size:2.8em;opacity:0.3;margin-bottom:0.4em;display:block;}' +
                '.ab-fd-search{width:100%;padding:0.7em 0.9em;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-family:inherit;font-size:0.92em;margin-bottom:0.85em;box-sizing:border-box;}' +
                '.ab-fd-search:focus{outline:none;border-color:rgba(102,126,234,0.55);box-shadow:0 0 0 3px rgba(102,126,234,0.18);}' +
                // Tab-attached unread pill — tiny circular dot-style count
                // anchored to the top-right of the Requests / Messages tab
                // buttons. Replaces the blocky inline badge style that looked
                // wrong after friends names.
                '#abFriendsIncBadge{position:absolute;top:2px;right:4px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:0.6em;font-weight:800;line-height:16px;text-align:center;box-shadow:0 0 0 2px rgba(10,12,18,0.92);}' +
                '#abMsgsTabBadge{position:absolute;top:2px;right:4px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:0.6em;font-weight:800;line-height:16px;text-align:center;box-shadow:0 0 0 2px rgba(10,12,18,0.92);}' +
                '.ab-fd-tab{position:relative;}' +

                // ── Chat panel (Xbox-style slide-over inside the drawer) ──
                '#abFriendsChatPane{position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(170deg,#1a1f2e 0%,#0d1017 100%);display:none;flex-direction:column;transform:translateX(100%);transition:transform 0.24s cubic-bezier(.22,.9,.3,1);z-index:5;}' +
                '#abFriendsChatPane.open{transform:translateX(0);}' +
                '.ab-chat-header{display:flex;align-items:center;gap:0.7em;padding:1em 1.1em;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);}' +
                '.ab-chat-back{width:32px;height:32px;border-radius:10px;border:none;background:rgba(255,255,255,0.08);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.12s;flex-shrink:0;}' +
                '.ab-chat-back:hover{background:rgba(255,255,255,0.16);}' +
                '.ab-chat-back .material-icons{font-size:1.2em;}' +
                '.ab-chat-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85em;flex-shrink:0;background-size:cover;background-position:center;position:relative;}' +
                '.ab-chat-avatar.online::after{content:"";position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;background:#10b981;border-radius:50%;border:2px solid #1a1f2e;}' +
                '.ab-chat-peer{flex:1;min-width:0;}' +
                '.ab-chat-peer-name{font-weight:700;font-size:0.98em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
                '.ab-chat-peer-status{font-size:0.75em;color:rgba(255,255,255,0.55);margin-top:0.15em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
                '.ab-chat-peer-status.online{color:#10b981;}' +
                '.ab-chat-scroll{flex:1;overflow-y:auto;padding:0.9em 0.9em 0.5em;display:flex;flex-direction:column;gap:0.45em;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.18) transparent;}' +
                '.ab-chat-scroll::-webkit-scrollbar{width:6px;}' +
                '.ab-chat-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:3px;}' +
                '.ab-chat-msg{max-width:78%;padding:0.55em 0.85em;border-radius:18px;font-size:0.9em;line-height:1.4;word-wrap:break-word;animation:abChatMsgIn 0.16s ease-out;}' +
                '@keyframes abChatMsgIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:none;}}' +
                '.ab-chat-msg.me{align-self:flex-end;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-bottom-right-radius:4px;box-shadow:0 2px 6px rgba(102,126,234,0.25);}' +
                '.ab-chat-msg.them{align-self:flex-start;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.95);border-bottom-left-radius:4px;}' +
                '.ab-chat-time{font-size:0.66em;opacity:0.6;margin-top:0.25em;display:block;}' +
                '.ab-chat-daysep{align-self:center;margin:0.6em 0 0.1em;font-size:0.65em;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em;font-weight:700;}' +
                '.ab-chat-empty{margin:auto;color:rgba(255,255,255,0.45);font-size:0.85em;text-align:center;padding:2em 1em;display:flex;flex-direction:column;align-items:center;gap:0.6em;}' +
                '.ab-chat-empty .material-icons{font-size:3em;opacity:0.3;}' +
                '.ab-chat-input-row{display:flex;gap:0.5em;padding:0.75em 0.85em;border-top:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);align-items:flex-end;}' +
                '.ab-chat-input{flex:1;resize:none;min-height:40px;max-height:120px;padding:0.55em 0.9em;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;font-size:0.9em;font-family:inherit;outline:none;transition:border-color 0.12s,background 0.12s;}' +
                '.ab-chat-input:focus{border-color:rgba(102,126,234,0.6);background:rgba(255,255,255,0.08);}' +
                '.ab-chat-input::placeholder{color:rgba(255,255,255,0.35);}' +
                '.ab-chat-send{width:40px;height:40px;border-radius:50%;border:none;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.12s,box-shadow 0.12s;flex-shrink:0;}' +
                '.ab-chat-send:hover:not(:disabled){transform:scale(1.08);box-shadow:0 4px 14px rgba(102,126,234,0.5);}' +
                '.ab-chat-send:disabled{opacity:0.4;cursor:not-allowed;}' +
                '.ab-chat-send .material-icons{font-size:1.2em;}' +
                '.ab-chat-counter{font-size:0.7em;color:rgba(255,255,255,0.4);text-align:right;padding:0 1em 0.3em;margin-top:-0.15em;}' +
                '.ab-chat-counter.near{color:#f59e0b;}' +
                '.ab-chat-counter.over{color:#ef4444;}' +
                '.ab-chat-error{font-size:0.78em;color:#ef4444;padding:0 1em 0.4em;}' +
                '.ab-fd-act.chat{color:#a5b4ff;background:rgba(102,126,234,0.12);}' +
                '.ab-fd-act.chat:hover{background:rgba(102,126,234,0.25);color:#fff;transform:scale(1.05);}' +
                '.ab-fd-act.chat:active{transform:scale(0.95);}' +

                // Per-friend unread — a small pulsing dot attached to the
                // chat button, not an inline text blob next to the name.
                '.ab-fd-act.chat.has-unread::after{content:"";position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 2px rgba(10,12,18,0.92);animation:abUnreadPulse 2s infinite;}' +
                '.ab-fd-act.chat{position:relative;}' +
                '@keyframes abUnreadPulse{0%,100%{box-shadow:0 0 0 2px rgba(10,12,18,0.92),0 0 0 0 rgba(239,68,68,0.7);}50%{box-shadow:0 0 0 2px rgba(10,12,18,0.92),0 0 0 6px rgba(239,68,68,0);}}' +

                // ── Messages tab (conversations list) ──────────────────────
                '#abFriendsPaneMessages{padding:0.5em 0;}' +
                '.ab-msg-thread{display:flex;gap:0.75em;padding:0.7em 0.9em;cursor:pointer;border-radius:10px;margin:0 0.4em;transition:background 0.12s;}' +
                '.ab-msg-thread:hover{background:rgba(255,255,255,0.04);}' +
                '.ab-msg-thread .ab-fd-avatar{width:44px;height:44px;font-size:0.9em;flex-shrink:0;}' +
                '.ab-msg-thread-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:0.15em;}' +
                '.ab-msg-thread-top{display:flex;justify-content:space-between;align-items:baseline;gap:0.5em;}' +
                '.ab-msg-thread-name{font-weight:700;color:#fff;font-size:0.95em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
                '.ab-msg-thread-time{font-size:0.7em;color:rgba(255,255,255,0.45);white-space:nowrap;flex-shrink:0;}' +
                '.ab-msg-thread-preview{display:flex;justify-content:space-between;align-items:center;gap:0.5em;}' +
                '.ab-msg-thread-last{font-size:0.82em;color:rgba(255,255,255,0.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;}' +
                '.ab-msg-thread-last.unread{color:#fff;font-weight:600;}' +
                '.ab-msg-thread-last .me-prefix{color:rgba(255,255,255,0.4);margin-right:0.25em;}' +
                '.ab-msg-thread-unread{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:0.7em;font-weight:800;padding:2px 7px;border-radius:10px;min-width:20px;text-align:center;flex-shrink:0;box-shadow:0 2px 6px rgba(59,130,246,0.3);}' +

                // ── Chat header gear menu + message actions ──────────────
                '.ab-chat-gear{width:32px;height:32px;border-radius:10px;border:none;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.12s,color 0.12s;flex-shrink:0;margin-left:auto;}' +
                '.ab-chat-gear:hover{background:rgba(255,255,255,0.12);color:#fff;}' +
                '.ab-chat-gear .material-icons{font-size:1.15em;}' +
                '.ab-chat-menu{position:absolute;top:56px;right:14px;background:#20263a;border:1px solid rgba(255,255,255,0.1);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.45);z-index:10;display:none;flex-direction:column;min-width:200px;overflow:hidden;}' +
                '.ab-chat-menu.open{display:flex;animation:abMenuIn 0.14s ease-out;}' +
                '@keyframes abMenuIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:none;}}' +
                '.ab-chat-menu-item{padding:0.7em 0.9em;cursor:pointer;font-size:0.87em;color:rgba(255,255,255,0.85);display:flex;align-items:center;gap:0.7em;transition:background 0.1s;border:none;background:none;text-align:left;width:100%;}' +
                '.ab-chat-menu-item:hover{background:rgba(255,255,255,0.06);}' +
                '.ab-chat-menu-item.danger{color:#f87171;}' +
                '.ab-chat-menu-item.danger:hover{background:rgba(239,68,68,0.14);color:#fca5a5;}' +
                '.ab-chat-menu-item .material-icons{font-size:1.05em;}' +
                '.ab-chat-menu-sep{height:1px;background:rgba(255,255,255,0.08);margin:2px 0;}' +

                // Hover actions on your own messages (edit / delete)
                '.ab-chat-msg.me{position:relative;}' +
                '.ab-chat-msg-actions{position:absolute;top:-8px;left:-44px;display:none;gap:2px;}' +
                '.ab-chat-msg.me:hover .ab-chat-msg-actions{display:flex;}' +
                '.ab-chat-msg-action{width:26px;height:26px;border-radius:50%;border:none;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.1s,color 0.1s;}' +
                '.ab-chat-msg-action:hover{background:rgba(255,255,255,0.2);color:#fff;}' +
                '.ab-chat-msg-action.danger:hover{background:rgba(239,68,68,0.25);color:#fca5a5;}' +
                '.ab-chat-msg-action .material-icons{font-size:0.8em;}' +
                '.ab-chat-msg .edited{opacity:0.6;font-style:italic;margin-left:0.3em;font-size:0.95em;}' +
                '.ab-chat-msg.me .ab-read-mark{color:rgba(255,255,255,0.7);font-size:0.95em;margin-left:0.3em;vertical-align:middle;}' +

                // In-chat edit input overlay
                '.ab-chat-edit-input{display:block;width:100%;box-sizing:border-box;padding:0.35em 0.55em;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:#fff;font-family:inherit;font-size:1em;resize:vertical;min-height:2.2em;margin-top:0.35em;}' +
                '.ab-chat-edit-row{display:flex;gap:0.3em;justify-content:flex-end;margin-top:0.3em;}' +
                '.ab-chat-edit-btn{border:none;background:rgba(255,255,255,0.12);color:#fff;border-radius:6px;padding:0.25em 0.7em;font-size:0.78em;cursor:pointer;}' +
                '.ab-chat-edit-btn.primary{background:linear-gradient(135deg,#667eea,#764ba2);}' +
                '.ab-chat-edit-btn:hover{filter:brightness(1.15);}' +

                // Toast (for message received, block confirm, etc)
                '#abMsgToast{position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#1e293b,#334155);color:#fff;padding:0.8em 1.1em;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);z-index:10000000;max-width:340px;cursor:pointer;transform:translateX(380px);transition:transform 0.3s cubic-bezier(.22,.9,.3,1);display:flex;gap:0.6em;align-items:flex-start;font-family:inherit;}' +
                '#abMsgToast.show{transform:translateX(0);}' +
                '#abMsgToast .ab-toast-ico{color:#a5b4ff;font-size:1.4em;flex-shrink:0;}' +
                '#abMsgToast .ab-toast-body{flex:1;min-width:0;}' +
                '#abMsgToast .ab-toast-title{font-weight:700;font-size:0.88em;margin-bottom:0.15em;}' +
                '#abMsgToast .ab-toast-text{font-size:0.82em;color:rgba(255,255,255,0.75);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +

                // Confirm overlay (Clear / Block)
                '#abMsgConfirm{position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:10000001;display:none;align-items:center;justify-content:center;padding:1em;}' +
                '#abMsgConfirm.open{display:flex;animation:abConfirmIn 0.15s ease-out;}' +
                '@keyframes abConfirmIn{from{opacity:0;}to{opacity:1;}}' +
                '.ab-confirm-box{background:#1a1f2e;border-radius:14px;padding:1.4em;max-width:360px;width:100%;border:1px solid rgba(255,255,255,0.1);box-shadow:0 20px 50px rgba(0,0,0,0.5);}' +
                '.ab-confirm-title{font-size:1.05em;font-weight:700;color:#fff;margin:0 0 0.4em;}' +
                '.ab-confirm-body{color:rgba(255,255,255,0.65);font-size:0.88em;line-height:1.5;margin:0 0 1em;}' +
                '.ab-confirm-actions{display:flex;justify-content:flex-end;gap:0.5em;}' +
                '.ab-confirm-btn{border:none;cursor:pointer;padding:0.55em 1em;border-radius:8px;font-size:0.85em;font-weight:600;font-family:inherit;transition:filter 0.1s;}' +
                '.ab-confirm-btn.ghost{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}' +
                '.ab-confirm-btn.danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;}' +
                '.ab-confirm-btn:hover{filter:brightness(1.1);}' +

                // ── v1.8.2 additions ──────────────────────────────────
                // Author name on group-chat "them" bubbles
                '.ab-chat-msg.them .ab-chat-author{font-size:0.7em;color:#a5b4ff;font-weight:700;margin-bottom:0.2em;}' +
                // Receipts (single = delivered/gray, double = read/blue)
                '.ab-receipt{margin-left:0.3em;font-weight:800;letter-spacing:-0.5px;}' +
                '.ab-receipt.delivered{color:rgba(255,255,255,0.45);}' +
                '.ab-receipt.read{color:#60a5fa;}' +
                '.ab-chat-msg.me{padding-bottom:0.4em;}' +
                '.ab-chat-msg.me .ab-chat-text{margin:0;}' +
                '.ab-chat-msg.them .ab-chat-text{margin:0;}' +
                // Reposition the edit/delete actions ABOVE the bubble, centered
                '.ab-chat-msg-actions{position:absolute;top:-14px;right:6px;left:auto;display:none;gap:4px;background:rgba(15,17,25,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:2px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:2;}' +
                '.ab-chat-msg.me:hover .ab-chat-msg-actions{display:flex;}' +
                '.ab-chat-msg-action{width:22px;height:22px;border-radius:50%;border:none;background:transparent;color:rgba(255,255,255,0.75);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:background 0.1s,color 0.1s;}' +
                '.ab-chat-msg-action:hover{background:rgba(255,255,255,0.15);color:#fff;}' +
                '.ab-chat-msg-action.danger:hover{background:rgba(239,68,68,0.25);color:#fca5a5;}' +
                '.ab-chat-msg-action .material-icons{font-size:0.78em;line-height:1;}' +
                // Attachments in bubbles
                '.ab-chat-attachment{margin:0 -0.25em;margin-bottom:0.3em;border-radius:12px;overflow:hidden;max-width:260px;cursor:pointer;}' +
                '.ab-chat-attachment img{display:block;width:100%;height:auto;max-height:300px;object-fit:cover;}' +
                '.ab-chat-msg.img-only{background:transparent!important;box-shadow:none!important;padding:0!important;}' +
                '.ab-chat-msg.img-only .ab-chat-time{padding-top:0.25em;padding-left:0.25em;}' +
                // Attachment button + preview row above input
                '.ab-chat-attach-btn{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);cursor:pointer;flex-shrink:0;transition:background 0.1s,color 0.1s;}' +
                '.ab-chat-attach-btn:hover{background:rgba(255,255,255,0.14);color:#fff;}' +
                '.ab-chat-attach-btn .material-icons{font-size:1.15em;}' +
                '#abChatAttachPreview{display:flex;align-items:center;gap:0.5em;padding:0 1em 0.5em;}' +
                '#abChatAttachPreview img{width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.12);}' +
                '#abChatAttachPreview button{width:24px;height:24px;border-radius:50%;border:none;background:rgba(239,68,68,0.18);color:#fca5a5;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}' +
                '#abChatAttachPreview button:hover{background:rgba(239,68,68,0.32);color:#fff;}' +
                '#abChatAttachPreview button .material-icons{font-size:0.8em;}' +

                // Messages-tab header (new-group button)
                '.ab-msg-tab-header{padding:0.5em 0.9em;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:0.3em;}' +
                '.ab-msg-newgroup{display:inline-flex;align-items:center;gap:0.4em;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;border:none;padding:0.5em 1em;border-radius:20px;cursor:pointer;font-size:0.82em;font-weight:600;transition:filter 0.1s,transform 0.1s;font-family:inherit;}' +
                '.ab-msg-newgroup:hover{filter:brightness(1.1);transform:translateY(-1px);}' +
                '.ab-msg-newgroup .material-icons{font-size:1em;}' +

                // New-group overlay
                '#abNewGroupOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:10000001;display:none;align-items:center;justify-content:center;padding:1em;opacity:0;transition:opacity 0.15s;}' +
                '#abNewGroupOverlay.open{display:flex;opacity:1;}' +
                '.ab-newgroup-box{background:#1a1f2e;border-radius:14px;padding:1.4em;max-width:420px;width:100%;max-height:85vh;display:flex;flex-direction:column;gap:0.8em;border:1px solid rgba(255,255,255,0.1);box-shadow:0 20px 50px rgba(0,0,0,0.5);}' +
                '.ab-newgroup-box h3{margin:0;color:#fff;font-size:1.1em;}' +
                '#abNewGroupName{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:0.6em 0.9em;border-radius:10px;font-size:0.9em;font-family:inherit;outline:none;}' +
                '#abNewGroupName:focus{border-color:rgba(102,126,234,0.6);}' +
                '.ab-newgroup-hint{color:rgba(255,255,255,0.55);font-size:0.8em;}' +
                '.ab-newgroup-list{flex:1;overflow-y:auto;max-height:260px;display:flex;flex-direction:column;gap:0.2em;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:0.4em;}' +
                '.ab-newgroup-row{display:flex;align-items:center;gap:0.7em;padding:0.5em 0.6em;border-radius:8px;cursor:pointer;transition:background 0.1s;}' +
                '.ab-newgroup-row:hover{background:rgba(255,255,255,0.04);}' +
                '.ab-newgroup-row input{accent-color:#667eea;width:16px;height:16px;}' +
                '.ab-newgroup-row .ab-fd-avatar{width:32px;height:32px;font-size:0.72em;}' +
                '.ab-newgroup-row span{flex:1;color:#fff;font-size:0.88em;}' +
                '.ab-confirm-btn.primary{background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;}' +

                // Image lightbox
                '#abImgLightbox{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000002;display:flex;align-items:center;justify-content:center;padding:2em;cursor:zoom-out;animation:abLightboxIn 0.15s ease-out;}' +
                '@keyframes abLightboxIn{from{opacity:0;}to{opacity:1;}}' +
                '#abImgLightbox img{max-width:100%;max-height:100%;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.6);}' +

                // Toast — reposition to TOP-CENTER (was bottom-right) per feedback
                '#abMsgToast{position:fixed;top:24px;left:50%;right:auto;bottom:auto;transform:translateX(-50%) translateY(-100px);max-width:360px;min-width:260px;}' +
                '#abMsgToast.show{transform:translateX(-50%) translateY(0);}';
            (document.head || document.documentElement).appendChild(fst);
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'abFriendsBtn';
        btn.dataset.abVer = AB_SIDEBAR_VER;
        btn.title = tr('friends.title', 'Friends');
        btn.innerHTML = '<span class="material-icons">groups</span><span id="abFriendsBadge"></span>';
        document.body.appendChild(btn);

        var backdrop = document.createElement('div');
        backdrop.id = 'abFriendsBackdrop';
        backdrop.dataset.abVer = AB_SIDEBAR_VER;
        document.body.appendChild(backdrop);

        var drawer = document.createElement('div');
        drawer.id = 'abFriendsDrawer';
        drawer.dataset.abVer = AB_SIDEBAR_VER;
        drawer.innerHTML =
            '<div class="ab-fd-header">' +
                '<span class="ab-fd-ico"><span class="material-icons" style="font-size:1em;">groups</span></span>' +
                '<div class="ab-fd-title">' + tr('friends.title', 'Friends') + '</div>' +
                '<button type="button" class="ab-fd-close" id="abFriendsClose"><span class="material-icons" style="font-size:1em;">close</span></button>' +
            '</div>' +
            '<div class="ab-fd-tabs">' +
                '<button type="button" class="ab-fd-tab active" data-ab-fdtab="friends">' + tr('friends.tab_friends', 'Friends') + '</button>' +
                '<button type="button" class="ab-fd-tab" data-ab-fdtab="messages">' + tr('friends.tab_messages', 'Messages') + '<span id="abMsgsTabBadge" style="display:none;"></span></button>' +
                // Always render the Requests + Find tabs but mark them so
                // simple mode can toggle their visibility without having
                // to rebuild the drawer.
                '<button type="button" class="ab-fd-tab" data-ab-fdtab="requests" data-ab-hide-in-simple' + (_friendsSimpleMode ? ' style="display:none;"' : '') + '>' + tr('friends.tab_requests', 'Requests') + '<span id="abFriendsIncBadge" style="display:none;"></span></button>' +
                '<button type="button" class="ab-fd-tab" data-ab-fdtab="find" data-ab-hide-in-simple' + (_friendsSimpleMode ? ' style="display:none;"' : '') + '>' + tr('friends.tab_find', 'Find') + '</button>' +
            '</div>' +
            '<div class="ab-fd-body" style="position:relative;">' +
                '<div id="abFriendsPaneFriends"></div>' +
                '<div id="abFriendsPaneMessages" style="display:none;"></div>' +
                '<div id="abFriendsPaneRequests" style="display:none;"></div>' +
                '<div id="abFriendsPaneFind" style="display:none;">' +
                    '<input type="search" id="abFriendsSearch" class="ab-fd-search" placeholder="' + tr('friends.search_placeholder', 'Search users...') + '">' +
                    '<div id="abFriendsSearchResults"></div>' +
                '</div>' +
                // Slide-over chat pane. Lives inside the drawer body so it
                // animates in from the right, leaving the drawer shell (title
                // bar, tabs) untouched — consistent with the Xbox Guide pattern.
                '<div id="abFriendsChatPane">' +
                    '<div class="ab-chat-header">' +
                        '<button type="button" class="ab-chat-back" id="abChatBack" title="'+tr('friends.back','Back')+'"><span class="material-icons">arrow_back</span></button>' +
                        '<div class="ab-chat-avatar" id="abChatAvatar"></div>' +
                        '<div class="ab-chat-peer">' +
                            '<div class="ab-chat-peer-name" id="abChatPeerName"></div>' +
                            '<div class="ab-chat-peer-status" id="abChatPeerStatus"></div>' +
                        '</div>' +
                        '<button type="button" class="ab-chat-gear" id="abChatGear" title="'+tr('friends.chat_options','Chat options')+'"><span class="material-icons">more_vert</span></button>' +
                    '</div>' +
                    '<div class="ab-chat-menu" id="abChatMenu">' +
                        '<button type="button" class="ab-chat-menu-item" id="abChatClear"><span class="material-icons">delete_sweep</span><span>'+tr('friends.clear_chat','Clear conversation')+'</span></button>' +
                        '<button type="button" class="ab-chat-menu-item" id="abChatMute"><span class="material-icons">notifications_off</span><span id="abChatMuteLabel">'+tr('friends.mute','Mute notifications')+'</span></button>' +
                        '<button type="button" class="ab-chat-menu-item" id="abChatRename" style="display:none;"><span class="material-icons">edit</span><span>'+tr('friends.rename_group','Rename group')+'</span></button>' +
                        '<button type="button" class="ab-chat-menu-item" id="abChatLeave" style="display:none;"><span class="material-icons">logout</span><span>'+tr('friends.leave_group','Leave group')+'</span></button>' +
                        '<div class="ab-chat-menu-sep"></div>' +
                        '<button type="button" class="ab-chat-menu-item danger" id="abChatBlock"><span class="material-icons">block</span><span>'+tr('friends.block','Block user')+'</span></button>' +
                    '</div>' +
                    '<div class="ab-chat-scroll" id="abChatScroll"></div>' +
                    '<div class="ab-chat-error" id="abChatError" style="display:none;"></div>' +
                    '<div class="ab-chat-counter" id="abChatCounter"></div>' +
                    '<div id="abChatAttachPreview" style="display:none;">' +
                        '<img id="abChatAttachPreviewImg" alt="attachment preview" />' +
                        '<button type="button" id="abChatAttachClear" title="'+tr('friends.remove_attachment','Remove')+'"><span class="material-icons">close</span></button>' +
                    '</div>' +
                    '<div class="ab-chat-input-row">' +
                        '<label class="ab-chat-attach-btn" title="'+tr('friends.attach_image','Attach image')+'">' +
                            '<span class="material-icons">add_photo_alternate</span>' +
                            '<input type="file" id="abChatAttachInput" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none" />' +
                        '</label>' +
                        '<textarea class="ab-chat-input" id="abChatInput" rows="1" maxlength="1000" placeholder="'+tr('friends.message_placeholder','Message...')+'"></textarea>' +
                        '<button type="button" class="ab-chat-send" id="abChatSend" disabled title="'+tr('friends.send','Send')+'"><span class="material-icons">send</span></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(drawer);
        // Apply simple-mode class immediately on mount so the Requests/
        // Find tabs are hidden from the very first drawer render.
        if (_friendsSimpleMode) drawer.classList.add('ab-fd-drawer-simple');

        function open(){
            _friendsOpen = true;
            // Re-assert simple-mode class on every open so it survives
            // any external DOM mutation (Jellyfin themes etc).
            drawer.classList.toggle('ab-fd-drawer-simple', !!_friendsSimpleMode);
            backdrop.style.display='block';
            drawer.style.display='flex';
            void drawer.offsetHeight;
            backdrop.style.opacity='1';
            drawer.style.transform='translateX(0)';
            loadFriends();
            bindChatPaneControls();
            refreshUnreadCounts();
            maybeRequestNotifPerm();
        }
        function close(){
            _friendsOpen = false;
            // Collapse any open chat pane too so reopening the drawer
            // starts clean on the friends list.
            if (_chatOpen) closeChatPane();
            backdrop.style.opacity='0';
            // Slide out in the direction matching the drawer's anchor so the
            // animation makes sense whether we're on the left or right side.
            var dir = drawer.dataset.abSlideDir === 'right' ? 'translateX(100%)' : 'translateX(-100%)';
            drawer.style.transform = dir;
            setTimeout(function(){ drawer.style.display='none'; backdrop.style.display='none'; }, 280);
        }

        btn.addEventListener('click', open);
        backdrop.addEventListener('click', close);
        drawer.querySelector('#abFriendsClose').addEventListener('click', close);

        drawer.querySelectorAll('[data-ab-fdtab]').forEach(function(b){
            b.addEventListener('click', function(){
                var which = b.getAttribute('data-ab-fdtab');
                _activeFdTab = which;
                document.getElementById('abFriendsPaneFriends').style.display = which==='friends'?'':'none';
                document.getElementById('abFriendsPaneMessages').style.display = which==='messages'?'':'none';
                document.getElementById('abFriendsPaneRequests').style.display = which==='requests'?'':'none';
                document.getElementById('abFriendsPaneFind').style.display = which==='find'?'':'none';
                drawer.querySelectorAll('[data-ab-fdtab]').forEach(function(bb){ bb.classList.toggle('active', bb===b); });
                if (which === 'find') {
                    var inp = document.getElementById('abFriendsSearch');
                    if (inp) setTimeout(function(){ inp.focus(); }, 60);
                }
                if (which === 'messages') {
                    loadMessagesPane();
                    if (_chatMsgsPollTimer) clearInterval(_chatMsgsPollTimer);
                    _chatMsgsPollTimer = setInterval(loadMessagesPane, 8000);
                } else {
                    if (_chatMsgsPollTimer) { clearInterval(_chatMsgsPollTimer); _chatMsgsPollTimer = null; }
                }
            });
        });

        var searchInput = drawer.querySelector('#abFriendsSearch');
        var searchTimer = null;
        searchInput.addEventListener('input', function(){
            if (searchTimer) clearTimeout(searchTimer);
            searchTimer = setTimeout(function(){ renderFriendSearch(searchInput.value || ''); }, 150);
        });

        // Poll the unread badge every 30s.
        refreshFriendsBadge();
        setInterval(refreshFriendsBadge, 30000);

        // Hide the floating button on /dashboard (admin config pages — the
        // page layout gets cramped + Jellyfin already has its own floating
        // controls there) and during media playback (video player should
        // own the screen). Restore as soon as we leave either state.
        function shouldHideFriendsBtn(){
            try {
                var hash = (window.location.hash || '').toLowerCase();
                var pathname = (window.location.pathname || '').toLowerCase();
                var combined = pathname + ' ' + hash;
                // Admin / config panels — Jellyfin uses a mix of hash + pathname
                // routes for these. Match any of them.
                if (combined.indexOf('/dashboard') >= 0) return true;
                if (combined.indexOf('/plugins') >= 0) return true;
                if (combined.indexOf('/configurationpage') >= 0) return true;
                if (combined.indexOf('/settings') >= 0) return true;
                if (combined.indexOf('/mypreferences') >= 0) return true;
                // Playback: look for a visible <video> OR the Jellyfin
                // nowplayingbar / videoOsd elements.
                var vids = document.getElementsByTagName('video');
                for (var i = 0; i < vids.length; i++) {
                    var v = vids[i];
                    if (!v) continue;
                    if (v.offsetParent === null) continue; // hidden
                    if (!v.paused && !v.ended && v.readyState > 2) return true;
                    // Still show button if video is paused on a non-playback
                    // page — e.g. a trailer preview on the details page.
                }
                // Jellyfin adds class "videoPlayer" or "noHeaderRight" to
                // body during fullscreen playback.
                if (document.body && document.body.classList) {
                    if (document.body.classList.contains('playingVideo')) return true;
                    if (document.body.classList.contains('transparentDocument')) return true;
                }
                return false;
            } catch(e) { return false; }
        }
        function syncFriendsBtnVisibility(){
            var btnEl = document.getElementById('abFriendsBtn');
            if (!btnEl) return;
            // Show ONLY when admin has friends enabled AND we're not on a
            // dashboard/admin page AND not in media playback.
            var hide = !_friendsAdminEnabled || shouldHideFriendsBtn();
            btnEl.style.display = hide ? 'none' : 'flex';
            // Also close the drawer if it happens to be open when we enter
            // a hide-state (e.g. user clicked Play while drawer was open).
            if (hide && _friendsOpen) {
                try { close(); } catch(e) {}
            }
        }
        // Expose for the admin-reconcile loop above so it can re-sync
        // visibility after a FriendsEnabled flip without duplicating logic.
        window.__abSyncFriendsBtnVisibility = syncFriendsBtnVisibility;
        // Run on hash change + every 500ms for playback state changes.
        try { window.addEventListener('hashchange', syncFriendsBtnVisibility); } catch(e) {}
        setInterval(syncFriendsBtnVisibility, 500);
        syncFriendsBtnVisibility();
    }

    function initials(name){
        var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }

    // Build an avatar style string: Jellyfin primary image URL if we have
    // a user id, otherwise empty (the avatar div falls back to the gradient +
    // initials). Uses apiClient.getUserImageUrl when present so reverse-proxy
    // subpaths work; otherwise a best-effort /Users/{id}/Images/Primary.
    function avatarStyle(userId){
        if (!userId) return '';
        try {
            var api = getApi();
            var url = null;
            if (api && typeof api.getUserImageUrl === 'function') {
                url = api.getUserImageUrl(userId, { type: 'Primary', maxHeight: 80, quality: 90 });
            } else if (api && typeof api.getUrl === 'function') {
                url = api.getUrl('Users/' + userId + '/Images/Primary?maxHeight=80&quality=90');
            }
            if (url) {
                return 'background-image:url(\'' + url.replace(/'/g, '%27') + '\');';
            }
        } catch(e) {}
        return '';
    }

    function refreshFriendsBadge(){
        var uid = getUserId(); if (!uid) return;
        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/friends'), { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(data){
                var inc = (data && data.Incoming) ? data.Incoming.length : 0;
                var b = document.getElementById('abFriendsBadge');
                if (b) { b.textContent = inc > 99 ? '99+' : String(inc); b.style.display = inc > 0 ? 'flex' : 'none'; }
                var inb = document.getElementById('abFriendsIncBadge');
                if (inb) { inb.textContent = inc > 99 ? '99+' : String(inc); inb.style.display = inc > 0 ? 'inline-flex' : 'none'; }
            }).catch(function(){});
    }

    function loadFriends(){
        var uid = getUserId(); if (!uid) return;
        var fBox = document.getElementById('abFriendsPaneFriends');
        var rBox = document.getElementById('abFriendsPaneRequests');
        if (!fBox || !rBox) return;
        fBox.innerHTML = '<div class="ab-fd-empty"><span class="material-icons">hourglass_empty</span><div>' + tr('common.loading', 'Loading...') + '</div></div>';
        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/friends'), { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(data){
                data = data || { Friends: [], Incoming: [], Outgoing: [] };
                var friends = data.Friends || [];
                var incoming = data.Incoming || [];
                var outgoing = data.Outgoing || [];
                // Server-side flag echoed back for parity — the client cache
                // is updated in the periodic resolver, but honour whichever
                // is more authoritative here.
                var simple = (data.SimpleMode === true) || _friendsSimpleMode;

                if (!friends.length) {
                    var emptyMsg = simple
                        ? tr('friends.simple_empty', 'No other users on this server.')
                        : tr('friends.empty', "You haven't added any friends yet.");
                    fBox.innerHTML = '<div class="ab-fd-empty"><span class="material-icons">people_outline</span><div>' + emptyMsg + '</div></div>';
                } else {
                    fBox.innerHTML = friends.map(function(f){
                        var status = f.Online
                            ? (f.NowPlaying && f.NowPlaying.Name
                                ? tr('friends.watching_prefix', 'Watching') + ' <strong>' + escapeHtml(f.NowPlaying.SeriesName ? (f.NowPlaying.SeriesName + (f.NowPlaying.Name ? ' — ' + f.NowPlaying.Name : '')) : f.NowPlaying.Name) + '</strong>'
                                : tr('friends.online', 'Online'))
                            : (f.LastSeen ? tr('friends.last_seen', 'Last seen') + ' ' + new Date(f.LastSeen).toLocaleString() : tr('friends.offline', 'Offline'));
                        var av = avatarStyle(f.UserId);
                        var initialsHtml = av ? '' : escapeHtml(initials(f.UserName));
                        // In simple mode there's no friendship to remove —
                        // the row is just a live user card.
                        // Unread count for this friend. We now show it as a
                        // subtle pulsing dot ON the chat button rather than
                        // a big red text blob in the name, per the 1.8.1
                        // feedback that the old placement looked wrong.
                        var unreadN = (_friendUnread && _friendUnread[String(f.UserId).toLowerCase().replace(/-/g,'')]) || 0;
                        var chatClass = 'ab-fd-act chat' + (unreadN > 0 ? ' has-unread' : '');
                        var chatTitle = unreadN > 0
                            ? tr('friends.message_with_unread', 'Message') + ' (' + unreadN + ' ' + tr('friends.unread', 'unread') + ')'
                            : tr('friends.message','Message');
                        var chatBtnHtml = '<button type="button" class="' + chatClass + '" data-ab-chat-open="' + escapeHtml(f.UserId) + '" data-ab-chat-name="' + escapeHtml(f.UserName) + '" data-ab-chat-online="' + (f.Online ? '1' : '0') + '" title="'+escapeHtml(chatTitle)+'"><span class="material-icons">mail_outline</span></button>';
                        var removeBtnHtml = simple
                            ? ''
                            : '<button type="button" class="ab-fd-act decline" data-ab-friend-remove="' + escapeHtml(f.UserId) + '" title="'+tr('friends.remove','Remove')+'"><span class="material-icons">person_remove</span></button>';
                        var actionsHtml = '<div class="ab-fd-actions">' + chatBtnHtml + removeBtnHtml + '</div>';
                        return '<div class="ab-fd-row">' +
                            '<div class="ab-fd-avatar'+(f.Online?' online':'')+'" style="' + av + '">' + initialsHtml + '</div>' +
                            '<div class="ab-fd-info">' +
                                '<div class="ab-fd-name">' + escapeHtml(f.UserName) + '</div>' +
                                '<div class="ab-fd-status'+(f.Online?' online':'')+'">' + status + '</div>' +
                                (f.Equipped && f.Equipped.length ? '<div style="margin-top:0.35em;">' + renderEquippedDots(f.Equipped, 16) + '</div>' : '') +
                            '</div>' +
                            actionsHtml +
                        '</div>';
                    }).join('');
                }

                var rHtml = '';
                // Compact request rows — icon-only accept/decline buttons so
                // the row doesn't visually bloat with two full-text buttons.
                if (incoming.length){
                    rHtml += '<div class="ab-fd-section">' + tr('friends.incoming', 'Incoming requests') + '</div>';
                    rHtml += incoming.map(function(r){
                        var av = avatarStyle(r.UserId);
                        var initialsHtml = av ? '' : escapeHtml(initials(r.UserName));
                        return '<div class="ab-fd-row">' +
                            '<div class="ab-fd-avatar" style="' + av + '">' + initialsHtml + '</div>' +
                            '<div class="ab-fd-info"><div class="ab-fd-name">' + escapeHtml(r.UserName) + '</div><div class="ab-fd-status">' + tr('friends.wants_to_be_friends', 'Wants to be friends') + '</div></div>' +
                            '<div class="ab-fd-actions">' +
                                '<button type="button" class="ab-fd-act accept" data-ab-friend-accept="' + escapeHtml(r.UserId) + '" title="'+tr('friends.accept','Accept')+'"><span class="material-icons">check</span></button>' +
                                '<button type="button" class="ab-fd-act decline" data-ab-friend-remove="' + escapeHtml(r.UserId) + '" title="'+tr('friends.decline','Decline')+'"><span class="material-icons">close</span></button>' +
                            '</div>' +
                        '</div>';
                    }).join('');
                }
                if (outgoing.length){
                    rHtml += '<div class="ab-fd-section">' + tr('friends.outgoing', 'Sent requests') + '</div>';
                    rHtml += outgoing.map(function(r){
                        var av = avatarStyle(r.UserId);
                        var initialsHtml = av ? '' : escapeHtml(initials(r.UserName));
                        return '<div class="ab-fd-row">' +
                            '<div class="ab-fd-avatar" style="' + av + '">' + initialsHtml + '</div>' +
                            '<div class="ab-fd-info"><div class="ab-fd-name">' + escapeHtml(r.UserName) + '</div><div class="ab-fd-status">' + tr('friends.pending', 'Pending') + '</div></div>' +
                            '<div class="ab-fd-actions"><button type="button" class="ab-fd-act" data-ab-friend-remove="' + escapeHtml(r.UserId) + '" title="'+tr('friends.cancel','Cancel')+'"><span class="material-icons">close</span></button></div>' +
                        '</div>';
                    }).join('');
                }
                if (!rHtml) rHtml = '<div class="ab-fd-empty"><span class="material-icons">inbox</span><div>' + tr('friends.no_requests', 'No pending requests.') + '</div></div>';
                rBox.innerHTML = rHtml;

                var inb = document.getElementById('abFriendsIncBadge');
                if (inb) { inb.textContent = incoming.length > 99 ? '99+' : String(incoming.length); inb.style.display = incoming.length > 0 ? 'inline-flex' : 'none'; }
                var btnBadge = document.getElementById('abFriendsBadge');
                if (btnBadge) { btnBadge.textContent = incoming.length > 99 ? '99+' : String(incoming.length); btnBadge.style.display = incoming.length > 0 ? 'flex' : 'none'; }

                document.querySelectorAll('[data-ab-friend-accept]').forEach(function(btn){
                    btn.addEventListener('click', function(){
                        var fid = btn.getAttribute('data-ab-friend-accept');
                        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/friends/'+fid+'/accept'), { method:'POST', headers: authHeaders(), credentials: 'include' })
                            .then(function(){ loadFriends(); });
                    });
                });
                document.querySelectorAll('[data-ab-friend-remove]').forEach(function(btn){
                    btn.addEventListener('click', function(){
                        var fid = btn.getAttribute('data-ab-friend-remove');
                        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/friends/'+fid), { method:'DELETE', headers: authHeaders(), credentials: 'include' })
                            .then(function(){ loadFriends(); });
                    });
                });

                // Chat button on each friend row — opens the slide-over pane.
                document.querySelectorAll('[data-ab-chat-open]').forEach(function(btn){
                    btn.addEventListener('click', function(ev){
                        ev.stopPropagation();
                        openChatPane(
                            btn.getAttribute('data-ab-chat-open'),
                            btn.getAttribute('data-ab-chat-name'),
                            btn.getAttribute('data-ab-chat-online') === '1'
                        );
                    });
                });

                window.__abFriendIds = {};
                [friends, incoming, outgoing].forEach(function(arr){
                    arr.forEach(function(f){ window.__abFriendIds[String(f.UserId||'').toLowerCase().replace(/-/g,'')] = true; });
                });
            }).catch(function(){
                fBox.innerHTML = '<div class="ab-fd-empty"><span class="material-icons">error_outline</span><div>' + tr('friends.load_failed', 'Failed to load friends.') + '</div></div>';
            });
    }

    // ───────────────────────── Chat / messaging ─────────────────────────

    function chatApi(path, opts){
        var uid = getUserId();
        if (!uid) return Promise.resolve(null);
        return fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+path), Object.assign(
            { headers: authHeaders(), credentials: 'include' }, opts || {}))
            .then(function(r){ return r.ok ? r.json() : null; })
            .catch(function(){ return null; });
    }

    function formatChatTime(iso){
        try {
            var d = new Date(iso);
            var now = new Date();
            var sameDay = d.toDateString() === now.toDateString();
            if (sameDay) {
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            var yest = new Date(now); yest.setDate(yest.getDate() - 1);
            if (d.toDateString() === yest.toDateString()) {
                return tr('friends.yesterday', 'Yesterday') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return ''; }
    }

    function daySep(iso){
        try {
            var d = new Date(iso);
            var now = new Date();
            if (d.toDateString() === now.toDateString()) return tr('friends.today', 'Today');
            var yest = new Date(now); yest.setDate(yest.getDate() - 1);
            if (d.toDateString() === yest.toDateString()) return tr('friends.yesterday', 'Yesterday');
            return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
        } catch (e) { return ''; }
    }

    function renderChatMessages(msgs){
        var meId = (getUserId() || '').toLowerCase().replace(/-/g, '');
        var scroll = document.getElementById('abChatScroll');
        if (!scroll) return;

        // Skip redraw when content is unchanged — avoids the flicker the
        // user complained about. Hash includes id/text/edited/readers so
        // any real change still triggers a repaint.
        var hash = msgs && msgs.length
            ? msgs.map(function(m){ return (m.id||'') + '|' + (m.editedAt||'') + '|' + (m.readAt?'1':'0') + '|' + Object.keys(m.readBy || {}).length + '|' + (m.text||'').length; }).join('~')
            : 'empty';
        if (hash === _chatLastRenderHash && !scroll.querySelector('.ab-chat-edit-input')) return;
        _chatLastRenderHash = hash;

        if (!msgs || !msgs.length) {
            scroll.innerHTML =
                '<div class="ab-chat-empty"><span class="material-icons">forum</span>' +
                '<div>' + tr('friends.chat_empty', 'No messages yet. Say hi!') + '</div></div>';
            return;
        }

        // Work out the last "read by the other side" of each of my sent
        // messages. For DMs it's readAt; for groups it's "readBy has any
        // other participant". Only show the double-check on the LAST of my
        // read messages so the UI isn't noisy.
        var lastMyReadIdx = -1;
        for (var i = msgs.length - 1; i >= 0; i--) {
            var m = msgs[i];
            var fromMe = (m.fromUserId || '').toLowerCase().replace(/-/g, '') === meId;
            if (!fromMe) continue;
            var hasOtherReader = false;
            if (m.readBy) {
                for (var k in m.readBy) {
                    if (k.toLowerCase().replace(/-/g,'') !== meId) { hasOtherReader = true; break; }
                }
            }
            // Fallback to legacy readAt for pre-v1.8.2 messages
            if ((hasOtherReader || m.readAt) && lastMyReadIdx === -1) { lastMyReadIdx = i; break; }
        }

        var html = '';
        var lastDay = '';
        msgs.forEach(function(m, idx){
            var d = new Date(m.sentAt);
            var dayKey = d.toDateString();
            if (dayKey !== lastDay) {
                html += '<div class="ab-chat-daysep">' + escapeHtml(daySep(m.sentAt)) + '</div>';
                lastDay = dayKey;
            }
            var fromMe = (m.fromUserId || '').toLowerCase().replace(/-/g, '') === meId;
            var editedHtml = m.editedAt ? ' <span class="edited">(' + tr('friends.edited','edited') + ')</span>' : '';
            // Single check = delivered. Double check = read. Both blue when read.
            var receiptHtml = '';
            if (fromMe) {
                if (idx === lastMyReadIdx) {
                    receiptHtml = ' <span class="ab-receipt read" title="'+tr('friends.read','Read')+'">\u2713\u2713</span>';
                } else {
                    receiptHtml = ' <span class="ab-receipt delivered" title="'+tr('friends.delivered','Delivered')+'">\u2713</span>';
                }
            }
            var actionsHtml = fromMe
                ? '<div class="ab-chat-msg-actions">' +
                    '<button type="button" class="ab-chat-msg-action" data-ab-msg-edit="' + escapeHtml(m.id) + '" data-ab-msg-text="'+escapeHtml(m.text)+'" title="'+tr('friends.edit','Edit')+'"><span class="material-icons">edit</span></button>' +
                    '<button type="button" class="ab-chat-msg-action danger" data-ab-msg-delete="' + escapeHtml(m.id) + '" title="'+tr('friends.delete','Delete')+'"><span class="material-icons">delete</span></button>' +
                  '</div>'
                : '';
            // Author label for groups (non-me only)
            var authorHtml = (!fromMe && _chatConvType === 'group')
                ? '<div class="ab-chat-author">' + escapeHtml(m.fromUserName || '') + '</div>'
                : '';
            var attachmentHtml = '';
            if (m.attachmentId) {
                attachmentHtml = '<div class="ab-chat-attachment"><img src="' + escapeHtml(buildUrl('Plugins/AchievementBadges/attachments/' + m.attachmentId)) + '" loading="lazy" alt="attachment" /></div>';
            }
            var textHtml = m.text ? escapeHtml(m.text).replace(/\n/g, '<br>') : '';
            html += '<div class="ab-chat-msg ' + (fromMe ? 'me' : 'them') + (attachmentHtml && !textHtml ? ' img-only' : '') + '" data-msg-id="'+escapeHtml(m.id)+'">' +
                actionsHtml +
                authorHtml +
                attachmentHtml +
                (textHtml ? '<div class="ab-chat-text">' + textHtml + editedHtml + '</div>' : '') +
                '<span class="ab-chat-time">' + escapeHtml(formatChatTime(m.sentAt)) + receiptHtml + '</span>' +
            '</div>';
        });
        // Preserve scroll state: only auto-scroll if the user was already
        // near the bottom (within ~60px) when the redraw happened.
        var wasNearBottom = (scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight) < 80;
        scroll.innerHTML = html;
        scroll.querySelectorAll('[data-ab-msg-edit]').forEach(function(btn){
            btn.addEventListener('click', function(ev){
                ev.stopPropagation();
                startEditMessage(btn.getAttribute('data-ab-msg-edit'), btn.getAttribute('data-ab-msg-text'));
            });
        });
        scroll.querySelectorAll('[data-ab-msg-delete]').forEach(function(btn){
            btn.addEventListener('click', function(ev){
                ev.stopPropagation();
                confirmAndDeleteMessage(btn.getAttribute('data-ab-msg-delete'));
            });
        });
        scroll.querySelectorAll('.ab-chat-attachment img').forEach(function(img){
            img.addEventListener('click', function(){ openLightbox(img.getAttribute('src')); });
        });
        if (wasNearBottom) scroll.scrollTop = scroll.scrollHeight;
    }

    // Fullscreen image preview
    function openLightbox(src){
        var lb = document.createElement('div');
        lb.id = 'abImgLightbox';
        lb.innerHTML = '<img src="' + escapeHtml(src) + '" />';
        lb.addEventListener('click', function(){ if (lb.parentNode) lb.parentNode.removeChild(lb); });
        document.body.appendChild(lb);
    }

    // ── Message edit / delete ─────────────────────────────────────────

    function startEditMessage(messageId, currentText){
        var bubble = document.querySelector('.ab-chat-msg[data-msg-id="' + CSS.escape(messageId) + '"]');
        if (!bubble) return;
        if (bubble.querySelector('.ab-chat-edit-input')) return; // already editing
        // Hide original contents
        var originalHtml = bubble.innerHTML;
        bubble.innerHTML =
            '<textarea class="ab-chat-edit-input" maxlength="1000">' + escapeHtml(currentText) + '</textarea>' +
            '<div class="ab-chat-edit-row">' +
                '<button type="button" class="ab-chat-edit-btn" data-ab-cancel-edit>' + tr('friends.cancel','Cancel') + '</button>' +
                '<button type="button" class="ab-chat-edit-btn primary" data-ab-save-edit>' + tr('friends.save','Save') + '</button>' +
            '</div>';
        var ta = bubble.querySelector('.ab-chat-edit-input');
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
        ta.addEventListener('keydown', function(ev){
            if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); commit(); }
            else if (ev.key === 'Escape') { cancel(); }
        });
        bubble.querySelector('[data-ab-cancel-edit]').addEventListener('click', cancel);
        bubble.querySelector('[data-ab-save-edit]').addEventListener('click', commit);

        function cancel(){ bubble.innerHTML = originalHtml; }
        function commit(){
            var newText = (ta.value || '').trim();
            if (!newText) { cancel(); return; }
            if (newText === currentText) { cancel(); return; }
            var uid = getUserId();
            fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/messages/'+messageId), {
                method: 'PATCH',
                headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
                credentials: 'include',
                body: JSON.stringify({ Text: newText })
            })
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(res){
                if (res && res.Success) loadChatMessages();
                else if (res && res.Message) showChatError(res.Message);
                else cancel();
            })
            .catch(function(){ cancel(); });
        }
    }

    function confirmAndDeleteMessage(messageId){
        abConfirm(tr('friends.delete_msg_title', 'Delete message?'),
                  tr('friends.delete_msg_body', 'This message will be removed from the conversation for everyone.'),
                  tr('friends.delete','Delete'), function(){
            var uid = getUserId();
            fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/messages/by-id/'+messageId), {
                method: 'DELETE', headers: authHeaders(), credentials: 'include'
            }).then(function(){ loadChatMessages(); });
        });
    }

    function loadChatMessages(){
        if (!_chatOpen || !_chatConvId) return Promise.resolve();
        var uid = getUserId();
        return fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/conversations/'+_chatConvId+'/messages?limit=200'),
            { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(res){
                if (!_chatOpen || !_chatConvId) return;
                renderChatMessages((res && res.Messages) || []);
                // Clear per-peer unread + refresh badge
                if (_chatPeerId) {
                    var k = _chatPeerId.toLowerCase().replace(/-/g, '');
                    if (_friendUnread[k]) _friendUnread[k] = 0;
                }
            })
            .catch(function(){});
    }

    // Resolve a DM conversation for a friend (server auto-creates if missing)
    // then open the pane keyed by that conversationId.
    function openChatPane(peerId, peerName, peerOnline){
        _chatOpen = true;
        _chatPeerId = peerId;
        _chatConvType = 'dm';
        _chatParticipants = [];
        _chatPeerName = peerName;
        _chatPeerOnline = !!peerOnline;
        _chatLastRenderHash = '';
        _chatPendingAttachment = null;
        var uid = getUserId();
        // Hit legacy endpoint — server returns ConversationId
        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/messages/'+peerId),
            { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(res){
                _chatConvId = (res && res.ConversationId) || null;
                openChatPaneInner();
                if (res && res.Messages) renderChatMessages(res.Messages);
            });
    }

    // Open for an existing conversation (DM or group). For groups, pass
    // participants[] so we can show member list in the header.
    function openChatPaneForConversation(convId, title, type, participants, peerOnlineByUserId){
        _chatOpen = true;
        _chatConvId = convId;
        _chatConvType = type || 'dm';
        _chatParticipants = participants || [];
        _chatLastRenderHash = '';
        _chatPendingAttachment = null;
        if (_chatConvType === 'group') {
            _chatPeerId = null;
            _chatPeerName = title || _chatParticipants.map(function(p){ return p.userName; }).join(', ');
            _chatPeerOnline = false;
        } else {
            var other = (_chatParticipants && _chatParticipants[0]) || {};
            _chatPeerId = other.userId || null;
            _chatPeerName = other.userName || title || '';
            _chatPeerOnline = !!(peerOnlineByUserId && peerOnlineByUserId[(_chatPeerId||'').toLowerCase().replace(/-/g,'')]);
        }
        openChatPaneInner();
        loadChatMessages();
    }

    function openChatPaneInner(){
        var pane = document.getElementById('abFriendsChatPane');
        if (!pane) return;

        // Header
        var avEl = document.getElementById('abChatAvatar');
        if (avEl) {
            if (_chatConvType === 'group') {
                avEl.setAttribute('style', 'background:linear-gradient(135deg,#8b5cf6,#3b82f6);');
                avEl.className = 'ab-chat-avatar';
                avEl.innerHTML = '<span class="material-icons" style="font-size:1.1em;">group</span>';
            } else {
                var av = avatarStyle(_chatPeerId || '');
                avEl.setAttribute('style', av);
                avEl.className = 'ab-chat-avatar' + (_chatPeerOnline ? ' online' : '');
                avEl.textContent = av ? '' : initials(_chatPeerName || '');
            }
        }
        var nmEl = document.getElementById('abChatPeerName');
        if (nmEl) nmEl.textContent = _chatPeerName || '';
        var stEl = document.getElementById('abChatPeerStatus');
        if (stEl) {
            if (_chatConvType === 'group') {
                var n = _chatParticipants.length + 1;
                stEl.textContent = n + ' ' + tr('friends.members','members');
                stEl.className = 'ab-chat-peer-status';
            } else {
                stEl.textContent = _chatPeerOnline ? tr('friends.online', 'Online') : tr('friends.offline', 'Offline');
                stEl.className = 'ab-chat-peer-status' + (_chatPeerOnline ? ' online' : '');
            }
        }

        // Reset input state
        var input = document.getElementById('abChatInput');
        if (input) { input.value = ''; autoGrowChatInput(input); }
        updateChatCounter('');
        hideChatError();
        var send = document.getElementById('abChatSend');
        if (send) send.disabled = true;
        clearAttachmentPreview();

        var pane = document.getElementById('abFriendsChatPane');
        if (pane) { pane.style.display = 'flex'; void pane.offsetHeight; pane.classList.add('open'); }

        // Group chats don't have a single peer to mute, so swap the Mute
        // entry for something useful (leave group / rename).
        refreshMuteLabel();
        var menu = document.getElementById('abChatMenu');
        if (menu) {
            var muteItem = document.getElementById('abChatMute');
            if (muteItem) muteItem.style.display = (_chatConvType === 'group') ? 'none' : 'flex';
            var blockItem = document.getElementById('abChatBlock');
            if (blockItem) blockItem.style.display = (_chatConvType === 'group') ? 'none' : 'flex';
            var renameItem = document.getElementById('abChatRename');
            if (renameItem) renameItem.style.display = (_chatConvType === 'group') ? 'flex' : 'none';
            var leaveItem = document.getElementById('abChatLeave');
            if (leaveItem) leaveItem.style.display = (_chatConvType === 'group') ? 'flex' : 'none';
        }

        // Initial load + polling
        loadChatMessages();
        if (_chatPollTimer) clearInterval(_chatPollTimer);
        _chatPollTimer = setInterval(loadChatMessages, 6000);

        setTimeout(function(){
            var el = document.getElementById('abChatInput');
            if (el) el.focus();
        }, 260);
    }

    function closeChatPane(){
        _chatOpen = false;
        _chatPeerId = null;
        _chatConvId = null;
        _chatConvType = 'dm';
        _chatParticipants = [];
        if (_chatPollTimer) { clearInterval(_chatPollTimer); _chatPollTimer = null; }
        var pane = document.getElementById('abFriendsChatPane');
        if (!pane) return;
        pane.classList.remove('open');
        setTimeout(function(){ if (!_chatOpen) pane.style.display = 'none'; }, 280);
        if (typeof loadFriends === 'function') try { loadFriends(); } catch (e) {}
        // Also refresh the messages-tab list so last-message previews
        // reflect whatever the user just sent or read.
        if (_activeFdTab === 'messages') loadMessagesPane();
    }

    function showChatError(msg){
        var err = document.getElementById('abChatError');
        if (err) { err.textContent = msg; err.style.display = ''; }
    }
    function hideChatError(){
        var err = document.getElementById('abChatError');
        if (err) err.style.display = 'none';
    }

    function updateChatCounter(text){
        var el = document.getElementById('abChatCounter');
        if (!el) return;
        var n = (text || '').length;
        var max = 1000;
        if (n === 0) { el.textContent = ''; el.className = 'ab-chat-counter'; return; }
        el.textContent = n + ' / ' + max;
        el.className = 'ab-chat-counter' + (n >= max ? ' over' : (n > max * 0.9 ? ' near' : ''));
    }

    function autoGrowChatInput(el){
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(120, el.scrollHeight) + 'px';
    }

    function sendChatMessage(){
        if (!_chatOpen || !_chatConvId) return;
        var input = document.getElementById('abChatInput');
        if (!input) return;
        var text = (input.value || '').trim();
        var attachmentId = _chatPendingAttachment ? _chatPendingAttachment.Id : null;
        if (!text && !attachmentId) return;
        var send = document.getElementById('abChatSend');
        if (send) send.disabled = true;
        hideChatError();
        var uid = getUserId();
        if (!uid) return;
        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/conversations/'+_chatConvId+'/messages'), {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
            credentials: 'include',
            body: JSON.stringify({ Text: text, AttachmentId: attachmentId })
        })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(res){
            if (!res || !res.Success) {
                showChatError((res && res.Message) || tr('friends.send_failed', 'Could not send message.'));
                if (send) send.disabled = false;
                return;
            }
            input.value = '';
            autoGrowChatInput(input);
            updateChatCounter('');
            clearAttachmentPreview();
            _chatLastRenderHash = ''; // force redraw
            loadChatMessages();
        })
        .catch(function(){
            showChatError(tr('friends.send_failed', 'Could not send message.'));
            if (send) send.disabled = false;
        });
    }

    // ── Attachments ───────────────────────────────────────────────────

    function clearAttachmentPreview(){
        _chatPendingAttachment = null;
        var row = document.getElementById('abChatAttachPreview');
        if (row) row.style.display = 'none';
        var send = document.getElementById('abChatSend');
        if (send) {
            var input = document.getElementById('abChatInput');
            send.disabled = !(input && input.value.trim());
        }
    }

    function beginAttachmentUpload(file){
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            showChatError(tr('friends.file_too_big','File is too big (max 8MB).'));
            return;
        }
        if (['image/png','image/jpeg','image/gif','image/webp'].indexOf(file.type) === -1) {
            showChatError(tr('friends.unsupported_file','Only PNG / JPG / GIF / WEBP supported.'));
            return;
        }
        hideChatError();
        var uid = getUserId(); if (!uid) return;
        var fd = new FormData();
        fd.append('file', file);
        // Show temp preview
        var preview = document.getElementById('abChatAttachPreview');
        var img = document.getElementById('abChatAttachPreviewImg');
        if (img && preview) {
            img.src = URL.createObjectURL(file);
            preview.style.display = 'flex';
        }
        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/attachments'), {
            method: 'POST',
            headers: authHeaders(),
            credentials: 'include',
            body: fd
        })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(res){
            if (!res || !res.Success) {
                showChatError((res && res.Message) || tr('friends.upload_failed','Upload failed.'));
                clearAttachmentPreview();
                return;
            }
            // Server returns attachment metadata — keep the id and enable Send.
            _chatPendingAttachment = { Id: res.Attachment.id || res.Attachment.Id, FileName: res.Attachment.fileName || res.Attachment.FileName };
            var send = document.getElementById('abChatSend');
            if (send) send.disabled = false;
        })
        .catch(function(){
            showChatError(tr('friends.upload_failed','Upload failed.'));
            clearAttachmentPreview();
        });
    }

    // Wire up the chat pane's controls exactly once, at drawer mount time.
    function bindChatPaneControls(){
        var back = document.getElementById('abChatBack');
        if (back && !back.dataset.abBound) {
            back.dataset.abBound = '1';
            back.addEventListener('click', closeChatPane);
        }
        var input = document.getElementById('abChatInput');
        if (input && !input.dataset.abBound) {
            input.dataset.abBound = '1';
            input.addEventListener('input', function(){
                autoGrowChatInput(input);
                updateChatCounter(input.value);
                var send = document.getElementById('abChatSend');
                if (send) send.disabled = !(input.value || '').trim();
            });
            input.addEventListener('keydown', function(ev){
                // Enter = send, Shift+Enter = newline
                if (ev.key === 'Enter' && !ev.shiftKey) {
                    ev.preventDefault();
                    sendChatMessage();
                }
            });
        }
        var send = document.getElementById('abChatSend');
        if (send && !send.dataset.abBound) {
            send.dataset.abBound = '1';
            send.addEventListener('click', sendChatMessage);
        }

        // Gear + menu
        var gear = document.getElementById('abChatGear');
        var menu = document.getElementById('abChatMenu');
        if (gear && !gear.dataset.abBound) {
            gear.dataset.abBound = '1';
            gear.addEventListener('click', function(ev){
                ev.stopPropagation();
                if (menu) menu.classList.toggle('open');
            });
            document.addEventListener('click', function(ev){
                if (menu && menu.classList.contains('open') && !menu.contains(ev.target) && ev.target !== gear) {
                    menu.classList.remove('open');
                }
            });
        }
        var clearBtn = document.getElementById('abChatClear');
        if (clearBtn && !clearBtn.dataset.abBound) {
            clearBtn.dataset.abBound = '1';
            clearBtn.addEventListener('click', function(){
                if (menu) menu.classList.remove('open');
                if (!_chatPeerId) return;
                abConfirm(
                    tr('friends.clear_chat_title', 'Clear this conversation?'),
                    tr('friends.clear_chat_body', 'All messages between you and this user will be deleted for both of you. This cannot be undone.'),
                    tr('friends.clear_chat', 'Clear conversation'),
                    function(){
                        var uid = getUserId();
                        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/messages/'+_chatPeerId+'/clear'),
                            { method: 'DELETE', headers: authHeaders(), credentials: 'include' })
                        .then(function(){ loadChatMessages(); });
                    }
                );
            });
        }
        var blockBtn = document.getElementById('abChatBlock');
        if (blockBtn && !blockBtn.dataset.abBound) {
            blockBtn.dataset.abBound = '1';
            blockBtn.addEventListener('click', function(){
                if (menu) menu.classList.remove('open');
                if (!_chatPeerId) return;
                abConfirm(
                    tr('friends.block_title', 'Block this user?'),
                    tr('friends.block_body', "You won't receive messages from them and they won't receive yours. Existing messages stay in the conversation. You can unblock any time."),
                    tr('friends.block', 'Block user'),
                    function(){
                        var uid = getUserId();
                        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/block/'+_chatPeerId),
                            { method: 'POST', headers: authHeaders(), credentials: 'include' })
                        .then(function(){
                            showToast(tr('friends.blocked_toast','User blocked'), '');
                            closeChatPane();
                        });
                    }
                );
            });
        }
        var muteBtn = document.getElementById('abChatMute');
        if (muteBtn && !muteBtn.dataset.abBound) {
            muteBtn.dataset.abBound = '1';
            muteBtn.addEventListener('click', function(){
                if (menu) menu.classList.remove('open');
                if (!_chatPeerId) return;
                var k = 'abMuted:' + _chatPeerId.toLowerCase().replace(/-/g,'');
                var muted = localStorage.getItem(k) === '1';
                if (muted) localStorage.removeItem(k); else localStorage.setItem(k, '1');
                refreshMuteLabel();
                showToast(muted ? tr('friends.unmuted_toast','Notifications unmuted')
                                : tr('friends.muted_toast','Notifications muted'), '');
            });
        }
        var renameBtn = document.getElementById('abChatRename');
        if (renameBtn && !renameBtn.dataset.abBound) {
            renameBtn.dataset.abBound = '1';
            renameBtn.addEventListener('click', function(){
                if (menu) menu.classList.remove('open');
                if (!_chatConvId || _chatConvType !== 'group') return;
                var newTitle = prompt(tr('friends.rename_group_prompt','New group name:'), _chatPeerName || '');
                if (newTitle == null) return;
                var uid = getUserId();
                fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/conversations/'+_chatConvId+'/rename'),
                    { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()), credentials: 'include', body: JSON.stringify({ Title: newTitle }) })
                .then(function(){
                    _chatPeerName = newTitle;
                    var nm = document.getElementById('abChatPeerName'); if (nm) nm.textContent = newTitle;
                    if (_activeFdTab === 'messages') loadMessagesPane();
                });
            });
        }
        var leaveBtn = document.getElementById('abChatLeave');
        if (leaveBtn && !leaveBtn.dataset.abBound) {
            leaveBtn.dataset.abBound = '1';
            leaveBtn.addEventListener('click', function(){
                if (menu) menu.classList.remove('open');
                if (!_chatConvId || _chatConvType !== 'group') return;
                var uid = getUserId();
                abConfirm(
                    tr('friends.leave_title','Leave this group?'),
                    tr('friends.leave_body','You will be removed from the group and stop receiving messages from it.'),
                    tr('friends.leave_group','Leave group'),
                    function(){
                        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/conversations/'+_chatConvId+'/members/'+uid),
                            { method: 'DELETE', headers: authHeaders(), credentials: 'include' })
                        .then(function(){
                            showToast(tr('friends.left_group_toast','Left group'),'');
                            closeChatPane();
                            if (_activeFdTab === 'messages') loadMessagesPane();
                        });
                    }
                );
            });
        }

        // Attachment button + file input + preview clear
        var attachInput = document.getElementById('abChatAttachInput');
        if (attachInput && !attachInput.dataset.abBound) {
            attachInput.dataset.abBound = '1';
            attachInput.addEventListener('change', function(){
                var f = attachInput.files && attachInput.files[0];
                if (f) beginAttachmentUpload(f);
                attachInput.value = '';
            });
        }
        var attachClear = document.getElementById('abChatAttachClear');
        if (attachClear && !attachClear.dataset.abBound) {
            attachClear.dataset.abBound = '1';
            attachClear.addEventListener('click', clearAttachmentPreview);
        }
    }

    function refreshMuteLabel(){
        var lbl = document.getElementById('abChatMuteLabel');
        if (!lbl || !_chatPeerId) return;
        var k = 'abMuted:' + _chatPeerId.toLowerCase().replace(/-/g,'');
        var muted = localStorage.getItem(k) === '1';
        lbl.textContent = muted ? tr('friends.unmute','Unmute notifications')
                                : tr('friends.mute','Mute notifications');
    }

    // ── Messages tab (threads list) ────────────────────────────────────
    function loadMessagesPane(){
        var pane = document.getElementById('abFriendsPaneMessages');
        if (!pane) return;
        // On first load, show a placeholder. Subsequent polls only replace
        // if the thread list actually changed (hash) to avoid flicker.
        chatApi('/messages/threads').then(function(res){
            var threads = (res && res.Threads) || [];
            var newHash = threads.map(function(t){
                return (t.conversationId||'') + '|' + (t.lastAt||'') + '|' + (t.unreadCount||0) + '|' + (t.lastMessage||'').length;
            }).join('~');
            if (pane.dataset.abMsgsHash === newHash) return;
            pane.dataset.abMsgsHash = newHash;

            var header = '<div class="ab-msg-tab-header">' +
                '<button type="button" class="ab-msg-newgroup" id="abMsgNewGroup"><span class="material-icons">group_add</span> ' + tr('friends.new_group','New group') + '</button>' +
                '</div>';

            if (!threads.length) {
                pane.innerHTML = header +
                    '<div class="ab-fd-empty"><span class="material-icons">forum</span><div>'+
                    tr('friends.messages_empty','No conversations yet. Tap a friend\'s message icon to say hi.')+
                    '</div></div>';
                pane.querySelector('#abMsgNewGroup').addEventListener('click', openNewGroupModal);
                return;
            }
            pane.innerHTML = header + threads.map(function(t){
                var isGroup = (t.type === 'group');
                var av = isGroup ? '' : avatarStyle(t.otherUserId);
                var initialsHtml = isGroup
                    ? '<span class="material-icons" style="font-size:1.1em;">group</span>'
                    : (av ? '' : escapeHtml(initials(t.otherUserName || '')));
                var unread = t.unreadCount || 0;
                var mePrefix = t.lastFromMe ? '<span class="me-prefix">' + tr('friends.you','You:') + '</span>' : '';
                var when = t.lastAt ? formatChatTime(t.lastAt) : '';
                var lastPreview = (t.lastMessage || '');
                if (t.hasAttachment && (!lastPreview || lastPreview === '[image]')) lastPreview = tr('friends.sent_image','Sent an image');
                var avStyle = isGroup ? 'background:linear-gradient(135deg,#8b5cf6,#3b82f6);' : av;
                return '<div class="ab-msg-thread" data-ab-conv-id="' + escapeHtml(t.conversationId || '') + '" data-ab-conv-type="' + escapeHtml(t.type || 'dm') + '" data-ab-conv-title="' + escapeHtml(t.otherUserName || '') + '" data-ab-chat-open="' + escapeHtml(t.otherUserId || '') + '">' +
                    '<div class="ab-fd-avatar" style="' + avStyle + '">' + initialsHtml + '</div>' +
                    '<div class="ab-msg-thread-body">' +
                        '<div class="ab-msg-thread-top">' +
                            '<span class="ab-msg-thread-name">' + escapeHtml(t.otherUserName || '') + '</span>' +
                            '<span class="ab-msg-thread-time">' + escapeHtml(when) + '</span>' +
                        '</div>' +
                        '<div class="ab-msg-thread-preview">' +
                            '<span class="ab-msg-thread-last ' + (unread > 0 ? 'unread' : '') + '">' + mePrefix + escapeHtml(lastPreview) + '</span>' +
                            (unread > 0 ? '<span class="ab-msg-thread-unread">' + (unread > 99 ? '99+' : unread) + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
            pane.querySelector('#abMsgNewGroup').addEventListener('click', openNewGroupModal);
            pane.querySelectorAll('.ab-msg-thread').forEach(function(row){
                row.addEventListener('click', function(){
                    var type = row.getAttribute('data-ab-conv-type') || 'dm';
                    var convId = row.getAttribute('data-ab-conv-id');
                    var title = row.getAttribute('data-ab-conv-title') || '';
                    if (type === 'group') {
                        // For groups we need participant list — refetch conv
                        var uid = getUserId();
                        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/conversations/'+convId),
                            { headers: authHeaders(), credentials: 'include' })
                            .then(function(r){ return r.ok ? r.json() : null; })
                            .then(function(res){
                                if (!res || !res.Success) return;
                                var parts = (res.Conversation.participantIds || []).map(function(id){ return { userId: id, userName: '' }; });
                                openChatPaneForConversation(convId, res.Conversation.title, 'group', parts, {});
                            });
                    } else {
                        openChatPane(row.getAttribute('data-ab-chat-open'), title, false);
                    }
                });
            });
        });
    }

    // ── New-group modal ────────────────────────────────────────────────
    function openNewGroupModal(){
        var uid = getUserId(); if (!uid) return;
        fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/friends'),
            { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(data){
                var friends = (data && data.Friends) || [];
                if (!friends.length) { showToast(tr('friends.no_friends_yet','Add friends before starting a group.'),''); return; }
                var overlay = document.createElement('div');
                overlay.id = 'abNewGroupOverlay';
                overlay.innerHTML =
                    '<div class="ab-newgroup-box">' +
                        '<h3>' + escapeHtml(tr('friends.new_group','New group')) + '</h3>' +
                        '<input type="text" id="abNewGroupName" placeholder="' + escapeHtml(tr('friends.group_name','Group name (optional)')) + '" maxlength="60" />' +
                        '<div class="ab-newgroup-hint">' + escapeHtml(tr('friends.pick_members','Pick at least 2 friends:')) + '</div>' +
                        '<div class="ab-newgroup-list" id="abNewGroupList">' +
                            friends.map(function(f){
                                var av = avatarStyle(f.UserId);
                                var ih = av ? '' : escapeHtml(initials(f.UserName));
                                return '<label class="ab-newgroup-row">' +
                                    '<input type="checkbox" value="' + escapeHtml(f.UserId) + '" />' +
                                    '<div class="ab-fd-avatar" style="' + av + '">' + ih + '</div>' +
                                    '<span>' + escapeHtml(f.UserName) + '</span>' +
                                '</label>';
                            }).join('') +
                        '</div>' +
                        '<div class="ab-confirm-actions">' +
                            '<button type="button" class="ab-confirm-btn ghost" id="abNewGroupCancel">' + escapeHtml(tr('friends.cancel','Cancel')) + '</button>' +
                            '<button type="button" class="ab-confirm-btn primary" id="abNewGroupCreate">' + escapeHtml(tr('friends.create_group','Create group')) + '</button>' +
                        '</div>' +
                    '</div>';
                document.body.appendChild(overlay);
                void overlay.offsetHeight;
                overlay.classList.add('open');
                var cleanup = function(){ if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };
                overlay.addEventListener('click', function(e){ if (e.target === overlay) cleanup(); });
                overlay.querySelector('#abNewGroupCancel').addEventListener('click', cleanup);
                overlay.querySelector('#abNewGroupCreate').addEventListener('click', function(){
                    var picks = Array.prototype.slice.call(overlay.querySelectorAll('input[type=checkbox]:checked'))
                        .map(function(cb){ return cb.value; });
                    if (picks.length < 2) { showToast(tr('friends.pick_two','Pick at least 2 friends.'),''); return; }
                    var title = (overlay.querySelector('#abNewGroupName').value || '').trim();
                    fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/conversations'), {
                        method: 'POST',
                        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
                        credentials: 'include',
                        body: JSON.stringify({ Title: title || null, ParticipantIds: picks })
                    })
                    .then(function(r){ return r.ok ? r.json() : null; })
                    .then(function(res){
                        if (!res || !res.Success) { showToast((res && res.Message) || tr('friends.create_group_failed','Could not create group.'),''); return; }
                        cleanup();
                        var conv = res.Conversation;
                        var meNorm = uid.toLowerCase().replace(/-/g,'');
                        var parts = (conv.participantIds || []).filter(function(id){ return (id||'').toLowerCase().replace(/-/g,'') !== meNorm; })
                            .map(function(id){
                                var idNorm = (id||'').toLowerCase().replace(/-/g,'');
                                var match = friends.find(function(f){ return (f.UserId||'').toLowerCase().replace(/-/g,'') === idNorm; });
                                return { userId: id, userName: match ? match.UserName : '' };
                            });
                        openChatPaneForConversation(conv.id, conv.title, 'group', parts, {});
                        loadMessagesPane();
                    });
                });
            });
    }

    // ── Confirm dialog + toast + notifications ────────────────────────

    function abConfirm(title, body, actionLabel, onConfirm){
        var existing = document.getElementById('abMsgConfirm');
        if (existing) existing.remove();
        var wrap = document.createElement('div');
        wrap.id = 'abMsgConfirm';
        wrap.innerHTML =
            '<div class="ab-confirm-box">' +
                '<h3 class="ab-confirm-title">' + escapeHtml(title) + '</h3>' +
                '<div class="ab-confirm-body">' + escapeHtml(body) + '</div>' +
                '<div class="ab-confirm-actions">' +
                    '<button type="button" class="ab-confirm-btn ghost" data-ab-confirm-cancel>' + escapeHtml(tr('friends.cancel','Cancel')) + '</button>' +
                    '<button type="button" class="ab-confirm-btn danger" data-ab-confirm-ok>' + escapeHtml(actionLabel) + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(wrap);
        void wrap.offsetHeight;
        wrap.classList.add('open');
        var cleanup = function(){ if (wrap.parentNode) wrap.parentNode.removeChild(wrap); };
        wrap.addEventListener('click', function(ev){ if (ev.target === wrap) cleanup(); });
        wrap.querySelector('[data-ab-confirm-cancel]').addEventListener('click', cleanup);
        wrap.querySelector('[data-ab-confirm-ok]').addEventListener('click', function(){
            cleanup();
            try { onConfirm(); } catch (e) {}
        });
    }

    function showToast(title, text, onClickItemId){
        var existing = document.getElementById('abMsgToast');
        if (existing) existing.remove();
        var t = document.createElement('div');
        t.id = 'abMsgToast';
        t.innerHTML =
            '<span class="ab-toast-ico material-icons">chat</span>' +
            '<div class="ab-toast-body">' +
                '<div class="ab-toast-title">' + escapeHtml(title) + '</div>' +
                (text ? '<div class="ab-toast-text">' + escapeHtml(text) + '</div>' : '') +
            '</div>';
        document.body.appendChild(t);
        void t.offsetHeight;
        t.classList.add('show');
        var close = function(){ t.classList.remove('show'); setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 300); };
        t.addEventListener('click', function(){
            if (onClickItemId) {
                // Try to open the drawer + chat with that user
                var btn = document.getElementById('abFriendsBtn');
                if (btn) btn.click();
            }
            close();
        });
        setTimeout(close, 5000);
    }

    // Subtle chime for inbound message — Web Audio, no remote file needed.
    function playChatChime(){
        try {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            var ctx = new AudioCtx();
            var o = ctx.createOscillator();
            var g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(880, ctx.currentTime);
            o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
            g.gain.setValueAtTime(0.0001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            o.connect(g); g.connect(ctx.destination);
            o.start(); o.stop(ctx.currentTime + 0.32);
            setTimeout(function(){ try { ctx.close(); } catch (e) {} }, 500);
        } catch (e) {}
    }

    var _abNotifPermRequested = false;
    function maybeRequestNotifPerm(){
        if (_abNotifPermRequested) return;
        _abNotifPermRequested = true;
        try {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        } catch (e) {}
    }

    // Cache of last-seen message IDs per peer so we can detect "new"
    // arrivals without spamming the toast on first poll.
    var _abLastSeenMsgId = {};
    var _abPrefsCache = null;
    function getUserMessagingPrefs(){
        var uid = getUserId(); if (!uid) return Promise.resolve({});
        if (_abPrefsCache) return Promise.resolve(_abPrefsCache);
        return fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/preferences'),
            { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : {}; })
            .then(function(p){ _abPrefsCache = p || {}; return _abPrefsCache; })
            .catch(function(){ return {}; });
    }
    // Invalidate the prefs cache whenever the user saves from the prefs
    // modal — exposed so other code paths (or the prefs save) can nudge us.
    window.__abInvalidateMsgPrefs = function(){ _abPrefsCache = null; };

    function isWatching(){
        // Minimum-noise heuristic: Jellyfin's video player lives under
        // #videoOsdPage or has an active <video> element playing fullscreen.
        try {
            if (document.querySelector('.videoPlayerContainer:not(.hide)')) return true;
            if (document.querySelector('.videoOsdBottom:not(.hide)')) return true;
            var v = document.querySelector('video');
            if (v && !v.paused && !v.ended && v.currentTime > 0) return true;
        } catch (e) {}
        return false;
    }

    function processIncomingForNotifications(threads){
        // Threads come sorted newest-first. Fire a notification for any
        // thread whose last message is inbound, newer than what we saw
        // last tick, and satisfies user + admin prefs.
        if (!threads || !threads.length) return;
        getUserMessagingPrefs().then(function(prefs){
            if (prefs && prefs.MessageNotifications === false) return;
            var muteDuringPlayback = prefs && prefs.MuteMessageNotificationsDuringPlayback;
            if (muteDuringPlayback && isWatching()) return;
            threads.forEach(function(t){
                if (t.lastFromMe || !t.unreadCount) return;
                var convKey = t.conversationId || (t.otherUserId || '').toLowerCase().replace(/-/g, '');
                var peerKey = (t.otherUserId || '').toLowerCase().replace(/-/g, '');
                // Per-peer mute (local, DM-only)
                if (t.type !== 'group' && peerKey && localStorage.getItem('abMuted:' + peerKey) === '1') return;
                // Don't spam the toast if the same chat is currently open
                if (_chatOpen && _chatConvId === t.conversationId) return;
                var lastId = _abLastSeenMsgId[convKey];
                var signature = (t.lastAt || '') + '|' + (t.lastMessage || '');
                if (lastId === signature) return;
                _abLastSeenMsgId[convKey] = signature;
                // First poll after mount: record, don't notify (skip every
                // signature that existed before drawer mount).
                if (!_abNotifBootstrapped) return;
                // Sound
                if (prefs.MessageNotificationSound !== false) playChatChime();
                // In-app toast
                showToast(t.otherUserName || '', t.lastMessage || '', t.otherUserId);
                // Browser notification (when permission granted)
                try {
                    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
                        new Notification(t.otherUserName || 'New message', {
                            body: t.lastMessage || '',
                            tag: 'ab-msg-' + peerKey,
                            silent: prefs.MessageNotificationSound === false
                        });
                    }
                } catch (e) {}
            });
            _abNotifBootstrapped = true;
        });
    }
    var _abNotifBootstrapped = false;

    // Poll every 20s for unread counts while the drawer is mounted (not
    // just when it's open) so the friends button's red dot updates even
    // from other parts of the UI. Low traffic — one GET per 20s.
    function refreshUnreadCounts(){
        var uid = getUserId();
        if (!uid) return;
        chatApi('/messages/threads').then(function(res){
            if (!res || !res.Threads) return;
            var map = {};
            var totalUnread = 0;
            res.Threads.forEach(function(t){
                if (t.unreadCount > 0) {
                    map[String(t.otherUserId || '').toLowerCase().replace(/-/g, '')] = t.unreadCount;
                    totalUnread += t.unreadCount;
                }
            });
            _friendUnread = map;
            // Reflect messages in the floating friends button's badge.
            // Existing incoming-requests badge owns that slot already;
            // we OR them together so either signal lights it up.
            var btnBadge = document.getElementById('abFriendsBadge');
            if (btnBadge) {
                var incCount = 0;
                var incEl = document.getElementById('abFriendsIncBadge');
                if (incEl && incEl.style.display !== 'none') {
                    incCount = parseInt(incEl.textContent, 10) || 0;
                }
                var combined = incCount + totalUnread;
                btnBadge.textContent = combined > 99 ? '99+' : String(combined);
                btnBadge.style.display = combined > 0 ? 'flex' : 'none';
            }
            // Messages tab pill (blue, count-only, anchored to the tab)
            var msgsTab = document.getElementById('abMsgsTabBadge');
            if (msgsTab) {
                msgsTab.textContent = totalUnread > 99 ? '99+' : String(totalUnread);
                msgsTab.style.display = totalUnread > 0 ? 'inline-block' : 'none';
            }
            // Notifications (toast + sound + browser) for brand-new messages.
            processIncomingForNotifications(res.Threads);
            // Also refresh the messages tab list inline so "last message"
            // previews update without the user having to re-enter the tab.
            if (_friendsOpen && _activeFdTab === 'messages') loadMessagesPane();
        });
    }

    function fetchServerUsers(){
        if (_friendsCachedUsers) return Promise.resolve(_friendsCachedUsers);
        return fetch(buildUrl('Users'), { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : []; })
            .then(function(list){
                _friendsCachedUsers = (list || []).map(function(u){ return { Id: (u.Id||'').toString(), Name: u.Name || u.Id }; });
                return _friendsCachedUsers;
            }).catch(function(){ return []; });
    }

    function renderFriendSearch(q){
        var box = document.getElementById('abFriendsSearchResults');
        if (!box) return;
        q = (q || '').trim().toLowerCase();
        if (!q) { box.innerHTML = '<div class="ab-fd-empty"><span class="material-icons">search</span><div>' + tr('friends.type_to_search', 'Start typing to find users.') + '</div></div>'; return; }
        fetchServerUsers().then(function(users){
            var uid = getUserId();
            var me = (uid || '').toLowerCase().replace(/-/g,'');
            var skip = window.__abFriendIds || {};
            var matches = users.filter(function(u){
                var nid = (u.Id || '').toLowerCase().replace(/-/g,'');
                if (nid === me) return false;
                if (skip[nid]) return false;
                return (u.Name || '').toLowerCase().indexOf(q) !== -1;
            }).slice(0, 20);
            if (!matches.length) { box.innerHTML = '<div class="ab-fd-empty"><span class="material-icons">person_search</span><div>' + tr('friends.no_matches', 'No users match.') + '</div></div>'; return; }
            box.innerHTML = matches.map(function(u){
                var av = avatarStyle(u.Id);
                var initialsHtml = av ? '' : escapeHtml(initials(u.Name));
                return '<div class="ab-fd-row">' +
                    '<div class="ab-fd-avatar" style="' + av + '">' + initialsHtml + '</div>' +
                    '<div class="ab-fd-info"><div class="ab-fd-name">' + escapeHtml(u.Name) + '</div></div>' +
                    '<div class="ab-fd-actions"><button type="button" class="ab-fd-act accept" data-ab-friend-add="' + escapeHtml(u.Id) + '" title="'+tr('friends.send_request','Send request')+'"><span class="material-icons">person_add</span></button></div>' +
                '</div>';
            }).join('');
            box.querySelectorAll('[data-ab-friend-add]').forEach(function(btn){
                btn.addEventListener('click', function(){
                    var fid = btn.getAttribute('data-ab-friend-add');
                    btn.disabled = true;
                    fetch(buildUrl('Plugins/AchievementBadges/users/'+uid+'/friends/'+fid), { method:'POST', headers: authHeaders(), credentials:'include' })
                        .then(function(r){ return r.ok ? r.json() : null; })
                        .then(function(res){
                            btn.innerHTML = (res && res.Success) ? '<span class="material-icons">check</span>' + tr('friends.sent', 'Sent') : tr('friends.failed', 'Failed');
                            loadFriends();
                        }).catch(function(){ btn.textContent = tr('friends.failed', 'Failed'); });
                });
            });
        });
    }

    function start(){
        try { console.log('[AchievementBadges] start() running, readyState=', document.readyState); } catch(e){}
        loadSidebarTranslations();
        tryInject();
        // Mount the global friends button + drawer. Idempotent.
        try { ensureFriendsDrawer(); } catch(e) {}
        var attempts = 0;
        var retryInterval = setInterval(function(){
            attempts++;
            tryInject();
            if(attempts >= 60){ clearInterval(retryInterval); }
        }, 1000);
        var moPending = false;
        if(document.body){
            new MutationObserver(function(){
                if(moPending) return;
                moPending = true;
                setTimeout(function(){ moPending = false; tryInject(); }, 250);
            }).observe(document.body,{childList:true,subtree:true});
        }
        setInterval(refreshShowcases,30000);
    }
    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',start);
    } else {
        start();
    }
    setTimeout(function(){ try{ tryInject(); }catch(e){} }, 500);
    setTimeout(function(){ try{ tryInject(); }catch(e){} }, 2000);
})();
