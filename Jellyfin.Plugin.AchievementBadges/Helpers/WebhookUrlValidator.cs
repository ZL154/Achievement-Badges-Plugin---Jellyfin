using System;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;

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
                // v1.9.7 security: bound DNS resolution at 3s. The previous
                // synchronous GetHostAddresses call could stall the ASP.NET
                // request thread for the OS DNS-client default (5-30s) when
                // the resolver was slow, giving a logged-in admin a DoS
                // vector against their own server.
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
                try
                {
                    addresses = Dns.GetHostAddressesAsync(uri.Host, cts.Token)
                        .GetAwaiter().GetResult();
                }
                catch (OperationCanceledException)
                {
                    error = $"Webhook URL host '{uri.Host}' DNS resolution timed out after 3s.";
                    return false;
                }
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
        if (ip.Equals(IPAddress.Any) || ip.Equals(IPAddress.Broadcast)) return true;
        if (ip.Equals(IPAddress.IPv6Any) || ip.Equals(IPAddress.IPv6None)) return true;

        if (ip.IsIPv4MappedToIPv6)
        {
            return IsDisallowed(ip.MapToIPv4());
        }

        var bytes = ip.GetAddressBytes();
        if (ip.AddressFamily == AddressFamily.InterNetwork)
        {
            if (bytes[0] == 0) return true;                                      // "this" network
            if (bytes[0] == 10) return true;                                     // RFC1918
            if (bytes[0] == 100 && bytes[1] >= 64 && bytes[1] <= 127) return true; // CGNAT
            if (bytes[0] == 127) return true;                                    // loopback
            if (bytes[0] == 169 && bytes[1] == 254) return true;                 // link-local
            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) return true; // RFC1918
            if (bytes[0] == 192 && bytes[1] == 0 && bytes[2] == 0) return true;  // IETF protocol assignments
            if (bytes[0] == 192 && bytes[1] == 0 && bytes[2] == 2) return true;  // TEST-NET-1
            if (bytes[0] == 192 && bytes[1] == 168) return true;                 // RFC1918
            if (bytes[0] == 198 && (bytes[1] == 18 || bytes[1] == 19)) return true; // benchmark network
            if (bytes[0] == 198 && bytes[1] == 51 && bytes[2] == 100) return true; // TEST-NET-2
            if (bytes[0] == 203 && bytes[1] == 0 && bytes[2] == 113) return true;  // TEST-NET-3
            if (bytes[0] >= 224) return true;                                    // multicast/reserved/broadcast
        }
        else if (ip.AddressFamily == AddressFamily.InterNetworkV6)
        {
            if (ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal) return true;
            if (ip.IsIPv6Multicast || bytes[0] == 0xFF) return true;
            if (bytes[0] >= 0xFC && bytes[0] <= 0xFD) return true;               // unique local
            if (bytes[0] == 0x20 && bytes[1] == 0x01 && bytes[2] == 0x0D && bytes[3] == 0xB8) return true; // documentation
        }
        return false;
    }
}
