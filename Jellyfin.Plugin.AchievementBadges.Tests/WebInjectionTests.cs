using System.IO;
using System.Text;
using System.Threading.Tasks;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Regression tests for issue #46. The client scripts are injected by
/// <see cref="SidebarInjectionMiddleware"/> at request time, because the
/// on-disk patch cannot work on the official Docker image where
/// /jellyfin/jellyfin-web is root-owned and the server runs unprivileged.
/// <para>
/// The middleware used to skip any response carrying a Content-Encoding.
/// Every browser sends <c>Accept-Encoding: gzip</c>, so that was the only
/// branch browsers ever took: the scripts reached curl and nothing else.
/// </para>
/// </summary>
public class WebInjectionTests
{
    private const string Marker = "achievementbadges-bootstrap";
    private const string Page = "<html><body><div>content</div></body></html>";

    private static async Task<(byte[] Body, string Encoding)> RunAsync(string? contentEncoding)
    {
        var payload = Encoding.UTF8.GetBytes(Page);
        if (!string.IsNullOrEmpty(contentEncoding))
        {
            payload = ResponseCompression.Compress(payload, contentEncoding);
        }

        var context = new DefaultHttpContext();
        context.Request.Method = "GET";
        context.Request.Path = "/web/index.html";

        var sink = new MemoryStream();
        context.Response.Body = sink;

        var middleware = new SidebarInjectionMiddleware(
            async ctx =>
            {
                ctx.Response.ContentType = "text/html; charset=utf-8";
                if (!string.IsNullOrEmpty(contentEncoding))
                {
                    ctx.Response.Headers["Content-Encoding"] = contentEncoding;
                }

                await ctx.Response.Body.WriteAsync(payload);
            },
            NullLogger<SidebarInjectionMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        return (sink.ToArray(), contentEncoding ?? string.Empty);
    }

    private static string Decode(byte[] body, string contentEncoding)
        => string.IsNullOrEmpty(contentEncoding)
            ? Encoding.UTF8.GetString(body)
            : Encoding.UTF8.GetString(ResponseCompression.Decompress(body, contentEncoding));

    [Fact]
    public async Task Injects_IntoPlainHtml()
    {
        var (body, enc) = await RunAsync(null);
        Assert.Contains(Marker, Decode(body, enc), System.StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("gzip")]
    [InlineData("br")]
    public async Task Injects_IntoCompressedHtml(string contentEncoding)
    {
        var (body, enc) = await RunAsync(contentEncoding);

        // Still decodable as the negotiated encoding, so the client is
        // unaffected beyond receiving the scripts it should always have had.
        var html = Decode(body, enc);
        Assert.Contains(Marker, html, System.StringComparison.Ordinal);
        Assert.Contains("<div>content</div>", html, System.StringComparison.Ordinal);
    }

    [Fact]
    public async Task PassesThrough_UnsupportedEncoding()
    {
        // deflate is ambiguous in HTTP, so it is left alone rather than
        // risking a corrupt body. The original bytes must survive intact.
        var payload = Encoding.UTF8.GetBytes(Page);

        var context = new DefaultHttpContext();
        context.Request.Method = "GET";
        context.Request.Path = "/web/index.html";
        var sink = new MemoryStream();
        context.Response.Body = sink;

        var middleware = new SidebarInjectionMiddleware(
            async ctx =>
            {
                ctx.Response.ContentType = "text/html; charset=utf-8";
                ctx.Response.Headers["Content-Encoding"] = "deflate";
                await ctx.Response.Body.WriteAsync(payload);
            },
            NullLogger<SidebarInjectionMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(payload, sink.ToArray());
    }

    [Fact]
    public async Task DoesNotDoubleInject()
    {
        var already = "<html><body><!-- " + Marker + " --></body></html>";
        var payload = ResponseCompression.Compress(Encoding.UTF8.GetBytes(already), "gzip");

        var context = new DefaultHttpContext();
        context.Request.Method = "GET";
        context.Request.Path = "/web/index.html";
        var sink = new MemoryStream();
        context.Response.Body = sink;

        var middleware = new SidebarInjectionMiddleware(
            async ctx =>
            {
                ctx.Response.ContentType = "text/html; charset=utf-8";
                ctx.Response.Headers["Content-Encoding"] = "gzip";
                await ctx.Response.Body.WriteAsync(payload);
            },
            NullLogger<SidebarInjectionMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        var html = Decode(sink.ToArray(), "gzip");
        var first = html.IndexOf(Marker, System.StringComparison.Ordinal);
        Assert.True(first >= 0);
        Assert.Equal(first, html.LastIndexOf(Marker, System.StringComparison.Ordinal));
    }

    [Theory]
    [InlineData("gzip", true)]
    [InlineData("GZIP", true)]
    [InlineData(" br ", true)]
    [InlineData("deflate", false)]
    [InlineData("gzip, br", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void CanRoundTrip_OnlyClaimsWhatItHandles(string? encoding, bool expected)
    {
        Assert.Equal(expected, ResponseCompression.CanRoundTrip(encoding));
    }
}
