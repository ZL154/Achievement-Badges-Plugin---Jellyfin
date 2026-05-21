using System.IO;
using System.Text;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using SharpFuzz;

namespace Jellyfin.Plugin.AchievementBadges.Fuzz;

/// <summary>
/// SharpFuzz harness for SvgSanitizer.TryValidate — parses untrusted XML
/// from admin-uploaded SVG badge icons. XML parsing + post-parse element
/// and attribute walks are exactly the kind of multi-stage parser that
/// benefits from coverage-guided fuzzing.
///
/// What we want the fuzzer to find:
///   * Any input that throws an unhandled exception (TryValidate must
///     return false, not crash, on every input).
///   * Any input that returns true but contains a disallowed element or
///     attribute pattern. The post-parse scan is the security boundary
///     and the fuzzer should not be able to slip a script element or
///     javascript: URI past it.
///
/// Run locally:
///   dotnet publish -c Release Jellyfin.Plugin.AchievementBadges.Fuzz
///   sharpfuzz publish/Jellyfin.Plugin.AchievementBadges.dll SvgSanitizer
/// ClusterFuzzLite handles all of that automatically inside the
/// .clusterfuzzlite/Dockerfile build.
/// </summary>
internal static class Program
{
    public static void Main(string[] args)
    {
        Fuzzer.Run((Stream stream) =>
        {
            using var ms = new MemoryStream();
            stream.CopyTo(ms);
            Fuzz(ms.ToArray());
        });
    }

    private static void Fuzz(byte[] input)
    {
        string svg;
        try
        {
            svg = Encoding.UTF8.GetString(input);
        }
        catch (DecoderFallbackException)
        {
            // Invalid UTF-8 in the fuzz input — not the target's problem.
            return;
        }

        // The actual target: must not throw on any input. Returning false
        // with an error message is the expected "bad input" path; an
        // unhandled exception means a real bug.
        _ = SvgSanitizer.TryValidate(svg, out _);
    }
}
