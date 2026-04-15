(function(){
    try { console.log('[AchievementBadges] sidebar.js loaded'); } catch(e){}
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
                '<span class="navMenuOptionText">Achievements</span>';
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

            var showcase = document.createElement('div');
            showcase.id = SHOWCASE_ID;
            showcase.style.cssText = 'display:flex;gap:4px;padding:2px 12px 8px 42px;flex-wrap:wrap;';
            if(a.nextSibling){ parent.insertBefore(showcase, a.nextSibling); }
            else { parent.appendChild(showcase); }

            refreshShowcases();
        } catch(e) { console.error('[AchievementBadges] injectSidebar error:', e); }
    }

    function injectHeader(){
        try {
            if(document.getElementById(HEADER_ID)){ return; }
            var headerRight=document.querySelector('.headerRight')||document.querySelector('.skinHeader .headerButton:last-child');
            if(!headerRight){ return; }
            console.log('[AchievementBadges] injectHeader: found header, adding badges container');
            var container=document.createElement('div');container.id=HEADER_ID;
            container.style.cssText='display:flex;align-items:center;gap:3px;margin-right:6px;';
            container.title='Equipped Badges';
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
                        pill.innerHTML='<span class="material-icons" style="font-family:Material Icons;font-size:15px;line-height:1;color:#fff;opacity:0.95;">'+icName(b.Icon)+'</span><span style="color:'+color+';font-weight:700;line-height:1;">'+b.Title+'</span>';
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
        injectSidebar();
        injectHeader();
    }

    function start(){
        try { console.log('[AchievementBadges] start() running, readyState=', document.readyState); } catch(e){}
        tryInject();
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
