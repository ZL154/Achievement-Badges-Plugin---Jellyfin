using System;
using System.IO;
using System.IO.Compression;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// Round-trips a compressed HTTP response body so text can be rewritten and
/// handed back in the encoding the client negotiated.
/// <para>
/// Only <c>gzip</c> and <c>br</c> are handled. <c>deflate</c> is deliberately
/// left out: HTTP disagrees with itself about whether it means raw DEFLATE or
/// zlib-wrapped, and guessing wrong produces a corrupt body rather than a
/// clean failure. Callers treat an unsupported encoding as "pass through
/// untouched", which is the pre-existing behaviour.
/// </para>
/// </summary>
public static class ResponseCompression
{
    public const string Gzip = "gzip";
    public const string Brotli = "br";

    public static bool CanRoundTrip(string? contentEncoding)
    {
        var name = Normalize(contentEncoding);
        return name is Gzip or Brotli;
    }

    /// <summary>
    /// Normalises a Content-Encoding header to a single lowercase token.
    /// Returns an empty string when the response is not encoded, and the
    /// raw trimmed value when it is something we do not handle, so callers
    /// can distinguish "plain" from "unsupported".
    /// </summary>
    public static string Normalize(string? contentEncoding)
    {
        if (string.IsNullOrWhiteSpace(contentEncoding))
        {
            return string.Empty;
        }

        // A comma-separated list would mean stacked encodings; we only claim
        // to understand a single one, so anything else falls through as
        // unsupported and gets passed along untouched.
        return contentEncoding.Trim().ToLowerInvariant();
    }

    public static byte[] Decompress(byte[] payload, string contentEncoding)
    {
        ArgumentNullException.ThrowIfNull(payload);

        using var source = new MemoryStream(payload);
        using var decoder = CreateDecoder(source, contentEncoding);
        using var output = new MemoryStream();
        decoder.CopyTo(output);
        return output.ToArray();
    }

    public static byte[] Compress(byte[] payload, string contentEncoding)
    {
        ArgumentNullException.ThrowIfNull(payload);

        using var output = new MemoryStream();
        using (var encoder = CreateEncoder(output, contentEncoding))
        {
            encoder.Write(payload, 0, payload.Length);
        }

        return output.ToArray();
    }

    private static Stream CreateDecoder(Stream source, string contentEncoding)
        => Normalize(contentEncoding) switch
        {
            Gzip => new GZipStream(source, CompressionMode.Decompress),
            Brotli => new BrotliStream(source, CompressionMode.Decompress),
            _ => throw new NotSupportedException($"Unsupported content encoding '{contentEncoding}'.")
        };

    private static Stream CreateEncoder(Stream destination, string contentEncoding)
        => Normalize(contentEncoding) switch
        {
            Gzip => new GZipStream(destination, CompressionLevel.Fastest, leaveOpen: true),
            Brotli => new BrotliStream(destination, CompressionLevel.Fastest, leaveOpen: true),
            _ => throw new NotSupportedException($"Unsupported content encoding '{contentEncoding}'.")
        };
}
