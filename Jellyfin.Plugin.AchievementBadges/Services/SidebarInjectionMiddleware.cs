using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class SidebarInjectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SidebarInjectionMiddleware> _logger;

    private const string InjectionScript = @"<script>
(function(){
    try { console.log('[AchievementBadges] inline injection script loaded'); } catch(e){}
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

            // Strategy: find the 'Plugin Settings' / 'Plugin Pages' item by text
            // and insert right next to IT, in its parent. This guarantees we land
            // in Jellyfin's own plugin section instead of whichever random
            // '.navMenuOption' happens to be first on the page (e.g. Kevin Tweaks).
            // We walk all .navMenuOption elements and match against the visible text.
            var allItems = document.querySelectorAll('.navMenuOption');
            var anchorItem = null;
            var anchorPlacement = 'after'; // insert after matched item by default
            for(var i=0;i<allItems.length;i++){
                var itxt = (allItems[i].textContent||'').trim().toLowerCase();
                if(/^plugin\s*(settings|pages)$/.test(itxt)){
                    anchorItem = allItems[i];
                    anchorPlacement = 'after';
                    break;
                }
            }
            // Secondary: a 'My Media' / 'Home' / 'Media' type anchor — at least
            // land inside the main Jellyfin nav block, not a 3rd-party section.
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
            // Last resort: first .navMenuOption we can find (previous behaviour).
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
            // Mirror the anchor item's class list so we inherit Jellyfin's styling exactly.
            a.className = anchorItem.className || 'navMenuOption emby-button';
            a.setAttribute('role','menuitem');
            a.style.cursor = 'pointer';
            a.innerHTML =
                '<span class=""material-icons navMenuOptionIcon"" style=""font-family:Material Icons;"">emoji_events</span>' +
                '<span class=""navMenuOptionText"">Achievements</span>';
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

            // Showcase row sits directly under our nav item
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
            if(!headerRight){
                return;
            }
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
                        pill.innerHTML='<span class=""material-icons"" style=""font-family:Material Icons;font-size:15px;line-height:1;color:#fff;opacity:0.95;"">'+icName(b.Icon)+'</span><span style=""color:'+color+';font-weight:700;line-height:1;"">'+b.Title+'</span>';
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
                        dot.innerHTML='<span class=""material-icons"" style=""font-family:Material Icons;font-size:16px;line-height:1;color:#fff;"">'+icName(b.Icon)+'</span>';
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
        // Keep retrying for a full minute. On slow loads (cold cache, mobile,
        // many plugins) the nav drawer can take 20-30s to mount.
        var attempts = 0;
        var retryInterval = setInterval(function(){
            attempts++;
            tryInject();
            if(attempts >= 60){ clearInterval(retryInterval); }
        }, 1000);
        // MutationObserver catches any later nav rebuilds (e.g. SPA route changes
        // or other plugins re-rendering the drawer). Throttled so we don't thrash.
        var moPending = false;
        if(document.body){
            new MutationObserver(function(){
                if(moPending) return;
                moPending = true;
                setTimeout(function(){ moPending = false; tryInject(); }, 250);
            }).observe(document.body,{childList:true,subtree:true});
        }
        // Refresh equipped badge content periodically
        setInterval(refreshShowcases,30000);
    }
    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',start);
    } else {
        start();
    }
    // Also kick off start() after a small delay as a belt-and-braces approach,
    // since some themes load asynchronously and the initial DOM is minimal
    setTimeout(function(){ try{ tryInject(); }catch(e){} }, 500);
    setTimeout(function(){ try{ tryInject(); }catch(e){} }, 2000);
})();
</script>
<script src=""/Plugins/AchievementBadges/client-script/standalone"" defer></script>
<script src=""/Plugins/AchievementBadges/client-script/enhance"" defer></script>";

    public SidebarInjectionMiddleware(RequestDelegate next, ILogger<SidebarInjectionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!CouldBeHtmlRequest(context))
        {
            await _next(context);
            return;
        }

        var originalBody = context.Response.Body;

        try
        {
            using var buffer = new MemoryStream();
            context.Response.Body = buffer;

            await _next(context);

            buffer.Seek(0, SeekOrigin.Begin);

            var contentType = context.Response.ContentType;
            var contentEncoding = context.Response.Headers["Content-Encoding"].ToString();

            // Only rewrite uncompressed text/html. If the response is gzip/br,
            // streaming through our buffer as plain UTF-8 would mangle bytes,
            // so pass it through untouched.
            var isHtml = contentType != null && contentType.Contains("text/html", StringComparison.OrdinalIgnoreCase);
            var isCompressed = !string.IsNullOrEmpty(contentEncoding);

            if (isHtml && !isCompressed)
            {
                using var reader = new StreamReader(buffer, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 1024, leaveOpen: true);
                var html = await reader.ReadToEndAsync();

                // Idempotency: if WebInjectionService has already patched
                // index.html on disk, the marker is present and we must not
                // inject again, otherwise we'd load the scripts twice.
                if (html.Contains("achievementbadges-bootstrap", StringComparison.Ordinal))
                {
                    buffer.Seek(0, SeekOrigin.Begin);
                    context.Response.Body = originalBody;
                    await buffer.CopyToAsync(originalBody);
                    return;
                }

                if (html.Contains("</body>", StringComparison.OrdinalIgnoreCase))
                {
                    html = html.Replace("</body>", InjectionScript + "</body>",
                        StringComparison.OrdinalIgnoreCase);

                    var bytes = Encoding.UTF8.GetBytes(html);
                    // Clear Content-Length so the framework re-derives it from the new body.
                    // Setting it to bytes.Length first caused a race on some Kestrel paths.
                    context.Response.ContentLength = null;
                    context.Response.Body = originalBody;
                    await context.Response.Body.WriteAsync(bytes);

                    _logger.LogInformation("[AchievementBadges] Injected scripts into {Path} ({Bytes} bytes).", context.Request.Path.Value, bytes.Length);
                    return;
                }
            }

            buffer.Seek(0, SeekOrigin.Begin);
            context.Response.Body = originalBody;
            await buffer.CopyToAsync(originalBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AchievementBadges] Error in script injection middleware.");
            context.Response.Body = originalBody;
        }
    }

    // Broad prefilter: buffer anything that MIGHT be Jellyfin's SPA shell HTML.
    // Jellyfin serves index.html at /web/, /web, /web/index.html, and sometimes /.
    // We can't rely on the literal "index.html" substring — /web/ has no filename.
    // Content-Type gating inside InvokeAsync stops us actually rewriting non-HTML.
    private static bool CouldBeHtmlRequest(HttpContext context)
    {
        if (!context.Request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase))
            return false;
        var path = context.Request.Path.Value;
        if (path == null) return false;

        // Skip obviously non-HTML paths to avoid buffering every asset in memory.
        if (path.Contains("/api/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Plugins/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/emby/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Items/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Users/", StringComparison.OrdinalIgnoreCase)
            && !path.EndsWith("/Users", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/socket", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/System/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Videos/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Audio/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Images/", StringComparison.OrdinalIgnoreCase)) return false;

        // Obvious static asset extensions — let them pass untouched.
        var lastSlash = path.LastIndexOf('/');
        var fileName = lastSlash >= 0 ? path.Substring(lastSlash + 1) : path;
        var dot = fileName.LastIndexOf('.');
        if (dot >= 0)
        {
            var ext = fileName.Substring(dot + 1).ToLowerInvariant();
            switch (ext)
            {
                case "js":
                case "mjs":
                case "css":
                case "map":
                case "png":
                case "jpg":
                case "jpeg":
                case "gif":
                case "svg":
                case "webp":
                case "ico":
                case "woff":
                case "woff2":
                case "ttf":
                case "eot":
                case "mp4":
                case "webm":
                case "m4s":
                case "ts":
                case "json":
                case "xml":
                case "txt":
                case "wasm":
                    return false;
            }
        }
        return true;
    }
}
