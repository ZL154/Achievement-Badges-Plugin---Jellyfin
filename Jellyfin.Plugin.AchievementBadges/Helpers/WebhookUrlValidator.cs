using System;
using System.Net;
using System.Net.Sockets;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

public static class WebhookUrlValidator
{
    public static bool TryValidate(string? url, out string error)
    {
        error = "";
        if (string.IsNullOrWhiteSpace(url))
        {
            error = "Webhook URL is required.";
            return false;
        }
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            error = "Webhook URL must be absolute.";
            return false;
        }
        if (uri.Scheme != "http" && uri.Scheme != "https")
        {
            error = "Webhook URL must use http or https.";
            return false;
        }
        try
        {
            IPAddress[] addresses;
            if (IPAddress.TryParse(uri.Host, out var literal))
            {
                addresses = new[] { literal };
            }
            else
            {
                addresses = Dns.GetHostAddresses(uri.Host);
            }
            if (addresses.Length == 0)
            {
                // v1.8.58 security: fail-closed on empty resolution. Previously
                // we let through "no addresses" so an attacker couldn't bypass
                // validation by stalling DNS.
                error = $"Webhook URL host '{uri.Host}' did not resolve to any address.";
                return false;
            }
            foreach (var ip in addresses)
            {
                if (IsDisallowed(ip))
                {
                    error = $"Webhook URL resolves to a disallowed host ({ip}). Private, loopback, and link-local addresses are blocked.";
                    return false;
                }
            }
        }
        catch (Exception ex)
        {
            // v1.8.58 security: fail-closed on DNS errors. Previously the
            // catch-and-allow let an attacker register an admin URL that
            // failed DNS at validation time but resolved to a private IP at
            // send time (TOCTOU / DNS rebinding). WebhookNotifier still
            // re-validates immediately before each send, but the admin save
            // path needs to refuse unresolvable hosts up front.
            error = $"Webhook URL host could not be resolved ({ex.GetType().Name}). Refusing to save.";
            return false;
        }
        return true;
    }

    private static bool IsDisallowed(IPAddress ip)
    {
        if (IPAddress.IsLoopback(ip)) return true;
        var bytes = ip.GetAddressBytes();
        if (ip.AddressFamily == AddressFamily.InterNetwork)
        {
            if (bytes[0] == 10) return true;
            if (bytes[0] == 127) return true;
            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) return true;
            if (bytes[0] == 192 && bytes[1] == 168) return true;
            if (bytes[0] == 169 && bytes[1] == 254) return true;
            if (bytes[0] == 0) return true;
        }
        else if (ip.AddressFamily == AddressFamily.InterNetworkV6)
        {
            if (ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal) return true;
            if (bytes[0] >= 0xFC && bytes[0] <= 0xFD) return true;
        }
        return false;
    }
}
