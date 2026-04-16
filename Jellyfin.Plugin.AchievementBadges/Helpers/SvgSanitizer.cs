using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Xml;
using System.Xml.Linq;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

public static class SvgSanitizer
{
    private const int MaxBytes = 100 * 1024; // 100 KB

    // <use> was originally blanket-blocked because it can fetch external
    // resources. That's too strict — same-document `<use href="#id">` is
    // safe and common in modern icon SVGs. We now allow <use> but check
    // its href/xlink:href value below — only `#anchor` references are OK.
    private static readonly string[] DisallowedElements = {
        "script", "foreignObject", "iframe", "embed", "object"
    };

    public static bool TryValidate(string svg, out string error)
    {
        error = "";
        if (string.IsNullOrWhiteSpace(svg)) { error = "SVG is empty."; return false; }
        if (Encoding.UTF8.GetByteCount(svg) > MaxBytes) { error = "SVG exceeds 100 KB."; return false; }

        try
        {
            var settings = new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Prohibit,
                XmlResolver = null,
                MaxCharactersFromEntities = 0,
                IgnoreComments = false
            };
            using var sr = new StringReader(svg);
            using var reader = XmlReader.Create(sr, settings);
            var doc = XDocument.Load(reader);

            var root = doc.Root;
            if (root == null || !string.Equals(root.Name.LocalName, "svg", StringComparison.OrdinalIgnoreCase))
            {
                error = "Root element must be <svg>.";
                return false;
            }

            foreach (var el in doc.Descendants())
            {
                if (DisallowedElements.Any(d => string.Equals(d, el.Name.LocalName, StringComparison.OrdinalIgnoreCase)))
                {
                    error = $"Disallowed element <{el.Name.LocalName}>.";
                    return false;
                }
                var isUse = string.Equals(el.Name.LocalName, "use", StringComparison.OrdinalIgnoreCase);
                foreach (var attr in el.Attributes())
                {
                    var name = attr.Name.LocalName;
                    if (name.StartsWith("on", StringComparison.OrdinalIgnoreCase))
                    {
                        error = $"Disallowed event handler attribute {name}.";
                        return false;
                    }
                    var value = attr.Value ?? "";
                    var lower = value.Trim().ToLowerInvariant();
                    if (lower.StartsWith("javascript:") || lower.StartsWith("data:text/html"))
                    {
                        error = $"Disallowed URI in attribute {name}.";
                        return false;
                    }
                    // <use href=...>/<use xlink:href=...> must be a same-document
                    // anchor reference. External URIs (http://, https://, even
                    // relative paths) could pull in unsanitised third-party SVG.
                    if (isUse && (string.Equals(name, "href", StringComparison.OrdinalIgnoreCase)
                                  || string.Equals(name, "xlink:href", StringComparison.OrdinalIgnoreCase)
                                  || name.Equals("href", StringComparison.OrdinalIgnoreCase)))
                    {
                        if (!value.Trim().StartsWith("#"))
                        {
                            error = $"<use> references must be same-document (#id); got '{value}'.";
                            return false;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            error = $"Invalid SVG: {ex.Message}";
            return false;
        }
        return true;
    }
}
