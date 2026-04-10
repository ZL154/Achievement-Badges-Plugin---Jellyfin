using System.IO;
using System.Reflection;

namespace Jellyfin.Plugin.AchievementBadges;

public static class ResourceReader
{
    public static string? ReadEmbeddedText(string resourcePath)
    {
        var assembly = Assembly.GetExecutingAssembly();
        using var stream = assembly.GetManifestResourceStream(resourcePath);
        if (stream == null)
        {
            return null;
        }

        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}