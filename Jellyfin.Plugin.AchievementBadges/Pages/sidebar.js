(function(){
    try { console.log('[AchievementBadges] sidebar.js loaded'); } catch(e){}
    var SIDEBAR_ID='ab-sidebar-entry';
    var SHOWCASE_ID='ab-sidebar-showcase';
    var HEADER_ID='ab-header-badges';
    function icName(n){ return (n||'emoji_events').toString().toLowerCase().replace(/[^a-z0-9_]/g,''); }
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
