using Jellyfin.Plugin.AchievementBadges.Helpers;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// v1.8.59 (A+): security regression tests. Pure-function checks against the
/// helpers that would catch the regressions you'd most regret. These run in
/// CI and gate releases. They never need a Jellyfin host or fake auth — every
/// surface here is testable in isolation.
///
/// If a test in this file fails, that's the canary for a real-world security
/// regression — investigate before merging.
/// </summary>
public class SecurityTests
{
    // ============================================================
    // WebhookUrlValidator — SSRF defence
    // ============================================================

    [Theory]
    [InlineData("http://127.0.0.1/hook")]
    [InlineData("http://127.0.0.1:8080/hook")]
    [InlineData("http://10.0.0.1/hook")]            // RFC1918 class A
    [InlineData("http://172.16.0.1/hook")]          // RFC1918 class B
    [InlineData("http://172.31.255.255/hook")]      // RFC1918 class B edge
    [InlineData("http://192.168.1.1/hook")]         // RFC1918 class C
    [InlineData("http://169.254.169.254/latest/")]  // AWS instance metadata
    [InlineData("http://0.0.0.0/hook")]             // unspecified
    public void WebhookUrlValidator_RejectsPrivateAndLoopbackIPv4(string url)
    {
        var ok = WebhookUrlValidator.TryValidate(url, out var error);
        Assert.False(ok, $"Expected '{url}' to be rejected. Error was: {error}");
        Assert.NotEmpty(error);
    }

    [Theory]
    [InlineData("http://[::1]/hook")]                // IPv6 loopback
    [InlineData("http://[fe80::1]/hook")]            // IPv6 link-local
    [InlineData("http://[fc00::1]/hook")]            // IPv6 unique local
    [InlineData("http://[fd00::1]/hook")]            // IPv6 unique local
    public void WebhookUrlValidator_RejectsPrivateAndLoopbackIPv6(string url)
    {
        var ok = WebhookUrlValidator.TryValidate(url, out var error);
        Assert.False(ok, $"Expected '{url}' to be rejected. Error was: {error}");
        Assert.NotEmpty(error);
    }

    [Theory]
    [InlineData("ftp://example.com/hook")]
    [InlineData("file:///etc/passwd")]
    [InlineData("gopher://example.com/")]
    [InlineData("javascript:alert(1)")]
    public void WebhookUrlValidator_RejectsNonHttpSchemes(string url)
    {
        var ok = WebhookUrlValidator.TryValidate(url, out var error);
        Assert.False(ok, $"Expected '{url}' to be rejected. Error was: {error}");
    }

    [Theory]
    [InlineData("not-a-url")]
    [InlineData("/relative/path")]
    [InlineData("")]
    [InlineData(null)]
    public void WebhookUrlValidator_RejectsMalformed(string? url)
    {
        var ok = WebhookUrlValidator.TryValidate(url, out var error);
        Assert.False(ok);
        Assert.NotEmpty(error);
    }

    [Fact]
    public void WebhookUrlValidator_AcceptsPublicHttps()
    {
        // Use a public-IP literal so the test doesn't depend on DNS — the
        // Cloudflare DNS service IP is reliably non-private.
        var ok = WebhookUrlValidator.TryValidate("https://1.1.1.1/webhook", out var error);
        Assert.True(ok, $"Expected public IPv4 to pass. Error was: {error}");
    }

    // ============================================================
    // SvgSanitizer — XSS / XXE defence
    // ============================================================

    [Theory]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>")]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'><foreignObject><body>x</body></foreignObject></svg>")]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'><iframe src='evil'/></svg>")]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'><embed src='evil'/></svg>")]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'><object data='evil'/></svg>")]
    public void SvgSanitizer_RejectsDangerousElements(string svg)
    {
        var ok = SvgSanitizer.TryValidate(svg, out var error);
        Assert.False(ok, $"Expected SVG to be rejected. Error was: {error}");
    }

    [Theory]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'/>")]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'><circle onclick='alert(1)' r='10'/></svg>")]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'><rect onmouseover='x' width='10' height='10'/></svg>")]
    public void SvgSanitizer_RejectsEventHandlers(string svg)
    {
        var ok = SvgSanitizer.TryValidate(svg, out var error);
        Assert.False(ok, $"Expected SVG with event handler to be rejected. Error was: {error}");
    }

    [Fact]
    public void SvgSanitizer_RejectsExternalDtd()
    {
        // External DTD is the classic XXE vector. SvgSanitizer sets
        // DtdProcessing.Prohibit so this must be rejected at parse time.
        var svg = "<?xml version=\"1.0\"?><!DOCTYPE svg SYSTEM \"http://evil/xxe.dtd\"><svg/>";
        var ok = SvgSanitizer.TryValidate(svg, out var error);
        Assert.False(ok, $"Expected DTD-bearing SVG to be rejected. Error was: {error}");
    }

    [Fact]
    public void SvgSanitizer_RejectsOversizedPayload()
    {
        // 100 KB cap. 200 KB of inert content should still be rejected.
        var pad = new string('a', 200 * 1024);
        var svg = $"<svg xmlns='http://www.w3.org/2000/svg'><title>{pad}</title></svg>";
        var ok = SvgSanitizer.TryValidate(svg, out var error);
        Assert.False(ok);
        Assert.Contains("KB", error);
    }

    [Fact]
    public void SvgSanitizer_AcceptsCleanSvg()
    {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>" +
                  "<circle cx='12' cy='12' r='10' fill='currentColor'/>" +
                  "</svg>";
        var ok = SvgSanitizer.TryValidate(svg, out var error);
        Assert.True(ok, $"Expected clean SVG to pass. Error was: {error}");
    }

    [Fact]
    public void SvgSanitizer_AcceptsSameDocumentUseHref()
    {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" +
                  "<defs><circle id='c' cx='5' cy='5' r='5'/></defs>" +
                  "<use href='#c'/>" +
                  "</svg>";
        var ok = SvgSanitizer.TryValidate(svg, out var error);
        Assert.True(ok, $"Expected same-document <use> to pass. Error was: {error}");
    }

    [Fact]
    public void SvgSanitizer_RejectsExternalUseHref()
    {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" +
                  "<use href='https://evil/icon.svg#x'/>" +
                  "</svg>";
        var ok = SvgSanitizer.TryValidate(svg, out var error);
        Assert.False(ok, $"Expected external <use href> to be rejected. Error was: {error}");
    }
}
