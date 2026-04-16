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
        var pubPromise = fetch(buildUrl('Plugins/AchievementBadges/public-config'), { headers: authHeaders(), credentials: 'include' })
            .then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
        var prefPromise = (function(){
            var uid = getUserId(); if (!uid) return Promise.resolve(null);
            return fetch(buildUrl('Plugins/AchievementBadges/users/' + uid + '/preferences'), { headers: authHeaders(), credentials: 'include' })
                .then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
        })();
        return Promise.all([pubPromise, prefPromise]).then(function(results){
            var pub = results[0], prefs = results[1];
            if (pub && pub.ForceHideEquippedShowcase) { _showcaseEnabled = false; installShowcaseWatchdog(); return false; }
            if (prefs && prefs.ShowEquippedShowcase === false) { _showcaseEnabled = false; installShowcaseWatchdog(); return false; }
            _showcaseEnabled = true; return true;
        });
    }
    function removeShowcaseDom(){
        var sc = document.getElementById(SHOWCASE_ID); if (sc && sc.parentNode) sc.parentNode.removeChild(sc);
        var hdr = document.getElementById(HEADER_ID); if (hdr && hdr.parentNode) hdr.parentNode.removeChild(hdr);
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

    // Periodic re-resolve so ADMIN-side changes to ForceHideEquippedShowcase
    // (which the admin user can't broadcast to OTHER users' tabs) get
    // picked up automatically within ~60s. Also covers the case where the
    // admin themself toggles it without broadcasting.
    setInterval(function(){
        _showcaseEnabled = null;
        resolveShowcaseEnabled().then(function(enabled){
            if (!enabled) removeShowcaseDom();
        });
    }, 60000);

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
    function ensureFriendsDrawer(){
        if (_friendsMounted) return;
        _friendsMounted = true;

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
                '.ab-fd-body{flex:1;overflow-y:auto;padding:0.8em;}' +
                '.ab-fd-row{display:flex;align-items:center;gap:0.7em;padding:0.7em 0.55em;border-radius:12px;transition:background 0.15s;margin-bottom:0.2em;}' +
                '.ab-fd-row:hover{background:rgba(255,255,255,0.04);}' +
                '.ab-fd-avatar{width:40px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800;font-size:0.9em;position:relative;background:linear-gradient(135deg,#334155,#1e293b);color:#cbd5e1;background-size:cover;background-position:center;}' +
                '.ab-fd-avatar.online{background:linear-gradient(135deg,rgba(74,222,128,0.3),rgba(34,197,94,0.18));color:#bbf7d0;box-shadow:inset 0 0 0 2px #4ade80;}' +
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
                '#abFriendsIncBadge{margin-left:0.3em;padding:0 6px;border-radius:999px;background:#ef4444;color:#fff;font-size:0.65em;font-weight:800;line-height:16px;min-width:18px;text-align:center;}';
            (document.head || document.documentElement).appendChild(fst);
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'abFriendsBtn';
        btn.title = tr('friends.title', 'Friends');
        btn.innerHTML = '<span class="material-icons">groups</span><span id="abFriendsBadge"></span>';
        document.body.appendChild(btn);

        var backdrop = document.createElement('div');
        backdrop.id = 'abFriendsBackdrop';
        document.body.appendChild(backdrop);

        var drawer = document.createElement('div');
        drawer.id = 'abFriendsDrawer';
        drawer.innerHTML =
            '<div class="ab-fd-header">' +
                '<span class="ab-fd-ico"><span class="material-icons" style="font-size:1em;">groups</span></span>' +
                '<div class="ab-fd-title">' + tr('friends.title', 'Friends') + '</div>' +
                '<button type="button" class="ab-fd-close" id="abFriendsClose"><span class="material-icons" style="font-size:1em;">close</span></button>' +
            '</div>' +
            '<div class="ab-fd-tabs">' +
                '<button type="button" class="ab-fd-tab active" data-ab-fdtab="friends">' + tr('friends.tab_friends', 'Friends') + '</button>' +
                '<button type="button" class="ab-fd-tab" data-ab-fdtab="requests">' + tr('friends.tab_requests', 'Requests') + '<span id="abFriendsIncBadge" style="display:none;"></span></button>' +
                '<button type="button" class="ab-fd-tab" data-ab-fdtab="find">' + tr('friends.tab_find', 'Find') + '</button>' +
            '</div>' +
            '<div class="ab-fd-body">' +
                '<div id="abFriendsPaneFriends"></div>' +
                '<div id="abFriendsPaneRequests" style="display:none;"></div>' +
                '<div id="abFriendsPaneFind" style="display:none;">' +
                    '<input type="search" id="abFriendsSearch" class="ab-fd-search" placeholder="' + tr('friends.search_placeholder', 'Search users...') + '">' +
                    '<div id="abFriendsSearchResults"></div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(drawer);

        function open(){ _friendsOpen = true; backdrop.style.display='block'; drawer.style.display='flex'; void drawer.offsetHeight; backdrop.style.opacity='1'; drawer.style.transform='translateX(0)'; loadFriends(); }
        function close(){ _friendsOpen = false; backdrop.style.opacity='0'; drawer.style.transform='translateX(-100%)'; setTimeout(function(){ drawer.style.display='none'; backdrop.style.display='none'; }, 280); }

        btn.addEventListener('click', open);
        backdrop.addEventListener('click', close);
        drawer.querySelector('#abFriendsClose').addEventListener('click', close);

        drawer.querySelectorAll('[data-ab-fdtab]').forEach(function(b){
            b.addEventListener('click', function(){
                var which = b.getAttribute('data-ab-fdtab');
                document.getElementById('abFriendsPaneFriends').style.display = which==='friends'?'':'none';
                document.getElementById('abFriendsPaneRequests').style.display = which==='requests'?'':'none';
                document.getElementById('abFriendsPaneFind').style.display = which==='find'?'':'none';
                drawer.querySelectorAll('[data-ab-fdtab]').forEach(function(bb){ bb.classList.toggle('active', bb===b); });
                if (which === 'find') {
                    var inp = document.getElementById('abFriendsSearch');
                    if (inp) setTimeout(function(){ inp.focus(); }, 60);
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
                // Admin / config panels live under #!/dashboard, #!/plugins,
                // #!/users, #!/settings, and #!/mypreferences on Jellyfin.
                if (hash.indexOf('/dashboard') >= 0) return true;
                if (hash.indexOf('/plugins') >= 0) return true;
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
            var hide = shouldHideFriendsBtn();
            btnEl.style.display = hide ? 'none' : 'flex';
            // Also close the drawer if it happens to be open when we enter
            // a hide-state (e.g. user clicked Play while drawer was open).
            if (hide && _friendsOpen) {
                try { close(); } catch(e) {}
            }
        }
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

                if (!friends.length) {
                    fBox.innerHTML = '<div class="ab-fd-empty"><span class="material-icons">people_outline</span><div>' + tr('friends.empty', "You haven't added any friends yet.") + '</div></div>';
                } else {
                    fBox.innerHTML = friends.map(function(f){
                        var status = f.Online
                            ? (f.NowPlaying && f.NowPlaying.Name
                                ? tr('friends.watching_prefix', 'Watching') + ' <strong>' + escapeHtml(f.NowPlaying.SeriesName ? (f.NowPlaying.SeriesName + (f.NowPlaying.Name ? ' — ' + f.NowPlaying.Name : '')) : f.NowPlaying.Name) + '</strong>'
                                : tr('friends.online', 'Online'))
                            : (f.LastSeen ? tr('friends.last_seen', 'Last seen') + ' ' + new Date(f.LastSeen).toLocaleString() : tr('friends.offline', 'Offline'));
                        var av = avatarStyle(f.UserId);
                        var initialsHtml = av ? '' : escapeHtml(initials(f.UserName));
                        return '<div class="ab-fd-row">' +
                            '<div class="ab-fd-avatar'+(f.Online?' online':'')+'" style="' + av + '">' + initialsHtml + '</div>' +
                            '<div class="ab-fd-info">' +
                                '<div class="ab-fd-name">' + escapeHtml(f.UserName) + '</div>' +
                                '<div class="ab-fd-status'+(f.Online?' online':'')+'">' + status + '</div>' +
                                (f.Equipped && f.Equipped.length ? '<div style="margin-top:0.35em;">' + renderEquippedDots(f.Equipped, 16) + '</div>' : '') +
                            '</div>' +
                            '<div class="ab-fd-actions"><button type="button" class="ab-fd-act decline" data-ab-friend-remove="' + escapeHtml(f.UserId) + '" title="'+tr('friends.remove','Remove')+'"><span class="material-icons">person_remove</span></button></div>' +
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

                window.__abFriendIds = {};
                [friends, incoming, outgoing].forEach(function(arr){
                    arr.forEach(function(f){ window.__abFriendIds[String(f.UserId||'').toLowerCase().replace(/-/g,'')] = true; });
                });
            }).catch(function(){
                fBox.innerHTML = '<div class="ab-fd-empty"><span class="material-icons">error_outline</span><div>' + tr('friends.load_failed', 'Failed to load friends.') + '</div></div>';
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
