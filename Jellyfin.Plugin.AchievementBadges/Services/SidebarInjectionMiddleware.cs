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
    var ID='ab-sidebar-entry';
    var URL='/web/index.html#!/configurationpage?name=achievementbadges';
    function inject(){
        if(document.getElementById(ID))return;
        var nav=document.querySelector('.mainDrawer-scrollContainer .navMenuOptions')||document.querySelector('.mainDrawer-scrollContainer');
        if(!nav)return;
        var a=document.createElement('a');
        a.id=ID;a.href=URL;a.className='navMenuOption';
        a.innerHTML='<span class=""material-icons navMenuOptionIcon"">emoji_events</span><span class=""navMenuOptionText"">Achievements</span>';
        nav.appendChild(a);
    }
    function start(){inject();new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
</script>";

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

                    _logger.LogDebug("[AchievementBadges] Injected sidebar script into index.html response.");
                    return;
                }
            }

            buffer.Seek(0, SeekOrigin.Begin);
            context.Response.Body = originalBody;
            await buffer.CopyToAsync(originalBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AchievementBadges] Error in sidebar injection middleware.");

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
