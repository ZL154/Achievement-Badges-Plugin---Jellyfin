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
            // Strategy: anchor on the parent of any existing .navMenuSection elements.
            // This is theme/plugin agnostic — every Jellyfin layout we've seen still
            // uses navMenuSection as the section wrapper, even when other classes change.
            var container = null;
            var existingSections = document.querySelectorAll('.navMenuSection');
            if(existingSections.length){ container = existingSections[0].parentElement; }
            if(!container){
                container = document.querySelector('.mainDrawer-scrollContainer')
                         || document.querySelector('.scrollContainer')
                         || document.querySelector('[class*=""scrollContainer""]')
                         || document.querySelector('.mainDrawer')
                         || document.querySelector('#mainDrawer')
                         || document.querySelector('.navDrawer-scrollContainer')
                         || document.querySelector('.navMenuOptions');
            }
            if(!container){ return; }
            console.log('[AchievementBadges] injectSidebar: found nav container, adding entry');

            var section=document.createElement('div');section.id=SIDEBAR_ID;section.className='navMenuSection';
            section.innerHTML='<div class=""sectionTitle"" style=""padding:16px 20px 4px;font-size:.72em;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.4);font-weight:600"">Achievements</div>';

            var a=document.createElement('a');a.href='javascript:void(0)';a.className='navMenuOption emby-button';a.setAttribute('role','menuitem');a.style.cursor='pointer';
            a.innerHTML='<span class=""material-icons navMenuOptionIcon"" style=""font-family:Material Icons;"">emoji_events</span><span class=""navMenuOptionText"">Achievements</span>';
            a.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();window.location.hash='/achievements';});
            section.appendChild(a);

            var showcase=document.createElement('div');showcase.id=SHOWCASE_ID;
            showcase.style.cssText='display:flex;gap:4px;padding:2px 12px 8px 42px;flex-wrap:wrap;';
            section.appendChild(showcase);

            // Insert before the User/Account section so we sit above Settings + Sign Out
            var inserted=false;
            var allSections=container.querySelectorAll('.navMenuSection');
            for(var si=0;si<allSections.length;si++){
                var header=allSections[si].querySelector('.sectionTitle, [class*=""header""], [class*=""Header""]');
                var htext=(header?header.textContent:(allSections[si].childNodes[0]&&allSections[si].childNodes[0].textContent||'')).trim().toLowerCase();
                if(htext==='user'||htext==='account'){
                    container.insertBefore(section,allSections[si]); inserted=true; break;
                }
            }
            if(!inserted){
                for(var sj=0;sj<allSections.length;sj++){
                    var links=allSections[sj].querySelectorAll('a, button');
                    for(var lk=0;lk<links.length;lk++){
                        if(/sign\s*out|log\s*out/i.test(links[lk].textContent)){
                            container.insertBefore(section,allSections[sj]); inserted=true; break;
                        }
                    }
                    if(inserted) break;
                }
            }
            if(!inserted) container.appendChild(section);
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
        // Retry on a loop for the first 15 seconds in case nav hasn't mounted yet
        // or another plugin rebuilt it after we injected
        var attempts = 0;
        var retryInterval = setInterval(function(){
            attempts++;
            tryInject();
            if(attempts >= 15){ clearInterval(retryInterval); }
        }, 1000);
        // MutationObserver catches any later nav rebuilds (e.g. SPA route changes)
        if(document.body){
            new MutationObserver(function(){tryInject();}).observe(document.body,{childList:true,subtree:true});
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
        if (!IsIndexHtmlRequest(context))
        {
            await _next(context);
            return;
        }

        _logger.LogInformation("[AchievementBadges] middleware handling index.html request: {Path}", context.Request.Path.Value);

        var originalBody = context.Response.Body;

        try
        {
            using var buffer = new MemoryStream();
            context.Response.Body = buffer;

            await _next(context);

            buffer.Seek(0, SeekOrigin.Begin);

            if (context.Response.ContentType != null &&
                context.Response.ContentType.Contains("text/html", StringComparison.OrdinalIgnoreCase))
            {
                var html = await new StreamReader(buffer, Encoding.UTF8).ReadToEndAsync();

                if (html.Contains("</body>", StringComparison.OrdinalIgnoreCase))
                {
                    html = html.Replace("</body>", InjectionScript + "</body>",
                        StringComparison.OrdinalIgnoreCase);

                    var bytes = Encoding.UTF8.GetBytes(html);
                    context.Response.ContentLength = bytes.Length;
                    context.Response.Body = originalBody;
                    await context.Response.Body.WriteAsync(bytes);

                    _logger.LogInformation("[AchievementBadges] Injected scripts into {Path} ({Bytes} bytes).", context.Request.Path.Value, bytes.Length);
                    return;
                }
                else
                {
                    _logger.LogWarning("[AchievementBadges] middleware: response HTML did not contain </body> tag, skipping injection. Content-Type={ContentType}", context.Response.ContentType);
                }
            }
            else
            {
                _logger.LogWarning("[AchievementBadges] middleware: response content type not HTML, skipping injection. Content-Type={ContentType}", context.Response.ContentType);
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

    private static bool IsIndexHtmlRequest(HttpContext context)
    {
        return context.Request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase)
            && context.Request.Path.Value != null
            && context.Request.Path.Value.Contains("index.html", StringComparison.OrdinalIgnoreCase)
            && !context.Request.Path.Value.Contains("/api/", StringComparison.OrdinalIgnoreCase);
    }
}
