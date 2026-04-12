using System;
using System.Collections.Generic;
using Jellyfin.Plugin.AchievementBadges.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.AchievementBadges;

public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    public static Plugin? Instance { get; private set; }

    public override string Name => "Achievement Badges";

    public override Guid Id => Guid.Parse("d9f4b7d2-6c4d-4d7e-9d2d-1c6b4f8e2a11");

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        Instance = this;
    }

    public IEnumerable<PluginPageInfo> GetPages()
    {
        return new[]
        {
            new PluginPageInfo
            {
                Name = "achievementbadges",
                EmbeddedResourcePath = "Jellyfin.Plugin.AchievementBadges.Pages.index.html",
                EnableInMainMenu = true,
                DisplayName = "Achievements",
                MenuSection = "user",
                MenuIcon = "emoji_events"
            },
            new PluginPageInfo
            {
                Name = "achievementbadgesconfigpage",
                EmbeddedResourcePath = "Jellyfin.Plugin.AchievementBadges.Configuration.configPage.html"
            }
        };
    }
}