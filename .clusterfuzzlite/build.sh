#!/bin/bash -eu
# ClusterFuzzLite build script — runs inside the OSS-Fuzz base-builder image
# with $SRC pointing at the repo root, $OUT pointing at the artifact dir
# libFuzzer will read from, and $WORK as a scratch dir.
#
# Layout when ClusterFuzzLite runs us:
#   $SRC/AchievementBadges/    -- repo (COPYed in Dockerfile)
#   $OUT/                      -- libFuzzer reads final binaries from here
#   $WORK/                     -- scratch for builds, instrumented assemblies

cd "$SRC/AchievementBadges"

# 1. Publish the harness against the plugin's actual runtime DLLs.
dotnet publish Jellyfin.Plugin.AchievementBadges.Fuzz \
    -c Release \
    -o "$WORK/publish" \
    --self-contained false \
    --nologo

# 2. Instrument the plugin assembly with SharpFuzz coverage probes. The
#    `sharpfuzz` CLI is preinstalled in the OSS-Fuzz csharp base image; it
#    rewrites the target DLL in place so libFuzzer can drive coverage-guided
#    fuzzing through the harness.
sharpfuzz "$WORK/publish/Jellyfin.Plugin.AchievementBadges.dll"

# 3. Stage the harness + its runtime deps into $OUT/SvgSanitizerFuzzer/
#    so libFuzzer can launch the harness from a single directory.
fuzzer_name="SvgSanitizerFuzzer"
mkdir -p "$OUT/$fuzzer_name"
cp -r "$WORK/publish/." "$OUT/$fuzzer_name/"

# 4. Create the libFuzzer launcher script CFLite expects at $OUT/<name>.
#    The launcher runs the .NET harness assembly which calls Fuzzer.Run().
cat > "$OUT/$fuzzer_name" <<EOF
#!/bin/bash
this_dir=\$(dirname "\$0")
LD_LIBRARY_PATH="\$this_dir/$fuzzer_name" \\
  dotnet "\$this_dir/$fuzzer_name/Jellyfin.Plugin.AchievementBadges.Fuzz.dll" "\$@"
EOF
chmod +x "$OUT/$fuzzer_name"
