using System;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// Produces a browser-cache token that changes for every compiled plugin binary.
/// The assembly version alone is not sufficient while testing multiple builds of
/// the same release because the client-script endpoint is cached as immutable.
/// </summary>
internal static class ClientAssetVersion
{
    private static readonly System.Reflection.Assembly PluginAssembly = typeof(ClientAssetVersion).Assembly;

    public static string Value { get; } =
        (PluginAssembly.GetName().Version?.ToString() ?? "0") +
        "-" +
        PluginAssembly.ManifestModule.ModuleVersionId.ToString("N");

    public static string QueryTag { get; } = "?v=" + Value;
}
