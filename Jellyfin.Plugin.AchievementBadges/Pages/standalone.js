(function () {
    var ROUTE_MATCH = "/achievements";
    var ROOT_ID = "achievementBadgesStandaloneRoot";

    var iconMap = {
        play_circle:'\u25b6', travel_explore:'\ud83e\udded', weekend:'\ud83d\udecb', chair:'\ud83e\ude91', home:'\ud83c\udfe0',
        movie_filter:'\ud83c\udf9e', live_tv:'\ud83d\udcfa', theaters:'\ud83c\udfad', local_fire_department:'\ud83d\udd25',
        bolt:'\u26a1', military_tech:'\ud83c\udfc6', auto_awesome:'\u2728', movie:'\ud83c\udfac', tv:'\ud83d\udcfa',
        dark_mode:'\ud83c\udf19', nights_stay:'\ud83c\udf03', bedtime:'\ud83d\ude34', wb_sunny:'\ud83c\udf05', light_mode:'\u2600',
        sunny:'\ud83c\udf1e', event:'\ud83d\udcc5', event_available:'\ud83d\uddd3', celebration:'\ud83c\udf89', stars:'\ud83c\udf1f',
        collections_bookmark:'\ud83d\udcda', inventory_2:'\ud83d\uddc3', today:'\ud83d\udcc6', calendar_month:'\ud83d\uddd3',
        favorite:'\u2764', timeline:'\ud83d\udcc8', insights:'\ud83d\udcca', all_inclusive:'\u267e', speed:'\ud83d\udca8',
        hourglass_bottom:'\u23f3', directions_run:'\ud83c\udfc3', sports_score:'\ud83c\udfc1', local_movies:'\ud83c\udf7f',
        emoji_events:'\ud83c\udfc6'
    };

    // Allowlist of Material Icons glyph names that actually render in the
    // current Material Icons font. Anything not in here falls back to
    // emoji_events, otherwise the font shows the raw text ("CASSETTE",
    // "VINYL", etc.) on a badge card. Keep in sync with sidebar.js.
    var VALID_MATERIAL_ICONS = ['play_circle','travel_explore','weekend','chair','home','movie_filter','live_tv','theaters','local_fire_department','bolt','military_tech','auto_awesome','movie','tv','dark_mode','nights_stay','bedtime','wb_sunny','light_mode','sunny','event','event_available','celebration','stars','collections_bookmark','inventory_2','today','calendar_month','favorite','timeline','insights','all_inclusive','speed','rocket_launch','whatshot','emoji_events','cake','help','settings','push_pin','schedule','star','emoji_objects','public','new_releases','verified','workspace_premium','school','science','psychology','self_improvement','fitness_center','sports_esports','music_note','headphones','album','library_music','radio','audiotrack','mic','piano','queue_music','smart_display','videocam','camera','photo_camera','image','panorama','landscape','terrain','forest','water','air','thermostat','ac_unit','cloud','thunderstorm','filter_drama','nightlight','shield','security','lock','vpn_key','token','diamond','paid','monetization_on','savings','account_balance','storefront','shopping_cart','redeem','card_giftcard','loyalty','volunteer_activism','diversity_3','groups','person','face','sentiment_satisfied','mood','thumb_up','handshake','pets','cruelty_free','eco','recycling','compost','energy_savings_leaf','solar_power','wind_power','electric_bolt','flash_on','highlight','lightbulb','tips_and_updates','edit','draw','brush','palette','color_lens','format_paint','architecture','design_services','construction','build','handyman','plumbing','hardware','precision_manufacturing','biotech','api','code','terminal','data_object','storage','dns','hub','lan','router','wifi','bluetooth','cast','devices','phone_android','phone_iphone','laptop','desktop_windows','monitor','tablet','watch','headset','speaker','tv_gen','display_settings','tune','equalizer','graphic_eq','surround_sound','spatial_audio','volume_up','notifications','campaign','flag','bookmark','label','tag','sell','receipt','description','article','newspaper','feed','forum','chat','message','mail','send','attach_file','link','share','ios_share','content_copy','content_cut','content_paste','delete','remove','add','done','close','check','clear','search','zoom_in','zoom_out','filter_list','sort','swap_vert','swap_horiz','compare_arrows','open_in_new','launch','download','upload','cloud_upload','cloud_download','sync','refresh','replay','replay_circle_filled','undo','redo','history','update','access_time','timer','alarm','hourglass_empty','hourglass_bottom','hourglass_top','hourglass_full','pending','autorenew','loop','rotate_right','flip','crop','straighten','transform','animation','motion_photos_auto','slow_motion_video','speed','fast_forward','fast_rewind','skip_next','skip_previous','play_arrow','pause','stop','fiber_manual_record','circle','square','hexagon','pentagon','change_history','category','shapes','interests','extension','puzzle','casino','sports_bar','local_bar','restaurant','local_dining','local_pizza','bakery_dining','lunch_dining','dinner_dining','brunch_dining','tapas','ramen_dining','icecream','local_cafe','coffee','emoji_food_beverage','liquor','wine_bar','nightlife','attractions','park','beach_access','pool','hot_tub','spa','sailing','kayaking','surfing','skateboarding','snowboarding','hiking','directions_bike','directions_run','directions_walk','flight','flight_takeoff','airport_shuttle','directions_car','directions_bus','directions_railway','directions_boat','navigation','explore','map','place','location_on','my_location','near_me','gps_fixed','compass_calibration','north','south','east','west','language','translate','g_translate','auto_stories','auto_awesome_motion','auto_fix_high','av_timer','award_star','bed','calendar_today','calendar_view_week','check_circle','connected_tv','date_range','event_repeat','fastfood','festival','gavel','library_books','local_movies','menu_book','movie_creation','record_voice_over','repeat','repeat_on','rocket','sports_martial_arts','sports_score','theater_comedy','trending_up','wb_twilight'];
    var VALID_SET = (function(){ var s={}; for (var i=0;i<VALID_MATERIAL_ICONS.length;i++) s[VALID_MATERIAL_ICONS[i]]=1; return s; })();
    // Central safe icon resolver: always returns a renderable Material Icons
    // glyph name. Use this everywhere instead of inlining badge.Icon.
    function safeIcon(name) {
        var safe = (name || 'emoji_events').toString().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!safe || !VALID_SET[safe]) return 'emoji_events';
        return safe;
    }
    function icon(name) {
        return '<span class="material-icons" aria-hidden="true" style="font-family:\'Material Icons\';font-size:1.4em;line-height:1;vertical-align:middle;">' + safeIcon(name) + '</span>';
    }

    // ===== i18n =====
    // Holds the currently loaded translation dictionary. Starts empty so tr()
    // gracefully falls back to the key (English-like) before translations load.
    var translations = {};
    var currentLang = 'en';
    function tr(key, fallback) {
        if (translations && Object.prototype.hasOwnProperty.call(translations, key)) {
            return translations[key];
        }
        return fallback != null ? fallback : key;
    }
    // Translate a badge category label (e.g. "Binge", "Weekend Watching").
    // Categories come back from the server as-is in English — look them up
    // under the "category.<Name>" key and fall back to the English label
    // when no translation exists. Also slug-variants the name so both
    // "Weekend Watching" and a category.weekend_watching key work.
    function trCategory(cat) {
        if (cat == null || cat === '') return '';
        var raw = String(cat);
        var direct = translations && translations['category.' + raw];
        if (direct) return direct;
        var slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        var bySlug = translations && translations['category.' + slug];
        if (bySlug) return bySlug;
        return raw;
    }
    // Translate a badge rarity label (Common, Uncommon, Rare, Epic, Legendary, Mythic).
    function trRarity(r) {
        if (r == null || r === '') return '';
        var raw = String(r);
        var key = 'rarity.' + raw.toLowerCase();
        if (translations && translations[key]) return translations[key];
        return raw;
    }
    // Load a language bundle from the server. Resolves even on failure so
    // page load never blocks; tr() just keeps using its current dict.
    function loadTranslations(lang) {
        var clean = (lang || 'en').toString().toLowerCase().replace(/[^a-z-]/g, '');
        if (!clean) clean = 'en';
        currentLang = clean;
        return fetchJson('Plugins/AchievementBadges/translations/' + clean)
            .then(function (data) { translations = data || {}; return translations; })
            .catch(function () { translations = translations || {}; return translations; });
    }
    // Walk the DOM and replace text/title/placeholder on any element that
    // has a data-i18n / data-i18n-title / data-i18n-placeholder marker.
    // Safe to call repeatedly (on tab re-render, language change, etc.).
    function applyStaticTranslations(scope) {
        var rootEl = scope || document.getElementById(ROOT_ID);
        if (!rootEl) return;
        rootEl.querySelectorAll('[data-i18n]').forEach(function (node) {
            // Skip containers that already have child elements — setting
            // textContent would nuke them. Protects abSaLb, abSaActivity,
            // abSaSettingsContent, etc. once populated.
            if (node.children && node.children.length > 0) return;
            var k = node.getAttribute('data-i18n');
            // Leaf text containers that later get OVERWRITTEN by loadAll /
            // other renderers carry the "common.loading" placeholder and
            // no children — applyStaticTranslations would happily re-set
            // them back to "Loading..." every time loadAll's inner
            // translation pass fires, clobbering the real content. Skip
            // the loading placeholder specifically: once the real content
            // lands it stays; if we're still genuinely loading, the
            // element already shows "Loading..." in English which is
            // visible for <1 s anyway.
            if (k === 'common.loading') return;
            var v = tr(k, null);
            if (v != null) node.textContent = v;
        });
        rootEl.querySelectorAll('[data-i18n-title]').forEach(function (node) {
            var k = node.getAttribute('data-i18n-title');
            var v = tr(k, null);
            if (v != null) node.setAttribute('title', v);
        });
        rootEl.querySelectorAll('[data-i18n-placeholder]').forEach(function (node) {
            var k = node.getAttribute('data-i18n-placeholder');
            var v = tr(k, null);
            if (v != null) node.setAttribute('placeholder', v);
        });
    }

    function rarityClass(r) {
        var v = (r || '').toLowerCase();
        if (v === 'uncommon') return 'ab-r-uncommon';
        if (v === 'rare') return 'ab-r-rare';
        if (v === 'epic') return 'ab-r-epic';
        if (v === 'legendary') return 'ab-r-legendary';
        if (v === 'mythic') return 'ab-r-mythic';
        return 'ab-r-common';
    }

    function getApiClient() { return window.ApiClient || window.apiClient || null; }

    function buildUrl(path) {
        var clean = String(path || '').replace(/^\/+/, '');
        var api = getApiClient();
        if (api && typeof api.getUrl === 'function') return api.getUrl(clean);
        return '/' + clean;
    }

    function getAuthHeadersImmediate() {
        var api = getApiClient();
        var h = { 'Content-Type': 'application/json' };
        if (!api) return h;
        try {
            if (typeof api.accessToken === 'function') {
                var t = api.accessToken();
                if (t) h['X-Emby-Token'] = t;
            } else if (api._serverInfo && api._serverInfo.AccessToken) {
                h['X-Emby-Token'] = api._serverInfo.AccessToken;
            }
        } catch (e) {}
        return h;
    }

    // Back-compat shim — some older callers use this synchronously.
    function getAuthHeaders() { return getAuthHeadersImmediate(); }

    // Retry-capable version: waits for ApiClient.accessToken() to return a value.
    // Up to 10 tries at 200ms. Resolves with whatever headers we have even if
    // no token materialised — the server will still accept cookie auth and the
    // caller's 401-retry in fetchJson() will kick in if needed.
    function getAuthHeadersAsync() {
        var h = getAuthHeadersImmediate();
        if (h['X-Emby-Token']) return Promise.resolve(h);
        return new Promise(function (resolve) {
            var attempts = 0;
            var MAX = 10;
            var timer = setInterval(function () {
                attempts++;
                var hh = getAuthHeadersImmediate();
                if (hh['X-Emby-Token'] || attempts >= MAX) {
                    clearInterval(timer);
                    resolve(hh);
                }
            }, 200);
        });
    }

    function _doFetch(path, method, body, headers) {
        var init = {
            method: method || 'GET',
            headers: headers,
            credentials: 'include'
        };
        if (body !== undefined && body !== null) {
            init.body = JSON.stringify(body);
        }
        return fetch(buildUrl(path), init);
    }

    // fetchJson with token-ready wait + one-shot 401 retry after 1s. The 401
    // retry handles the case where ApiClient's token is being refreshed out
    // from under us (common right after a back-navigation or page remount).
    function fetchJson(path, method, body) {
        return getAuthHeadersAsync().then(function (headers) {
            return _doFetch(path, method, body, headers).then(function (r) {
                if (r.status === 401) {
                    // One retry after a 1s delay with fresh headers.
                    return new Promise(function (res) { setTimeout(res, 1000); })
                        .then(function () { return getAuthHeadersAsync(); })
                        .then(function (h2) { return _doFetch(path, method, body, h2); });
                }
                return r;
            });
        }).then(function (r) {
            if (!r.ok) {
                return r.text().then(function (t) {
                    var msg = 'Error ' + r.status;
                    try { var b = JSON.parse(t); if (b && b.Message) msg = b.Message; } catch (e) {}
                    throw new Error(msg);
                });
            }
            if (r.status === 204) return null;
            return r.text().then(function (t) { return t ? JSON.parse(t) : null; });
        });
    }

    function getCurrentUserIdImmediate() {
        var api = getApiClient();
        if (api) {
            try {
                if (typeof api.getCurrentUserId === 'function') {
                    var id = api.getCurrentUserId();
                    if (id) return id;
                }
                if (api._serverInfo && api._serverInfo.UserId) return api._serverInfo.UserId;
            } catch (e) {}
        }
        return '';
    }

    // Resolve the current Jellyfin user id with a short retry loop. On a fresh
    // page load, a back-navigation from another plugin page, or a hash route
    // change before Jellyfin has fully bootstrapped, window.ApiClient /
    // getCurrentUserId() may briefly be unavailable. Poll every 200ms for up
    // to 2 seconds (10 tries). Fall back to Users/Me as a last resort.
    function getCurrentUserId() {
        var immediate = getCurrentUserIdImmediate();
        if (immediate) return Promise.resolve(immediate);
        return new Promise(function (resolve) {
            var attempts = 0;
            var MAX_ATTEMPTS = 10;
            var INTERVAL_MS = 200;
            var timer = null;
            var settled = false;
            function finish(val) {
                if (settled) return;
                settled = true;
                if (timer) { clearInterval(timer); timer = null; }
                resolve(val || '');
            }
            // If Jellyfin fires a "connect"/"authenticated" event on the document,
            // short-circuit the polling loop. These are best-effort — we still
            // fall back to the interval below if no event ever fires.
            try {
                var onEvent = function () {
                    var id = getCurrentUserIdImmediate();
                    if (id) finish(id);
                };
                document.addEventListener('connected', onEvent, { once: true });
                document.addEventListener('authenticated', onEvent, { once: true });
            } catch (e) { /* ignore environments without event support */ }

            timer = setInterval(function () {
                attempts++;
                var id = getCurrentUserIdImmediate();
                if (id) { finish(id); return; }
                if (attempts >= MAX_ATTEMPTS) {
                    // Last-ditch: ask the server who we are via the auth cookie/token.
                    fetchJson('Users/Me').then(function (me) {
                        finish(me && me.Id ? me.Id : '');
                    }).catch(function () { finish(''); });
                }
            }, INTERVAL_MS);
        });
    }

    function injectStyles() {
        if (document.getElementById('ab-standalone-css')) return;
        var s = document.createElement('style');
        s.id = 'ab-standalone-css';
        // v2.0: bulletproof full-viewport coverage. Some Jellyfin host themes
        // / web wrappers were leaking the "Page not found" 404 page through
        // when the standalone root was sized by `inset:0` alone (theory: the
        // host adds a viewport-constraining ancestor at certain widths). The
        // belt-and-braces declarations below pin every edge AND set explicit
        // 100vw/100vh so no ancestor can clip us, with !important so a host
        // CSS reset can't override the layout properties.
        s.textContent = '#' + ROOT_ID + '{position:fixed !important;top:0 !important;right:0 !important;bottom:0 !important;left:0 !important;width:100vw !important;height:100vh !important;max-width:none !important;max-height:none !important;margin:0 !important;z-index:999999;overflow-y:auto;padding:2em;background:var(--theme-body-background,#181818);color:#fff;font-family:inherit;color-scheme:dark;box-sizing:border-box;}' +
            /* v1.8.48: Classic-mode styling for the Classic/Revamp toggle button.
               Lives in standalone's own injectStyles so the button looks correct
               even when styles-revamp.css isn't loaded. */
            '#' + ROOT_ID + ' .ab-topbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}' +
            '#' + ROOT_ID + ' .abSaStyleToggleBtn{appearance:none;margin-left:auto;padding:6px 14px;height:32px;border:1px solid rgba(255,255,255,0.18);background:rgba(20,24,32,0.7);color:rgba(255,255,255,0.85);border-radius:999px;font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0.10em;text-transform:uppercase;cursor:pointer;transition:color 180ms ease,border-color 180ms ease,background 180ms ease;}' +
            '#' + ROOT_ID + ' .abSaStyleToggleBtn:hover{border-color:rgba(255,255,255,0.4);color:#fff;background:rgba(40,48,64,0.7);}' +
            '#' + ROOT_ID + ' .abSaStyleToggleBtn:active{transform:translateY(1px);}' +
            '#' + ROOT_ID + ' .abSaStyleToggleBtn[aria-pressed="true"]{background:#5e6ad2;border-color:#5e6ad2;color:#fff;}' +
            /* v1.8.52: hide the Revamp-only hero arc by default. Revamp CSS
               sets display:flex when [data-ab-style="revamp"] is on the root. */
            '#' + ROOT_ID + ' .abSaHeroArc{display:none;}' +
            '#' + ROOT_ID + ' .ab-input,#' + ROOT_ID + ' .ab-select{padding:0.6em 0.9em;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(20,24,32,0.85);color:#fff;font-size:0.92em;font-family:inherit;appearance:none;-webkit-appearance:none;-moz-appearance:none;cursor:pointer;}' +
            '#' + ROOT_ID + ' .ab-select{background-image:url(\'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22><path fill=%22%23fff%22 d=%22M4 6l4 4 4-4z%22/></svg>\');background-repeat:no-repeat;background-position:right 0.7em center;padding-right:2em;}' +
            '#' + ROOT_ID + ' .ab-select option{background:#181b24;color:#fff;}' +
            '#' + ROOT_ID + ' .ab-input:focus,#' + ROOT_ID + ' .ab-select:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102,126,234,0.25);}' +
            '#' + ROOT_ID + ' .ab-badge-pts{font-size:0.88em;font-weight:800;padding:0.35em 0.75em;border-radius:999px;background:linear-gradient(135deg,rgba(102,126,234,0.3),rgba(118,75,162,0.3));border:1px solid rgba(102,126,234,0.45);color:#d8e0ff;white-space:nowrap;letter-spacing:0.02em;box-shadow:0 0 12px rgba(102,126,234,0.15);}' +
            // Leaderboard podium
            '#' + ROOT_ID + ' .ab-lb-podium{display:flex;justify-content:center;align-items:flex-end;gap:0.75em;padding:1.5em 0.5em 0.5em;}' +
            '#' + ROOT_ID + ' .ab-lb-podium-col{flex:1;max-width:170px;display:flex;flex-direction:column;align-items:center;gap:0.4em;}' +
            '#' + ROOT_ID + ' .ab-lb-podium-medal{font-size:2em;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));}' +
            '#' + ROOT_ID + ' .ab-lb-podium-name{font-weight:700;font-size:0.95em;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '#' + ROOT_ID + ' .ab-lb-podium-val{font-size:0.82em;font-weight:700;opacity:0.9;}' +
            '#' + ROOT_ID + ' .ab-lb-podium-bar{width:100%;border-radius:8px 8px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:0.5em;font-size:0.75em;font-weight:800;letter-spacing:0.1em;color:rgba(0,0,0,0.55);text-transform:uppercase;box-shadow:0 -4px 12px rgba(0,0,0,0.3) inset;}' +
            '#' + ROOT_ID + ' .ab-lb-podium-empty{width:100%;}' +
            // Leaderboard rows 4-10
            '#' + ROOT_ID + ' .ab-lb-row-new{display:flex;align-items:center;gap:0.85em;padding:0.6em 0.85em;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);margin-bottom:0.4em;}' +
            '#' + ROOT_ID + ' .ab-lb-rank{font-weight:800;color:#9fb3c8;width:2.2em;font-size:0.9em;}' +
            '#' + ROOT_ID + ' .ab-lb-info{flex:1;min-width:0;}' +
            '#' + ROOT_ID + ' .ab-lb-name{font-weight:600;font-size:0.95em;margin-bottom:0.3em;}' +
            '#' + ROOT_ID + ' .ab-lb-bar{height:5px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;}' +
            '#' + ROOT_ID + ' .ab-lb-fill{height:100%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:3px;}' +
            '#' + ROOT_ID + ' .ab-lb-value{font-weight:700;font-size:0.88em;color:#c7d2ff;white-space:nowrap;}' +
            // Mobile overrides — leaderboard podium + rows were clipping
            // out of the tab container on narrow screens because each
            // podium column maxed out at 170px × 3 (~510px) plus gaps.
            // Shrink everything to fit phone widths.
            '@media (max-width: 640px){' +
                '#' + ROOT_ID + ' .ab-lb-podium{gap:0.35em;padding:1em 0.25em 0.35em;}' +
                '#' + ROOT_ID + ' .ab-lb-podium-col{max-width:none;min-width:0;}' +
                '#' + ROOT_ID + ' .ab-lb-podium-medal{font-size:1.4em;}' +
                '#' + ROOT_ID + ' .ab-lb-podium-name{font-size:0.8em;}' +
                '#' + ROOT_ID + ' .ab-lb-podium-val{font-size:0.72em;}' +
                '#' + ROOT_ID + ' .ab-lb-podium-bar{font-size:0.65em;padding-top:0.3em;}' +
                '#' + ROOT_ID + ' .ab-lb-row-new{gap:0.5em;padding:0.5em 0.6em;}' +
                '#' + ROOT_ID + ' .ab-lb-rank{width:auto;min-width:1.8em;font-size:0.82em;flex-shrink:0;}' +
                '#' + ROOT_ID + ' .ab-lb-name{font-size:0.85em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
                '#' + ROOT_ID + ' .ab-lb-value{font-size:0.78em;flex-shrink:0;}' +
                // Equipped-dot chips — lose padding + smaller dots so they
                // don\'t overflow row width on phones.
                '#' + ROOT_ID + ' .ab-lb-equipped{gap:2px !important;}' +
                // Old simple ab-lb-row used on the Stats-tab mini LB.
                '#' + ROOT_ID + ' .ab-lb-row{flex-wrap:wrap;gap:0.25em 0.6em;font-size:0.85em;}' +
            '}' +
            // Recap hero
            '#' + ROOT_ID + ' .ab-recap-hero{display:flex;align-items:center;gap:1.5em;padding:1.25em;border-radius:14px;background:linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.08));border:1px solid rgba(102,126,234,0.2);margin-bottom:1.5em;flex-wrap:wrap;}' +
            '#' + ROOT_ID + ' .ab-recap-big{flex:0 0 auto;text-align:center;}' +
            '#' + ROOT_ID + ' .ab-recap-big-num{font-size:3.5em;font-weight:900;background:linear-gradient(135deg,#fff,#c7d2ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;}' +
            '#' + ROOT_ID + ' .ab-recap-big-label{font-size:0.72em;text-transform:uppercase;letter-spacing:2px;opacity:0.6;margin-top:0.3em;}' +
            '#' + ROOT_ID + ' .ab-recap-mini-grid{flex:1;min-width:260px;display:grid;grid-template-columns:repeat(2,1fr);gap:0.6em;}' +
            '#' + ROOT_ID + ' .ab-recap-mini{padding:0.7em 0.85em;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;gap:0.75em;}' +
            '#' + ROOT_ID + ' .ab-recap-mini-icon{font-size:1.4em;}' +
            '#' + ROOT_ID + ' .ab-recap-mini-num{font-size:1.3em;font-weight:800;}' +
            '#' + ROOT_ID + ' .ab-recap-mini-label{font-size:0.7em;text-transform:uppercase;letter-spacing:1px;opacity:0.6;}' +
            '#' + ROOT_ID + ' .ab-recap-mini > div:nth-child(2){margin-left:auto;text-align:right;}' +
            // Recap top-N bar charts
            '#' + ROOT_ID + ' .ab-recap-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1em;}' +
            '#' + ROOT_ID + ' .ab-recap-section{padding:1em;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);}' +
            '#' + ROOT_ID + ' .ab-recap-section-title{font-size:0.78em;text-transform:uppercase;letter-spacing:1.5px;opacity:0.7;font-weight:700;display:flex;align-items:center;gap:0.5em;margin-bottom:0.85em;}' +
            '#' + ROOT_ID + ' .ab-recap-bar-row{display:flex;align-items:center;gap:0.6em;margin-bottom:0.55em;}' +
            '#' + ROOT_ID + ' .ab-recap-bar-name{flex:0 0 40%;font-size:0.85em;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '#' + ROOT_ID + ' .ab-recap-bar-track{flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,0.06);overflow:hidden;}' +
            '#' + ROOT_ID + ' .ab-recap-bar-fill{height:100%;background:linear-gradient(90deg,#667eea,#a78bfa);border-radius:4px;transition:width 0.5s;}' +
            '#' + ROOT_ID + ' .ab-recap-bar-val{font-size:0.82em;font-weight:700;color:#c7d2ff;min-width:2.5em;text-align:right;}' +
            // Server stats grid
            '#' + ROOT_ID + ' .ab-server-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.75em;}' +
            '#' + ROOT_ID + ' .ab-server-card{padding:1em;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);text-align:center;transition:transform 0.15s,background 0.15s;}' +
            '#' + ROOT_ID + ' .ab-server-card:hover{background:rgba(255,255,255,0.07);transform:translateY(-2px);}' +
            '#' + ROOT_ID + ' .ab-server-icon{font-size:1.8em;margin-bottom:0.3em;}' +
            '#' + ROOT_ID + ' .ab-server-num{font-size:1.6em;font-weight:800;color:#fff;}' +
            '#' + ROOT_ID + ' .ab-server-label{font-size:0.72em;text-transform:uppercase;letter-spacing:1.5px;opacity:0.6;margin-top:0.3em;font-weight:600;}' +
            '#' + ROOT_ID + ' .ab-server-wide{grid-column:span 2;}' +
            // Compare tab
            '#' + ROOT_ID + ' .ab-cmp-header{display:flex;align-items:center;gap:1em;margin-bottom:1.5em;justify-content:center;}' +
            '#' + ROOT_ID + ' .ab-cmp-user{flex:1;text-align:center;}' +
            '#' + ROOT_ID + ' .ab-cmp-name{font-size:1.3em;font-weight:800;}' +
            '#' + ROOT_ID + ' .ab-cmp-vs{font-size:1.5em;font-weight:900;opacity:0.5;letter-spacing:0.1em;}' +
            '#' + ROOT_ID + ' .ab-cmp-rows{display:flex;flex-direction:column;gap:0.6em;margin-bottom:1.25em;}' +
            '#' + ROOT_ID + ' .ab-cmp-row{display:grid;grid-template-columns:3.5em 1fr 8em 1fr 3.5em;align-items:center;gap:0.6em;}' +
            '#' + ROOT_ID + ' .ab-cmp-val{font-weight:700;font-size:0.95em;}' +
            '#' + ROOT_ID + ' .ab-cmp-val-l{text-align:right;}' +
            '#' + ROOT_ID + ' .ab-cmp-val-r{text-align:left;}' +
            '#' + ROOT_ID + ' .ab-cmp-bar{position:relative;height:10px;border-radius:5px;background:rgba(255,255,255,0.06);overflow:hidden;}' +
            '#' + ROOT_ID + ' .ab-cmp-fill{position:absolute;top:0;height:100%;border-radius:5px;transition:width 0.4s;}' +
            '#' + ROOT_ID + ' .ab-cmp-fill-left{right:0;background:linear-gradient(270deg,#667eea,#764ba2);}' +
            '#' + ROOT_ID + ' .ab-cmp-fill-right{left:0;background:linear-gradient(90deg,#e91e63,#ff6b35);}' +
            '#' + ROOT_ID + ' .ab-cmp-label{text-align:center;font-size:0.74em;text-transform:uppercase;letter-spacing:1px;opacity:0.55;font-weight:600;}' +
            '#' + ROOT_ID + ' .ab-cmp-winner{color:#4ade80;}' +
            '#' + ROOT_ID + ' .ab-cmp-summary{display:flex;flex-wrap:wrap;gap:0.5em;justify-content:center;}' +
            '#' + ROOT_ID + ' .ab-cmp-pill{padding:0.5em 0.85em;border-radius:999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);font-size:0.85em;}' +
            // Activity feed
            '#' + ROOT_ID + ' .ab-pager{display:flex;align-items:center;gap:0.5em;}' +
            '#' + ROOT_ID + ' .ab-pager-btn{width:34px;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;font-size:1.1em;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-pager-btn:hover:not(:disabled){background:rgba(255,255,255,0.12);}' +
            '#' + ROOT_ID + ' .ab-pager-btn:disabled{opacity:0.35;cursor:not-allowed;}' +
            '#' + ROOT_ID + ' .ab-pager-info{font-size:0.85em;opacity:0.7;font-weight:600;}' +
            '#' + ROOT_ID + ' .ab-feed-row{display:flex;align-items:center;gap:0.85em;padding:0.65em 0.85em;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);margin-bottom:0.4em;}' +
            '#' + ROOT_ID + ' .ab-feed-icon{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:1.3em;flex-shrink:0;}' +
            '#' + ROOT_ID + ' .ab-feed-body{flex:1;min-width:0;}' +
            '#' + ROOT_ID + ' .ab-feed-text{font-size:0.95em;}' +
            '#' + ROOT_ID + ' .ab-feed-meta{font-size:0.75em;opacity:0.65;margin-top:0.2em;}' +
            // Category rings
            '#' + ROOT_ID + ' .ab-cat-ring{display:flex;flex-direction:column;align-items:center;padding:0.5em;border-radius:10px;background:rgba(255,255,255,0.03);}' +
            '#' + ROOT_ID + ' .ab-cat-ring-label{font-size:0.78em;font-weight:600;text-align:center;margin-top:0.25em;line-height:1.2;}' +
            '#' + ROOT_ID + ' .ab-cat-ring-sub{font-size:0.7em;opacity:0.6;}' +
            // Records grid
            '#' + ROOT_ID + ' .ab-records-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.6em;}' +
            '#' + ROOT_ID + ' .ab-record{padding:0.85em 0.6em;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);text-align:center;}' +
            '#' + ROOT_ID + ' .ab-record-icon{font-size:1.5em;margin-bottom:0.2em;}' +
            '#' + ROOT_ID + ' .ab-record-val{font-size:1.4em;font-weight:800;color:#fff;}' +
            '#' + ROOT_ID + ' .ab-record-label{font-size:0.7em;text-transform:uppercase;letter-spacing:1px;opacity:0.6;margin-top:0.2em;font-weight:600;}' +
            // Chase modal
            '#' + ROOT_ID + ' .ab-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000000;display:flex;align-items:center;justify-content:center;padding:2em;animation:abFadeIn 0.2s;}' +
            '@keyframes abFadeIn { from { opacity: 0; } to { opacity: 1; } }' +
            '#' + ROOT_ID + ' .ab-modal{max-width:560px;width:100%;max-height:80vh;overflow-y:auto;background:linear-gradient(135deg,#1a1f2e,#0d1017);border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:1.5em;}' +
            '#' + ROOT_ID + ' .ab-modal-close{float:right;background:rgba(255,255,255,0.1);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1em;}' +
            '#' + ROOT_ID + ' .ab-modal-item{padding:0.6em 0.85em;border-radius:8px;background:rgba(255,255,255,0.05);margin-bottom:0.4em;border:1px solid rgba(255,255,255,0.05);}' +
            '#' + ROOT_ID + ' .ab-modal-item-name{font-weight:600;}' +
            '#' + ROOT_ID + ' .ab-modal-item-meta{font-size:0.78em;opacity:0.65;margin-top:0.15em;}' +
            // Pin button (now lives in card footer alongside title/equip)
            '#' + ROOT_ID + ' .ab-card{position:relative;}' +
            '#' + ROOT_ID + ' .ab-pin-btn{width:30px;height:30px;border-radius:7px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#9fb3c8;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;transition:all 0.15s;flex-shrink:0;}' +
            '#' + ROOT_ID + ' .ab-pin-btn:hover{background:rgba(255,255,255,0.12);color:#fff;}' +
            '#' + ROOT_ID + ' .ab-pin-btn .material-icons{font-size:17px !important;line-height:1;}' +
            '#' + ROOT_ID + ' .ab-pin-active{background:rgba(102,126,234,0.18);border-color:#667eea;color:#a3b5f7;box-shadow:inset 0 0 0 1px rgba(102,126,234,0.4);}' +
            '#' + ROOT_ID + ' .ab-pin-active .material-icons{color:#a3b5f7;}' +
            '#' + ROOT_ID + ' .ab-pin-active:hover{background:rgba(102,126,234,0.28);color:#fff;}' +
            '#' + ROOT_ID + ' .ab-card-pinned{border-color:rgba(102,126,234,0.45);background:linear-gradient(135deg,rgba(102,126,234,0.06),rgba(255,255,255,0.03));box-shadow:0 0 0 1px rgba(102,126,234,0.2);}' +
            '#' + ROOT_ID + ' .ab-card-pinned::before{content:"PINNED";position:absolute;top:0.4em;left:0.5em;font-size:0.6em;font-weight:800;letter-spacing:1.2px;padding:0.15em 0.5em;border-radius:4px;background:rgba(102,126,234,0.2);color:#a3b5f7;border:1px solid rgba(102,126,234,0.35);}' +
            // ETA chip
            '#' + ROOT_ID + ' .ab-eta{display:inline-flex;align-items:center;gap:0.35em;margin-top:0.5em;padding:0.3em 0.7em;border-radius:999px;background:rgba(255,152,0,0.12);border:1px solid rgba(255,152,0,0.3);font-size:0.78em;font-weight:600;color:#ffb74d;}' +
            '#' + ROOT_ID + ' .ab-eta .material-icons{font-size:14px !important;}' +
            // Streak header on streak calendar
            '#' + ROOT_ID + ' .ab-streak-header{display:flex;align-items:center;gap:1.5em;margin-bottom:1em;padding:1em 1.25em;border-radius:12px;background:linear-gradient(135deg,rgba(255,87,34,0.12),rgba(255,152,0,0.08));border:1px solid rgba(255,152,0,0.25);}' +
            '#' + ROOT_ID + ' .ab-streak-flame{display:flex;align-items:center;gap:0.75em;}' +
            '#' + ROOT_ID + ' .ab-streak-fire{font-size:2.5em;filter:drop-shadow(0 0 20px rgba(255,107,53,0.6));animation:abFlicker 2.5s ease-in-out infinite;}' +
            '@keyframes abFlicker{0%,100%{transform:scale(1) rotate(-2deg);}50%{transform:scale(1.08) rotate(2deg);}}' +
            '#' + ROOT_ID + ' .ab-streak-stat{padding-left:1.5em;border-left:1px solid rgba(255,255,255,0.1);}' +
            '#' + ROOT_ID + ' .ab-streak-num{font-size:1.8em;font-weight:900;line-height:1;background:linear-gradient(135deg,#ff9800,#ff5722);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}' +
            '#' + ROOT_ID + ' .ab-streak-label{font-size:0.7em;text-transform:uppercase;letter-spacing:1.5px;opacity:0.65;font-weight:700;margin-top:0.2em;}' +
            // Hero streak chip
            '#' + ROOT_ID + ' .ab-hero-streak{display:inline-flex;align-items:center;gap:0.4em;padding:0.3em 0.75em;border-radius:999px;background:rgba(255,87,34,0.15);border:1px solid rgba(255,87,34,0.4);font-size:0.85em;font-weight:700;color:#ffab91;margin-top:0.4em;}' +
            // Grid-based heatmap (proper square cells)
            // Heatmap + streak calendar.
            // DESKTOP (> 640px): full-width grid that stretches each cell
            //   via `aspect-ratio:1` so cells scale with container width.
            //   This is the look people said was "perfect on pc" — we hide
            //   the day/month labels + legend + horizontal-scroll wrapper
            //   chrome because the full-width grid doesn't need them.
            // MOBILE (<= 640px): fixed-size cells in a horizontally-scrollable
            //   container, with day-of-week + month labels + legend, so the
            //   cells stay readable at phone widths instead of crushing to
            //   ~4px squares.
            '#' + ROOT_ID + ' .ab-cal-wrap{}' +
            '#' + ROOT_ID + ' .ab-cal-grid{display:grid;grid-template-columns:1fr;}' +
            '#' + ROOT_ID + ' .ab-cal-daylabels,#' + ROOT_ID + ' .ab-cal-monthlabels,#' + ROOT_ID + ' .ab-cal-legend{display:none;}' +
            '#' + ROOT_ID + ' .ab-heat,#' + ROOT_ID + ' .ab-streak-grid{display:grid;grid-auto-rows:1fr;grid-template-rows:repeat(7,1fr);grid-auto-flow:column;gap:3px;width:100%;}' +
            '#' + ROOT_ID + ' .ab-heat-cell,#' + ROOT_ID + ' .ab-streak-cell{aspect-ratio:1;border-radius:3px;transition:transform 0.1s;}' +
            '#' + ROOT_ID + ' .ab-heat-cell:hover,#' + ROOT_ID + ' .ab-streak-cell:hover{transform:scale(1.3);z-index:2;position:relative;}' +
            // Mobile-only overrides. `!important` beats the inline
            // `grid-template-columns:repeat(N,1fr)` that the renderer
            // still emits for desktop.
            '@media (max-width: 640px){' +
                '#' + ROOT_ID + ' .ab-cal-wrap{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;padding-bottom:0.5em;margin:0 -0.5em;padding-left:0.5em;padding-right:0.5em;}' +
                '#' + ROOT_ID + ' .ab-cal-grid{grid-template-columns:auto 1fr;column-gap:0.5em;row-gap:0.25em;align-items:start;}' +
                '#' + ROOT_ID + ' .ab-cal-daylabels{display:grid !important;grid-template-rows:repeat(7,12px);gap:2px;padding-top:16px;font-size:0.65em;color:rgba(255,255,255,0.5);font-weight:600;line-height:12px;}' +
                '#' + ROOT_ID + ' .ab-cal-monthlabels{display:grid !important;grid-auto-flow:column;grid-auto-columns:12px;gap:2px;height:14px;font-size:0.62em;color:rgba(255,255,255,0.5);font-weight:600;line-height:14px;align-items:center;}' +
                '#' + ROOT_ID + ' .ab-cal-month{grid-column:span var(--span,4);}' +
                '#' + ROOT_ID + ' .ab-heat,#' + ROOT_ID + ' .ab-streak-grid{grid-template-rows:repeat(7,12px) !important;grid-auto-columns:12px !important;grid-template-columns:none !important;width:auto !important;gap:2px !important;}' +
                '#' + ROOT_ID + ' .ab-heat-cell,#' + ROOT_ID + ' .ab-streak-cell{width:12px;height:12px;aspect-ratio:auto !important;}' +
                '#' + ROOT_ID + ' .ab-cal-legend{display:flex !important;align-items:center;gap:0.5em;font-size:0.72em;color:rgba(255,255,255,0.6);margin-top:0.5em;flex-wrap:wrap;}' +
                '#' + ROOT_ID + ' .ab-cal-legend-scale{display:flex;gap:2px;}' +
                '#' + ROOT_ID + ' .ab-cal-legend-cell{width:12px;height:12px;border-radius:2px;}' +
            '}' +
            // Grid-based streak calendar
            '#' + ROOT_ID + ' .ab-streak-grid{display:grid;grid-auto-rows:1fr;grid-template-rows:repeat(7,1fr);grid-auto-flow:column;gap:3px;width:100%;}' +
            '#' + ROOT_ID + ' .ab-streak-cell{aspect-ratio:1;border-radius:3px;background:rgba(255,255,255,0.04);transition:transform 0.1s;}' +
            '#' + ROOT_ID + ' .ab-streak-cell-on{background:linear-gradient(135deg,#4caf50,#66bb6a);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12);}' +
            '#' + ROOT_ID + ' .ab-streak-cell:hover{transform:scale(1.5);z-index:2;position:relative;}' +
            // Wrapped tab - modern redesign
            '#' + ROOT_ID + ' .ab-wrapped-hero{position:relative;padding:3em 2em;border-radius:24px;background:linear-gradient(135deg,#6b00ff 0%,#9c27b0 40%,#e91e63 80%,#ff6b35 100%);text-align:center;margin-bottom:1.5em;overflow:hidden;}' +
            '#' + ROOT_ID + ' .ab-wrapped-hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 20% 30%,rgba(255,255,255,0.15),transparent 50%),radial-gradient(circle at 80% 70%,rgba(255,255,255,0.1),transparent 50%);}' +
            '#' + ROOT_ID + ' .ab-wrapped-hero > *{position:relative;}' +
            '#' + ROOT_ID + ' .ab-wrapped-hero-label{font-size:0.85em;font-weight:700;letter-spacing:3px;text-transform:uppercase;opacity:0.85;margin-bottom:0.4em;}' +
            '#' + ROOT_ID + ' .ab-wrapped-hero-year{font-size:1.4em;font-weight:900;letter-spacing:-1px;margin-bottom:0.5em;}' +
            '#' + ROOT_ID + ' .ab-wrapped-hero-big{font-size:6em;font-weight:900;line-height:0.95;letter-spacing:-4px;text-shadow:0 4px 30px rgba(0,0,0,0.4);}' +
            '#' + ROOT_ID + ' .ab-wrapped-hero-sub{font-size:1em;font-weight:600;opacity:0.9;margin-top:0.5em;}' +
            '#' + ROOT_ID + ' .ab-wrapped-section{margin-top:1.5em;}' +
            '#' + ROOT_ID + ' .ab-wrapped-section-title{font-size:0.75em;font-weight:800;letter-spacing:2px;text-transform:uppercase;opacity:0.6;margin-bottom:0.75em;padding-left:0.25em;}' +
            '#' + ROOT_ID + ' .ab-wrapped-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.75em;}' +
            '#' + ROOT_ID + ' .ab-wrapped-card{position:relative;padding:1.5em 1.3em;border-radius:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);overflow:hidden;transition:all 0.2s;}' +
            '#' + ROOT_ID + ' .ab-wrapped-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,0.2);}' +
            '#' + ROOT_ID + ' .ab-wrapped-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#667eea,#764ba2);}' +
            '#' + ROOT_ID + ' .ab-wrapped-card.warm::before{background:linear-gradient(90deg,#ff6b35,#e91e63);}' +
            '#' + ROOT_ID + ' .ab-wrapped-card.cool::before{background:linear-gradient(90deg,#2196f3,#00bcd4);}' +
            '#' + ROOT_ID + ' .ab-wrapped-card.gold::before{background:linear-gradient(90deg,#ffd700,#ff6b35);}' +
            '#' + ROOT_ID + ' .ab-wrapped-card.green::before{background:linear-gradient(90deg,#4caf50,#8bc34a);}' +
            '#' + ROOT_ID + ' .ab-wrapped-icon{font-size:1.6em;opacity:0.55;margin-bottom:0.4em;}' +
            '#' + ROOT_ID + ' .ab-wrapped-big{font-size:2.8em;font-weight:900;line-height:1;letter-spacing:-1px;margin-bottom:0.2em;}' +
            '#' + ROOT_ID + ' .ab-wrapped-label{font-size:0.72em;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;opacity:0.6;}' +
            '#' + ROOT_ID + ' .ab-wrapped-list{list-style:none;padding:0;margin:0.5em 0 0;}' +
            '#' + ROOT_ID + ' .ab-wrapped-list li{display:flex;justify-content:space-between;padding:0.4em 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:0.92em;}' +
            '#' + ROOT_ID + ' .ab-wrapped-list li:last-child{border-bottom:none;}' +
            '#' + ROOT_ID + ' .ab-wrapped-list li strong{font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-wrapped-list li span{opacity:0.65;font-weight:600;}' +
            // Smart goals row
            '#' + ROOT_ID + ' .ab-goals-row{display:flex;gap:0.65em;overflow-x:auto;padding:0.25em 0 0.75em;margin-bottom:1em;}' +
            '#' + ROOT_ID + ' .ab-goal-card{flex:0 0 auto;min-width:240px;max-width:340px;padding:0.85em 1em;border-radius:12px;background:linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.08));border:1px solid rgba(102,126,234,0.25);cursor:pointer;transition:transform 0.15s;}' +
            '#' + ROOT_ID + ' .ab-goal-card:hover{transform:translateY(-2px);border-color:rgba(102,126,234,0.5);}' +
            '#' + ROOT_ID + ' .ab-goal-label{font-size:0.68em;text-transform:uppercase;letter-spacing:1.5px;opacity:0.6;font-weight:700;margin-bottom:0.25em;}' +
            '#' + ROOT_ID + ' .ab-goal-text{font-size:0.92em;font-weight:600;line-height:1.3;}' +
            '#' + ROOT_ID + ' .ab-goal-meta{font-size:0.72em;opacity:0.6;margin-top:0.4em;font-weight:600;}' +
            // Compare history pills
            '#' + ROOT_ID + ' .ab-cmp-history-pill{padding:0.55em 0.9em;border-radius:999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;font-family:inherit;cursor:pointer;font-size:0.85em;transition:all 0.15s;}' +
            '#' + ROOT_ID + ' .ab-cmp-history-pill:hover{background:rgba(102,126,234,0.15);border-color:rgba(102,126,234,0.4);}' +
            // Preferences panel
            '#' + ROOT_ID + ' .ab-prefs{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:0.75em;margin-top:0.75em;}' +
            '#' + ROOT_ID + ' .ab-pref{display:flex;align-items:center;gap:0.6em;padding:0.75em 0.9em;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);cursor:pointer;}' +
            '#' + ROOT_ID + ' .ab-pref:hover{background:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-pref input[type="checkbox"]{width:18px;height:18px;flex-shrink:0;cursor:pointer;}' +
            '#' + ROOT_ID + ' .ab-pref-label{flex:1;font-size:0.9em;font-weight:600;}' +
            '#' + ROOT_ID + ' .ab-pref-desc{font-size:0.75em;opacity:0.65;font-weight:500;margin-top:0.15em;}' +
            // Title display
            '#' + ROOT_ID + ' .ab-title-display{display:inline-block;padding:0.25em 0.7em;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);font-size:0.85em;font-weight:600;}' +
            '#' + ROOT_ID + ' .ab-title-btn{background:rgba(102,126,234,0.15);border-color:rgba(102,126,234,0.3);}' +
            '#' + ROOT_ID + ' .ab-prestige-btn{position:relative;padding:1.1em 3em;border-radius:14px;border:none;background:linear-gradient(135deg,#ffd700 0%,#ff6b35 50%,#e91e63 100%);color:#1a0a1f;font-weight:900;font-size:1.1em;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;box-shadow:0 10px 40px rgba(255,107,53,0.35),inset 0 1px 0 rgba(255,255,255,0.4),inset 0 -2px 0 rgba(0,0,0,0.25);transition:transform 0.2s,box-shadow 0.3s;overflow:hidden;font-family:inherit;}' +
            '#' + ROOT_ID + ' .ab-prestige-btn::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,0.55) 50%,transparent 70%);transform:translateX(-120%);transition:transform 0.8s cubic-bezier(.22,.61,.36,1);}' +
            '#' + ROOT_ID + ' .ab-prestige-btn:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 16px 50px rgba(255,107,53,0.55),inset 0 1px 0 rgba(255,255,255,0.5),inset 0 -2px 0 rgba(0,0,0,0.3);}' +
            '#' + ROOT_ID + ' .ab-prestige-btn:hover::before{transform:translateX(120%);}' +
            '#' + ROOT_ID + ' .ab-prestige-btn:disabled{cursor:not-allowed;background:linear-gradient(135deg,rgba(100,100,120,0.4),rgba(60,60,80,0.6));color:rgba(255,255,255,0.35);box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);}' +
            '#' + ROOT_ID + ' .ab-prestige-btn:disabled::before{display:none;}' +
            '#' + ROOT_ID + ' .ab-prestige-btn:disabled:hover{transform:none;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);}' +
            '#' + ROOT_ID + ' .ab-wrap{max-width:1500px;margin:0 auto;}' +
            '#' + ROOT_ID + ' .ab-topbar{display:flex;justify-content:space-between;align-items:center;gap:1em;flex-wrap:wrap;margin-bottom:1.2em;}' +
            '#' + ROOT_ID + ' .ab-back{padding:0.6em 1em;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#fff;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:0.5em;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-hero{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1em;padding:1.4em;border-radius:18px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);}' +
            '#' + ROOT_ID + ' .ab-hero-left{display:flex;align-items:center;gap:1em;}' +
            '#' + ROOT_ID + ' .ab-hero-icon{width:60px;height:60px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);font-size:1.6em;}' +
            '#' + ROOT_ID + ' .ab-hero-title{font-size:1.25em;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-hero-sub{font-size:0.92em;opacity:0.8;margin-top:0.2em;}' +
            '#' + ROOT_ID + ' .ab-showcase{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.8em;margin-top:1em;}' +
            '#' + ROOT_ID + ' .ab-sc-card{display:flex;align-items:center;gap:0.6em;padding:0.7em;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);}' +
            '#' + ROOT_ID + ' .ab-sc-icon{width:36px;height:36px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-stats{margin-top:1.5em;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1em;}' +
            '#' + ROOT_ID + ' .ab-stat{padding:1em;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);}' +
            '#' + ROOT_ID + ' .ab-stat-t{font-size:0.9em;opacity:0.8;}' +
            '#' + ROOT_ID + ' .ab-stat-v{font-size:2em;font-weight:700;margin-top:0.2em;}' +
            '#' + ROOT_ID + ' .ab-tabs{margin-top:1.5em;display:flex;gap:0.65em;flex-wrap:wrap;}' +
            '#' + ROOT_ID + ' .ab-tab{padding:0.55em 0.95em;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);cursor:pointer;font-weight:700;color:#fff;}' +
            '#' + ROOT_ID + ' .ab-tab.active{background:rgba(255,255,255,0.12);}' +
            '#' + ROOT_ID + ' .ab-panel{margin-top:1.5em;}' +
            '#' + ROOT_ID + ' .ab-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1em;margin-top:1em;}' +
            '#' + ROOT_ID + ' .ab-card{padding:1em;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);}' +
            '#' + ROOT_ID + ' .ab-card.ab-toast-focus{outline:3px solid #fbbf24;outline-offset:4px;animation:abToastFocusPulse 1.15s ease-in-out 3;}' +
            '@keyframes abToastFocusPulse{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,0.2);}50%{box-shadow:0 0 0 10px rgba(251,191,36,0.28),0 12px 34px rgba(0,0,0,0.38);}}' +
            '#' + ROOT_ID + ' .ab-card-h{display:flex;gap:0.8em;align-items:center;margin-bottom:0.7em;}' +
            '#' + ROOT_ID + ' .ab-card-icon{width:42px;height:42px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);font-size:1.2em;flex-shrink:0;}' +
            '#' + ROOT_ID + ' .ab-card-title{font-size:1.05em;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-card-meta{font-size:0.92em;opacity:0.9;}' +
            '#' + ROOT_ID + ' .ab-desc{margin-top:0.5em;line-height:1.45;}' +
            '#' + ROOT_ID + ' .ab-prog-text{display:flex;justify-content:space-between;font-size:0.92em;margin:0.7em 0 0.35em;opacity:0.8;}' +
            '#' + ROOT_ID + ' .ab-prog-bar{height:10px;border-radius:999px;overflow:hidden;background:#0f1318;border:1px solid rgba(255,255,255,0.1);}' +
            '#' + ROOT_ID + ' .ab-prog-fill{height:100%;background:#60a5fa;}' +
            '#' + ROOT_ID + ' .ab-footer{margin-top:0.8em;display:flex;justify-content:space-between;align-items:center;gap:0.6em;flex-wrap:wrap;}' +
            '#' + ROOT_ID + ' .ab-btn{padding:0.5em 0.85em;border-radius:8px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;}' +
            '#' + ROOT_ID + ' .ab-unlocked{color:#4ade80;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-locked{color:#f87171;font-weight:700;}' +
            '#' + ROOT_ID + ' .ab-r-common{color:#9fb3c8;}' +
            '#' + ROOT_ID + ' .ab-r-uncommon{color:#34d399;}' +
            '#' + ROOT_ID + ' .ab-r-rare{color:#60a5fa;}' +
            '#' + ROOT_ID + ' .ab-r-epic{color:#a78bfa;}' +
            '#' + ROOT_ID + ' .ab-r-legendary{color:#fbbf24;}' +
            '#' + ROOT_ID + ' .ab-r-mythic{color:#f43f5e;}' +
            // Rarity-colored borders on badge cards
            '#' + ROOT_ID + ' .ab-card.ab-r-common-border{border:2px solid rgba(159,179,200,0.6);box-shadow:0 0 0 1px rgba(159,179,200,0.15);}' +
            '#' + ROOT_ID + ' .ab-card.ab-r-uncommon-border{border:2px solid rgba(52,211,153,0.65);box-shadow:0 0 0 1px rgba(52,211,153,0.2);}' +
            '#' + ROOT_ID + ' .ab-card.ab-r-rare-border{border:2px solid rgba(96,165,250,0.65);box-shadow:0 0 0 1px rgba(96,165,250,0.25),0 0 16px rgba(96,165,250,0.08);}' +
            '#' + ROOT_ID + ' .ab-card.ab-r-epic-border{border:2px solid rgba(167,139,250,0.7);box-shadow:0 0 0 1px rgba(167,139,250,0.3),0 0 20px rgba(167,139,250,0.12);}' +
            '#' + ROOT_ID + ' .ab-card.ab-r-legendary-border{border-color:rgba(251,191,36,0.55);box-shadow:0 0 0 1px rgba(251,191,36,0.25),0 0 24px rgba(251,191,36,0.12);}' +
            '#' + ROOT_ID + ' .ab-card.ab-r-mythic-border{border-color:rgba(244,63,94,0.6);box-shadow:0 0 0 1px rgba(244,63,94,0.3),0 0 28px rgba(244,63,94,0.15);}' +
            // Same borders for goal cards
            '#' + ROOT_ID + ' .ab-goal-card.ab-r-common-border{border:2px solid rgba(159,179,200,0.6);}' +
            '#' + ROOT_ID + ' .ab-goal-card.ab-r-uncommon-border{border:2px solid rgba(52,211,153,0.65);}' +
            '#' + ROOT_ID + ' .ab-goal-card.ab-r-rare-border{border:2px solid rgba(96,165,250,0.65);}' +
            '#' + ROOT_ID + ' .ab-goal-card.ab-r-epic-border{border:2px solid rgba(167,139,250,0.7);}' +
            '#' + ROOT_ID + ' .ab-goal-card.ab-r-legendary-border{border-color:rgba(251,191,36,0.6);}' +
            '#' + ROOT_ID + ' .ab-goal-card.ab-r-mythic-border{border-color:rgba(244,63,94,0.65);}' +
            '#' + ROOT_ID + ' .ab-lb-row{display:flex;justify-content:space-between;gap:1em;padding:0.75em 0;border-bottom:1px solid rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-lb-row:last-child{border-bottom:none;}' +
            '#' + ROOT_ID + ' .ab-panel-card{padding:1.1em;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);overflow:hidden;}' +
            '#' + ROOT_ID + ' .ab-panel{min-width:0;}' +
            '#' + ROOT_ID + ' .ab-panel-card > *{min-width:0;}' +
            // Tighter padding on phones so content has maximum width.
            '@media (max-width: 640px){#' + ROOT_ID + ' .ab-panel-card{padding:0.75em;border-radius:10px;}}' +
            '#' + ROOT_ID + ' .ab-muted{opacity:0.7;}' +
            '#' + ROOT_ID + ' .ab-error{margin-top:1em;padding:1em;border:1px solid rgba(248,113,113,0.45);border-radius:12px;background:rgba(248,113,113,0.08);color:#fca5a5;}' +
            '#' + ROOT_ID + ' .ab-eyebrow{font-size:0.88em;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9fb3c8;margin-bottom:0.7em;}' +
            // Theme overrides that unlock as the user reaches higher ranks
            '#' + ROOT_ID + '.ab-theme-enthusiast .ab-hero{background:linear-gradient(135deg,rgba(33,150,243,0.15),rgba(255,255,255,0.05));}' +
            '#' + ROOT_ID + '.ab-theme-binger .ab-hero{background:linear-gradient(135deg,rgba(156,39,176,0.18),rgba(255,255,255,0.05));border-color:rgba(156,39,176,0.35);}' +
            '#' + ROOT_ID + '.ab-theme-connoisseur .ab-hero{background:linear-gradient(135deg,rgba(233,30,99,0.2),rgba(255,255,255,0.05));border-color:rgba(233,30,99,0.45);}' +
            '#' + ROOT_ID + '.ab-theme-maestro .ab-hero{background:linear-gradient(135deg,rgba(255,152,0,0.2),rgba(255,255,255,0.05));border-color:rgba(255,152,0,0.45);box-shadow:0 0 40px rgba(255,152,0,0.15);}' +
            '#' + ROOT_ID + '.ab-theme-legend .ab-hero{background:linear-gradient(135deg,rgba(244,67,54,0.22),rgba(255,152,0,0.15));border-color:#ff6b35;box-shadow:0 0 60px rgba(244,67,54,0.2);}' +
            '#' + ROOT_ID + '.ab-theme-immortal{background:radial-gradient(circle at top,#1a0f2e 0%,#0d0618 100%);}' +
            '#' + ROOT_ID + '.ab-theme-immortal .ab-hero{background:linear-gradient(135deg,rgba(255,215,0,0.22),rgba(156,39,176,0.15));border-color:#ffd700;box-shadow:0 0 80px rgba(255,215,0,0.3);}' +
            '@media(max-width:900px){#' + ROOT_ID + '{padding:1em;}}' +
            // Settings panel
            '#' + ROOT_ID + ' .ab-settings-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0.75em;}' +
            '#' + ROOT_ID + ' .ab-settings-section{margin-bottom:1.5em;}' +
            '#' + ROOT_ID + ' .ab-settings-section .ab-eyebrow{margin-bottom:0.6em;padding-bottom:0.4em;border-bottom:1px solid rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-toggle{display:flex;align-items:center;gap:0.75em;padding:0.7em 0.9em;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:background 0.15s;}' +
            '#' + ROOT_ID + ' .ab-toggle:hover{background:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-toggle-switch{position:relative;width:40px;height:22px;flex-shrink:0;}' +
            '#' + ROOT_ID + ' .ab-toggle-switch input{opacity:0;width:0;height:0;position:absolute;}' +
            '#' + ROOT_ID + ' .ab-toggle-track{position:absolute;inset:0;border-radius:11px;background:rgba(255,255,255,0.15);transition:background 0.2s;cursor:pointer;}' +
            '#' + ROOT_ID + ' .ab-toggle-track::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);}' +
            '#' + ROOT_ID + ' .ab-toggle-switch input:checked + .ab-toggle-track{background:#667eea;}' +
            '#' + ROOT_ID + ' .ab-toggle-switch input:checked + .ab-toggle-track::after{transform:translateX(18px);}' +
            '#' + ROOT_ID + ' .ab-toggle-info{flex:1;min-width:0;}' +
            '#' + ROOT_ID + ' .ab-toggle-label{font-size:0.9em;font-weight:600;}' +
            '#' + ROOT_ID + ' .ab-toggle-desc{font-size:0.75em;opacity:0.6;margin-top:0.1em;}' +
            '#' + ROOT_ID + ' .ab-setting-row{display:flex;align-items:center;gap:0.75em;padding:0.7em 0.9em;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-setting-row .ab-select,#' + ROOT_ID + ' .ab-setting-row .ab-input{max-width:180px;}' +
            '#' + ROOT_ID + ' .ab-setting-row .ab-toggle-info{flex:1;}' +
            // Dark theme
            '#' + ROOT_ID + '.ab-theme-dark{background:#0a0a0a !important;}' +
            '#' + ROOT_ID + '.ab-theme-dark .ab-hero{background:rgba(0,0,0,0.4);border-color:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-dark .ab-stat{background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-dark .ab-panel-card{background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-dark .ab-card{background:rgba(0,0,0,0.4);border-color:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-dark .ab-tab{background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-dark .ab-tab.active{background:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-dark{color:rgba(255,255,255,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-dark .ab-toggle,#' + ROOT_ID + '.ab-theme-dark .ab-setting-row{background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-dark .ab-input,#' + ROOT_ID + '.ab-theme-dark .ab-select{background:rgba(0,0,0,0.5);border-color:rgba(255,255,255,0.08);}' +
            // Light theme
            '#' + ROOT_ID + '.ab-theme-light{background:#f5f5f5 !important;color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-hero{background:rgba(255,255,255,0.92);border-color:rgba(0,0,0,0.12);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-stat{background:rgba(255,255,255,0.92);border-color:rgba(0,0,0,0.12);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-stat-t{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-stat-v{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-panel-card{background:rgba(255,255,255,0.92);border-color:rgba(0,0,0,0.12);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card{background:rgba(255,255,255,0.92);border-color:rgba(0,0,0,0.12);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-tab{background:rgba(0,0,0,0.05);border-color:rgba(0,0,0,0.12);color:rgba(0,0,0,0.75);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-tab.active{background:rgba(0,0,0,0.12);color:rgba(0,0,0,0.9);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-eyebrow{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-muted{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-input,#' + ROOT_ID + '.ab-theme-light .ab-select{background:rgba(255,255,255,0.95);border-color:rgba(0,0,0,0.15);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-select option{background:#fff;color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-toggle,#' + ROOT_ID + '.ab-theme-light .ab-setting-row{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.1);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-toggle:hover{background:rgba(0,0,0,0.06);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-toggle-track{background:rgba(0,0,0,0.2);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-back{background:rgba(0,0,0,0.05);border-color:rgba(0,0,0,0.12);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-hero-sub{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-btn{background:rgba(0,0,0,0.05);border-color:rgba(0,0,0,0.12);color:rgba(0,0,0,0.8);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-prog-bar{background:rgba(0,0,0,0.08);border-color:rgba(0,0,0,0.12);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-settings-section .ab-eyebrow{border-bottom-color:rgba(0,0,0,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-light h2,#' + ROOT_ID + '.ab-theme-light h3{color:rgba(0,0,0,0.85);}' +
            // Light theme — rank progress bar fill
            '#' + ROOT_ID + '.ab-theme-light .ab-prog-fill{background:#3b82f6;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-prog-bar{background:rgba(0,0,0,0.1);border-color:rgba(0,0,0,0.15);}' +
            // Light theme — streak section
            '#' + ROOT_ID + '.ab-theme-light .ab-streak-header{background:linear-gradient(135deg,rgba(255,87,34,0.15),rgba(255,152,0,0.1));border-color:rgba(255,152,0,0.35);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-streak-label{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-streak-stat{border-left-color:rgba(0,0,0,0.12);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-streak-cell{background:rgba(0,0,0,0.06);}' +
            // Light theme — compare pills and bars
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-pill{background:rgba(0,0,0,0.05);border-color:rgba(0,0,0,0.15);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-history-pill{background:rgba(0,0,0,0.05);border-color:rgba(0,0,0,0.15);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-history-pill:hover{background:rgba(102,126,234,0.12);border-color:rgba(102,126,234,0.4);color:rgba(0,0,0,0.9);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-bar{background:rgba(0,0,0,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-name{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-val{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-label{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-winner{color:#16a34a;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-vs{color:rgba(0,0,0,0.4);}' +
            // Light theme — leaderboard / podium
            '#' + ROOT_ID + '.ab-theme-light .ab-lb-row-new{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.1);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-lb-rank{color:#475569;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-lb-name{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-lb-value{color:#4338ca;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-lb-bar{background:rgba(0,0,0,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-lb-podium-name{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-lb-podium-val{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-lb-podium-bar{color:rgba(0,0,0,0.7);box-shadow:0 -4px 12px rgba(0,0,0,0.1) inset;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-lb-row{border-bottom-color:rgba(0,0,0,0.08);color:rgba(0,0,0,0.85);}' +
            // Light theme — recap section
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-big-num{background:linear-gradient(135deg,#1e3a5f,#4338ca);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-big-label{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-mini{background:rgba(0,0,0,0.04);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-mini-num{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-mini-label{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-section{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.1);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-section-title{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-bar-name{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-bar-track{background:rgba(0,0,0,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-bar-val{color:#4338ca;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-recap-hero{background:linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.12));border-color:rgba(102,126,234,0.3);}' +
            // Light theme — wrapped cards
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-card{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.1);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-card:hover{border-color:rgba(0,0,0,0.25);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-big{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-label{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-icon{color:rgba(0,0,0,0.55);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-section-title{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-list li{border-bottom-color:rgba(0,0,0,0.08);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-list li span{color:rgba(0,0,0,0.6);}' +
            // Light theme — badge cards: shadows, descriptions, footer text
            '#' + ROOT_ID + '.ab-theme-light .ab-card{box-shadow:0 2px 8px rgba(0,0,0,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-desc{color:rgba(0,0,0,0.7);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card-title{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card-meta{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card-icon{background:rgba(0,0,0,0.07);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-prog-text{color:rgba(0,0,0,0.65);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-unlocked{color:#16a34a;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-locked{color:#dc2626;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-badge-pts{color:rgba(0,0,0,0.6);}' +
            // Light theme — toggle label/description text
            '#' + ROOT_ID + '.ab-theme-light .ab-toggle-label{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-toggle-desc{color:rgba(0,0,0,0.6);}' +
            // Light theme — generic white text fallback
            '#' + ROOT_ID + '.ab-theme-light .ab-btn{color:rgba(0,0,0,0.8);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-pager{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-error{color:#dc2626;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-eta{color:rgba(0,0,0,0.6);}' +
            // Light theme — streak heatmap cells
            '#' + ROOT_ID + '.ab-theme-light .ab-streak-cell{background:rgba(0,0,0,0.06);border:1px solid rgba(0,0,0,0.1);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-streak-cell[style*="background"]{border-color:rgba(0,0,0,0.15);}' +
            // Light theme — personal records
            '#' + ROOT_ID + '.ab-theme-light .ab-record{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.1);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-record-val{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-record-label{color:rgba(0,0,0,0.6);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-records-grid{color:rgba(0,0,0,0.85);}' +
            // Light theme — server stats
            '#' + ROOT_ID + '.ab-theme-light .ab-server-card{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.1);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-server-card:hover{background:rgba(0,0,0,0.06);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-server-num{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-server-label{color:rgba(0,0,0,0.6);opacity:1;}' +
            // Light theme — notification/pref labels
            '#' + ROOT_ID + '.ab-theme-light .ab-pref-label{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-pref-desc{color:rgba(0,0,0,0.6);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-pref{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-prefs{color:rgba(0,0,0,0.85);}' +
            // Light theme — badge card border + shadow
            '#' + ROOT_ID + '.ab-theme-light .ab-card{border:1px solid rgba(0,0,0,0.12);box-shadow:0 2px 8px rgba(0,0,0,0.08);}' +
            // Light theme — rank progress bar
            '#' + ROOT_ID + '.ab-theme-light .ab-prog-fill{background:#3b82f6;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-prog-text{color:rgba(0,0,0,0.7);}' +
            // Light theme — compare stats
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-metric{color:rgba(0,0,0,0.75);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-label{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-vs{color:rgba(0,0,0,0.4);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-name{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cmp-val{color:rgba(0,0,0,0.85);}' +
            // Light theme — category completion rings
            '#' + ROOT_ID + '.ab-theme-light .ab-cat-ring{background:rgba(0,0,0,0.03);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cat-ring-label{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cat-ring-sub{color:rgba(0,0,0,0.6);opacity:1;}' +
            // Light theme — activity feed
            '#' + ROOT_ID + '.ab-theme-light .ab-feed-row{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.08);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-feed-icon{background:rgba(0,0,0,0.07);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-feed-text{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-feed-meta{color:rgba(0,0,0,0.6);opacity:1;}' +
            // Light theme — goal cards
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-card{background:linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.06));border-color:rgba(102,126,234,0.3);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-label{color:rgba(0,0,0,0.6);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-text{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-meta{color:rgba(0,0,0,0.6);opacity:1;}' +
            // Light theme — settings section
            '#' + ROOT_ID + '.ab-theme-light .ab-settings-section{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-settings-grid{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-setting-row{color:rgba(0,0,0,0.85);}' +
            // Light theme — muted text override
            '#' + ROOT_ID + '.ab-theme-light .ab-muted{color:rgba(0,0,0,0.6);}' +
            // Light theme — input fields
            '#' + ROOT_ID + '.ab-theme-light .ab-input{background:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.15);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-select{background:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.15);color:rgba(0,0,0,0.85);}' +
            // Light theme — heatmap cells (ab-heat-cell: empty cells invisible on white without this)
            '#' + ROOT_ID + '.ab-theme-light .ab-heat-cell{border:1px solid rgba(0,0,0,0.08);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-heat-cell.ab-heat-empty{background:rgba(0,0,0,0.06) !important;}' +
            // Light theme — SVG text inside category rings, watch clock, genre radar
            '#' + ROOT_ID + '.ab-theme-light .ab-cat-ring svg text{fill:rgba(0,0,0,0.85) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-panel-card svg text{fill:rgba(0,0,0,0.7) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-panel-card svg circle[stroke="rgba(255,255,255,0.1)"]{stroke:rgba(0,0,0,0.1);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-panel-card svg circle[stroke="rgba(255,255,255,0.08)"]{stroke:rgba(0,0,0,0.1);}' +
            // Light theme — streak header numbers and flame
            '#' + ROOT_ID + '.ab-theme-light .ab-streak-num{background:linear-gradient(135deg,#e65100,#bf360c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-streak-cell-on{background:linear-gradient(135deg,#388e3c,#4caf50) !important;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.1);}' +
            // Light theme — quest cards text
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelQuests .ab-muted{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelQuests [style*="font-weight:700"]{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelQuests div[style*="background:rgba(255,255,255,0.04)"]{background:rgba(0,0,0,0.03) !important;border-color:rgba(0,0,0,0.1) !important;color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelQuests div[style*="background:rgba(255,255,255,0.08)"]{background:rgba(0,0,0,0.08) !important;}' +
            // Light theme — badge card rarity borders and equipped highlight
            '#' + ROOT_ID + '.ab-theme-light .ab-card .ab-card-icon{background:rgba(0,0,0,0.07);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card.ab-r-common-border{border:2px solid rgba(120,144,170,0.7) !important;box-shadow:0 0 0 1px rgba(120,144,170,0.2);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card.ab-r-uncommon-border{border:2px solid rgba(16,185,129,0.7) !important;box-shadow:0 0 0 1px rgba(16,185,129,0.2);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card.ab-r-rare-border{border:2px solid rgba(59,130,246,0.7) !important;box-shadow:0 0 0 1px rgba(59,130,246,0.25);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card.ab-r-epic-border{border:2px solid rgba(139,92,246,0.7) !important;box-shadow:0 0 0 1px rgba(139,92,246,0.3),0 0 20px rgba(139,92,246,0.1);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card.ab-r-legendary-border{border-color:rgba(251,191,36,0.5) !important;box-shadow:0 0 0 1px rgba(251,191,36,0.3),0 0 24px rgba(251,191,36,0.15);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card.ab-r-mythic-border{border-color:rgba(244,63,94,0.5) !important;box-shadow:0 0 0 1px rgba(244,63,94,0.35),0 0 28px rgba(244,63,94,0.18);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-card.ab-r-common-border{border:2px solid rgba(120,144,170,0.7) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-card.ab-r-uncommon-border{border:2px solid rgba(16,185,129,0.7) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-card.ab-r-rare-border{border:2px solid rgba(59,130,246,0.7) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-card.ab-r-epic-border{border:2px solid rgba(139,92,246,0.7) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-card.ab-r-legendary-border{border-color:rgba(251,191,36,0.5) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-card.ab-r-mythic-border{border-color:rgba(244,63,94,0.5) !important;}' +
            // Light theme — "Your data" section stat numbers and histogram bars
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelStats h3{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelStats h4{color:rgba(0,0,0,0.75);}' +
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelStats .ab-stat-v{color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelStats .ab-stat-t{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelStats span{color:rgba(0,0,0,0.75);}' +
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelStats div[style*="background:rgba(255,255,255,0.1)"]{background:rgba(0,0,0,0.08) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light #abSaPanelStats div[style*="background:rgba(255,255,255,0.08)"]{background:rgba(0,0,0,0.06) !important;}' +
            // Light theme — prestige button
            '#' + ROOT_ID + '.ab-theme-light .ab-prestige-btn{color:rgba(0,0,0,0.85);border-color:rgba(0,0,0,0.2);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-prestige-btn:disabled{color:rgba(0,0,0,0.4);}' +
            // Light theme — hero section text
            '#' + ROOT_ID + '.ab-theme-light .ab-hero-streak{background:rgba(255,87,34,0.12);border-color:rgba(255,87,34,0.35);color:#bf360c;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-title-display{filter:brightness(0.7);}' +
            // Welcome banner
            '#' + ROOT_ID + ' .ab-welcome-banner{padding:14px 20px;border-radius:8px;margin-bottom:1.2em;background:rgba(255,255,255,0.06);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:none;border-left:3px solid;border-image:linear-gradient(180deg,#fbbf24,#f59e0b) 1;box-shadow:0 1px 4px rgba(0,0,0,0.1);color:rgba(255,255,255,0.88);font-size:0.95em;font-weight:500;letter-spacing:0.02em;line-height:1.5;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-welcome-banner{background:rgba(0,0,0,0.03);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 1px 4px rgba(0,0,0,0.1);color:rgba(0,0,0,0.75);}' +
            // Bug 4 — rank progress bar track visible in light theme
            '#' + ROOT_ID + '.ab-theme-light #abSaRankBarTrack{background:rgba(0,0,0,0.1) !important;}' +
            // Bug 8 — hero icon bg visible in light theme
            '#' + ROOT_ID + '.ab-theme-light .ab-hero-icon{background:rgba(0,0,0,0.07);}' +
            // Bug 8 — showcase card backgrounds visible in light theme
            '#' + ROOT_ID + '.ab-theme-light .ab-sc-card{background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.12);color:rgba(0,0,0,0.85);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-sc-icon{background:rgba(0,0,0,0.07);}' +
            // Bug 8 — equipped empty dashed border visible in light theme
            '#' + ROOT_ID + '.ab-theme-light #abSaEquippedEmpty{border-color:rgba(0,0,0,0.2) !important;color:rgba(0,0,0,0.55);}' +
            // Bug 8 — profile card link text
            '#' + ROOT_ID + '.ab-theme-light #abSaProfileCardLink{color:rgba(0,0,0,0.6);}' +
            // Bug 8 — inline progress bar backgrounds (quest, pinned goals) visible in light theme
            '#' + ROOT_ID + '.ab-theme-light div[style*="background:rgba(255,255,255,0.12)"]{background:rgba(0,0,0,0.1) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light div[style*="background:rgba(255,255,255,0.08)"]{background:rgba(0,0,0,0.08) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light div[style*="background:rgba(255,255,255,0.04)"]{background:rgba(0,0,0,0.03) !important;border-color:rgba(0,0,0,0.1) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light div[style*="background:rgba(255,255,255,0.1)"]{background:rgba(0,0,0,0.08) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light div[style*="border:1px dashed rgba(255,255,255"]{border-color:rgba(0,0,0,0.2) !important;}' +
            // Bug 6 — bump up faint light-mode description/subtitle text
            '#' + ROOT_ID + '.ab-theme-light .ab-desc{color:rgba(0,0,0,0.75) !important;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-hero-sub{color:rgba(0,0,0,0.65);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-muted{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-eyebrow{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-toggle-desc{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-pref-desc{color:rgba(0,0,0,0.6);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-feed-meta{color:rgba(0,0,0,0.6);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-card-meta{color:rgba(0,0,0,0.65);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-meta{color:rgba(0,0,0,0.65);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-goal-label{color:rgba(0,0,0,0.6);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-cat-ring-sub{color:rgba(0,0,0,0.6);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-record-label{color:rgba(0,0,0,0.65);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-server-label{color:rgba(0,0,0,0.65);opacity:1;}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-stat-t{color:rgba(0,0,0,0.65);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-label{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-icon{color:rgba(0,0,0,0.55);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-section-title{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-wrapped-list li span{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-streak-label{color:rgba(0,0,0,0.65);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-eta{color:rgba(0,0,0,0.6);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-prog-text{color:rgba(0,0,0,0.7);}' +
            '#' + ROOT_ID + '.ab-theme-light .ab-badge-pts{color:rgba(0,0,0,0.65);}';
        // v2.0 Steam-style Shop CSS + Loadout theme rules. Appended after the
        // big initial assignment so the long string above stays untouched.
        s.textContent +=
            '#' + ROOT_ID + ' .ab-store-row-head{display:flex;align-items:center;gap:0.6em;margin:1.6em 0 0.85em;padding-bottom:0.5em;border-bottom:1px solid rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-store-row-head h3{margin:0;font-size:1.1em;font-weight:800;letter-spacing:0.02em;}' +
            '#' + ROOT_ID + ' .ab-store-row-head .material-icons{color:#a3b5f7;font-size:1.3em;}' +
            '#' + ROOT_ID + ' .ab-store-row-count{margin-left:auto;font-size:0.78em;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em;}' +
            '#' + ROOT_ID + ' .ab-store-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.85em;}' +
            '#' + ROOT_ID + ' .ab-store-card{background:linear-gradient(180deg,#1e2a3a 0%,#131b27 100%);border:1px solid rgba(255,255,255,0.08);border-radius:8px;overflow:hidden;display:flex;flex-direction:column;transition:transform 180ms ease,box-shadow 180ms ease,border-color 180ms ease;position:relative;}' +
            '#' + ROOT_ID + ' .ab-store-card:hover{transform:translateY(-4px);border-color:#66c0f4;box-shadow:0 14px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(102,192,244,0.25);}' +
            '#' + ROOT_ID + ' .ab-store-card.is-owned{opacity:0.92;border-color:rgba(16,185,129,0.55);}' +
            '#' + ROOT_ID + ' .ab-store-card.is-owned:hover{border-color:#10b981;box-shadow:0 14px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(16,185,129,0.4);}' +
            '#' + ROOT_ID + ' .ab-store-card.is-milestone .ab-store-card-hero{filter:grayscale(0.4) brightness(0.85);}' +
            '#' + ROOT_ID + ' .ab-store-card-hero{position:relative;height:130px;display:flex;align-items:center;justify-content:center;overflow:hidden;}' +
            '#' + ROOT_ID + ' .ab-store-card-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.3) 100%);pointer-events:none;}' +
            '#' + ROOT_ID + ' .ab-store-card-icon{font-size:3.2em !important;color:#fff;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.55));z-index:1;}' +
            '#' + ROOT_ID + ' .ab-store-card-tag{position:absolute;top:8px;right:8px;padding:0.22em 0.6em;background:#fcd34d;color:#1c1106;font-size:0.66em;font-weight:800;letter-spacing:0.06em;border-radius:3px;z-index:2;box-shadow:0 2px 6px rgba(0,0,0,0.35);}' +
            '#' + ROOT_ID + ' .ab-store-card-owned-stripe{position:absolute;bottom:0;left:0;right:0;background:rgba(16,185,129,0.92);color:#03150e;font-size:0.72em;font-weight:800;text-align:center;padding:0.3em 0;letter-spacing:0.16em;z-index:2;}' +
            '#' + ROOT_ID + ' .ab-store-theme-tag{padding:0.4em 0.95em;background:rgba(0,0,0,0.55);border-radius:4px;font-weight:800;font-size:0.78em;letter-spacing:0.12em;color:#fff;z-index:1;}' +
            '#' + ROOT_ID + ' .ab-store-frame-preview{width:70px;height:70px;border-radius:8px;display:flex;align-items:center;justify-content:center;z-index:1;}' +
            '#' + ROOT_ID + ' .ab-store-title-preview{font-family:"Cinzel","Trajan Pro",Georgia,serif;font-size:1.25em;font-weight:700;color:#fde68a;letter-spacing:0.06em;text-shadow:0 2px 8px rgba(0,0,0,0.55),0 0 18px rgba(252,211,77,0.25);text-align:center;padding:0 1em;z-index:1;}' +
            '#' + ROOT_ID + ' .ab-store-card-body{padding:0.7em 0.85em 0.45em;flex:1;}' +
            '#' + ROOT_ID + ' .ab-store-card-title{font-weight:700;font-size:0.96em;margin-bottom:0.3em;color:rgba(255,255,255,0.95);}' +
            '#' + ROOT_ID + ' .ab-store-card-desc{font-size:0.76em;color:rgba(255,255,255,0.55);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
            '#' + ROOT_ID + ' .ab-store-card-foot{display:flex;align-items:center;justify-content:space-between;padding:0.65em 0.85em 0.9em;gap:0.5em;}' +
            '#' + ROOT_ID + ' .ab-store-card-price{display:flex;align-items:baseline;gap:0.3em;}' +
            '#' + ROOT_ID + ' .ab-store-card-price-num{font-weight:800;font-size:1.15em;color:#beee11;text-shadow:0 0 8px rgba(190,238,17,0.25);}' +
            '#' + ROOT_ID + ' .ab-store-card-price-unit{font-size:0.7em;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.06em;}' +
            '#' + ROOT_ID + ' .ab-store-card-price.off .ab-store-card-price-num{color:rgba(255,255,255,0.35);text-shadow:none;}' +
            '#' + ROOT_ID + ' .ab-store-cta{background:linear-gradient(180deg,#75b022 0%,#5c7e10 100%);color:#fff;border:none;padding:0.55em 1.3em;border-radius:3px;font-weight:800;letter-spacing:0.08em;font-size:0.86em;cursor:pointer;transition:filter 150ms ease,transform 150ms ease,box-shadow 150ms ease;text-shadow:0 1px 2px rgba(0,0,0,0.4);}' +
            '#' + ROOT_ID + ' .ab-store-cta:hover{filter:brightness(1.15);box-shadow:0 0 16px rgba(140,195,74,0.45),0 4px 12px rgba(0,0,0,0.4);}' +
            '#' + ROOT_ID + ' .ab-store-cta:active{transform:translateY(1px);}' +
            '#' + ROOT_ID + ' .ab-store-cta.sm{padding:0.4em 0.95em;font-size:0.76em;}' +
            '#' + ROOT_ID + ' .ab-store-cta.off{background:#2a3441;color:#6b7280;cursor:not-allowed;text-shadow:none;}' +
            '#' + ROOT_ID + ' .ab-store-cta.off:hover{filter:none;box-shadow:none;}' +
            '#' + ROOT_ID + ' .ab-store-owned{display:flex;align-items:center;gap:0.35em;color:#34d399;font-weight:800;font-size:0.82em;letter-spacing:0.06em;width:100%;justify-content:center;background:rgba(16,185,129,0.1);padding:0.4em;border-radius:4px;border:1px solid rgba(16,185,129,0.3);}' +
            '#' + ROOT_ID + ' .ab-store-milestone-wrap{width:100%;}' +
            '#' + ROOT_ID + ' .ab-store-milestone{display:flex;align-items:center;gap:0.35em;color:#fcd34d;font-size:0.78em;background:rgba(252,211,77,0.08);border:1px solid rgba(252,211,77,0.3);padding:0.45em 0.65em;border-radius:4px;width:100%;}' +
            '#' + ROOT_ID + ' .ab-store-milestone strong{color:#fde68a;}' +
            '#' + ROOT_ID + ' .ab-store-featured{position:relative;border-radius:12px;overflow:hidden;margin:0.4em 0 1.6em;min-height:240px;border:1px solid rgba(255,255,255,0.12);box-shadow:0 14px 38px rgba(0,0,0,0.5);}' +
            '#' + ROOT_ID + ' .ab-store-featured-glow{position:absolute;top:-40%;right:-10%;width:60%;height:180%;background:radial-gradient(circle,rgba(255,255,255,0.18),transparent 60%);pointer-events:none;animation:ab-store-glow 6s ease-in-out infinite alternate;}' +
            '@keyframes ab-store-glow{from{opacity:0.5;transform:translateX(20px);}to{opacity:0.9;transform:translateX(-20px);}}' +
            '#' + ROOT_ID + ' .ab-store-featured-overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.85) 100%),linear-gradient(90deg,rgba(0,0,0,0.55) 0%,transparent 60%);display:flex;flex-direction:column;justify-content:flex-end;padding:1.6em 1.85em;}' +
            '#' + ROOT_ID + ' .ab-store-featured-eyebrow{color:#fcd34d;font-size:0.78em;font-weight:800;letter-spacing:0.16em;display:flex;align-items:center;gap:0.35em;margin-bottom:0.35em;}' +
            '#' + ROOT_ID + ' .ab-store-featured-title{font-size:2em;font-weight:900;text-shadow:0 3px 14px rgba(0,0,0,0.75);margin:0.05em 0 0.3em;line-height:1.05;}' +
            '#' + ROOT_ID + ' .ab-store-featured-desc{font-size:0.96em;color:rgba(255,255,255,0.85);margin-bottom:1em;max-width:70%;line-height:1.4;}' +
            '#' + ROOT_ID + ' .ab-store-featured-foot{display:flex;align-items:center;gap:1.2em;flex-wrap:wrap;}' +
            '#' + ROOT_ID + ' .ab-store-featured-price{font-size:1.55em;font-weight:900;color:#beee11;text-shadow:0 2px 10px rgba(190,238,17,0.35);}' +
            '#' + ROOT_ID + ' .ab-store-featured-price-unit{font-size:0.55em;opacity:0.7;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;}' +
            '#' + ROOT_ID + ' .ab-store-featured .ab-store-cta{padding:0.75em 1.7em;font-size:1em;border-radius:4px;}' +
            // Cosmetic theme classes (also added to styles-revamp.css for revamp
            // mode — repeat here so Classic mode equip-theme works too).
            // v2.0 themes — paint the whole page (background gradient + panel
            // cards + tabs + accents) so equipping a theme actually feels
            // like a reskin rather than a tint. Each theme defines an accent
            // color used for headings, active tabs, hover borders, and the
            // section dividers; the page background gets a strong gradient
            // and panels pick up a subtle wash.
            // ---- Sunset ----
            '#' + ROOT_ID + '.theme-sunset{background:radial-gradient(ellipse at top, rgba(249,115,22,0.32), rgba(24,24,24,1) 70%) !important;}' +
            '#' + ROOT_ID + '.theme-sunset #abSaLoadoutHero,#' + ROOT_ID + '.theme-sunset .ab-panel-card{background:linear-gradient(180deg, rgba(249,115,22,0.12), rgba(236,72,153,0.06)) !important; border-color:rgba(249,115,22,0.32) !important;}' +
            '#' + ROOT_ID + '.theme-sunset .ab-tab.active{background:linear-gradient(135deg,#f97316,#ec4899) !important; color:#fff !important; border-color:#fb923c !important;}' +
            '#' + ROOT_ID + '.theme-sunset .ab-store-row-head{border-bottom-color:rgba(249,115,22,0.35) !important;}' +
            '#' + ROOT_ID + '.theme-sunset .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-sunset .ab-cos-row-head .material-icons{color:#fb923c !important;}' +
            '#' + ROOT_ID + '.theme-sunset .ab-store-card:hover,#' + ROOT_ID + '.theme-sunset .ab-cos-card:hover{border-color:#fb923c !important; box-shadow:0 14px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.35) !important;}' +
            // ---- Cyberpunk ----
            '#' + ROOT_ID + '.theme-cyberpunk{background:linear-gradient(180deg, rgba(168,85,247,0.18), rgba(6,8,20,1) 60%) !important; background-image:linear-gradient(180deg, rgba(168,85,247,0.18), rgba(6,8,20,1) 60%), repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px) !important;}' +
            '#' + ROOT_ID + '.theme-cyberpunk #abSaLoadoutHero,#' + ROOT_ID + '.theme-cyberpunk .ab-panel-card{background:linear-gradient(135deg, rgba(168,85,247,0.18), rgba(34,211,238,0.10)) !important; border-color:rgba(168,85,247,0.5) !important; box-shadow:0 0 24px rgba(168,85,247,0.18) inset !important;}' +
            '#' + ROOT_ID + '.theme-cyberpunk .ab-tab.active{background:linear-gradient(135deg,#a855f7,#06b6d4) !important; color:#fff !important;}' +
            '#' + ROOT_ID + '.theme-cyberpunk .ab-store-row-head{border-bottom-color:rgba(168,85,247,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-cyberpunk .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-cyberpunk .ab-cos-row-head .material-icons{color:#d8b4fe !important;}' +
            '#' + ROOT_ID + '.theme-cyberpunk .ab-store-card:hover,#' + ROOT_ID + '.theme-cyberpunk .ab-cos-card:hover{border-color:#22d3ee !important; box-shadow:0 14px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,238,0.4) !important;}' +
            // ---- Pastel ----
            '#' + ROOT_ID + '.theme-pastel{background:linear-gradient(180deg, rgba(196,181,253,0.22), rgba(167,243,208,0.10) 50%, rgba(24,24,24,1) 100%) !important;}' +
            '#' + ROOT_ID + '.theme-pastel #abSaLoadoutHero,#' + ROOT_ID + '.theme-pastel .ab-panel-card{background:linear-gradient(135deg, rgba(196,181,253,0.18), rgba(167,243,208,0.10)) !important; border-color:rgba(196,181,253,0.42) !important;}' +
            '#' + ROOT_ID + '.theme-pastel .ab-tab.active{background:linear-gradient(135deg,#c4b5fd,#a7f3d0) !important; color:#1f1f1f !important;}' +
            '#' + ROOT_ID + '.theme-pastel .ab-store-row-head{border-bottom-color:rgba(196,181,253,0.42) !important;}' +
            '#' + ROOT_ID + '.theme-pastel .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-pastel .ab-cos-row-head .material-icons{color:#ddd6fe !important;}' +
            '#' + ROOT_ID + '.theme-pastel .ab-store-card:hover,#' + ROOT_ID + '.theme-pastel .ab-cos-card:hover{border-color:#c4b5fd !important;}' +
            // ---- Monochrome ----
            '#' + ROOT_ID + '.theme-monochrome{background:#000 !important; color:rgba(255,255,255,0.92) !important;}' +
            '#' + ROOT_ID + '.theme-monochrome #abSaLoadoutHero,#' + ROOT_ID + '.theme-monochrome .ab-panel-card{background:rgba(255,255,255,0.03) !important; border-color:rgba(255,255,255,0.55) !important;}' +
            '#' + ROOT_ID + '.theme-monochrome .ab-tab.active{background:#fff !important; color:#000 !important;}' +
            '#' + ROOT_ID + '.theme-monochrome .ab-store-row-head{border-bottom-color:rgba(255,255,255,0.35) !important;}' +
            '#' + ROOT_ID + '.theme-monochrome .ab-store-card,#' + ROOT_ID + '.theme-monochrome .ab-cos-card{background:#0a0a0a !important; border-color:rgba(255,255,255,0.25) !important;}' +
            '#' + ROOT_ID + '.theme-monochrome .ab-store-card:hover,#' + ROOT_ID + '.theme-monochrome .ab-cos-card:hover{border-color:#fff !important; box-shadow:0 0 0 1px #fff !important;}' +
            // ---- Noir ----
            '#' + ROOT_ID + '.theme-noir{background:radial-gradient(ellipse at top, rgba(120,113,108,0.25), rgba(12,10,9,1) 70%) !important;}' +
            '#' + ROOT_ID + '.theme-noir #abSaLoadoutHero,#' + ROOT_ID + '.theme-noir .ab-panel-card{background:linear-gradient(180deg, rgba(120,113,108,0.10), rgba(0,0,0,0.4)) !important; border-color:rgba(168,162,158,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-noir .ab-tab.active{background:linear-gradient(180deg,#a8a29e,#57534e) !important; color:#1c1917 !important;}' +
            '#' + ROOT_ID + '.theme-noir .ab-store-row-head{border-bottom-color:rgba(168,162,158,0.3) !important;}' +
            '#' + ROOT_ID + '.theme-noir .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-noir .ab-cos-row-head .material-icons{color:#d6d3d1 !important;}' +
            // ---- Aurora ----
            '#' + ROOT_ID + '.theme-aurora{background:linear-gradient(180deg, rgba(16,185,129,0.18), rgba(59,130,246,0.15) 35%, rgba(139,92,246,0.12) 60%, rgba(8,8,18,1) 100%) !important;}' +
            '#' + ROOT_ID + '.theme-aurora #abSaLoadoutHero,#' + ROOT_ID + '.theme-aurora .ab-panel-card{background:linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.12) 60%, rgba(139,92,246,0.10)) !important; border-color:rgba(16,185,129,0.42) !important;}' +
            '#' + ROOT_ID + '.theme-aurora .ab-tab.active{background:linear-gradient(135deg,#10b981,#3b82f6) !important; color:#fff !important;}' +
            '#' + ROOT_ID + '.theme-aurora .ab-store-row-head{border-bottom-color:rgba(16,185,129,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-aurora .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-aurora .ab-cos-row-head .material-icons{color:#6ee7b7 !important;}' +
            '#' + ROOT_ID + '.theme-aurora .ab-store-card:hover,#' + ROOT_ID + '.theme-aurora .ab-cos-card:hover{border-color:#34d399 !important;}' +
            // ---- Crimson ----
            '#' + ROOT_ID + '.theme-crimson{background:radial-gradient(ellipse at top, rgba(220,38,38,0.32), rgba(15,8,8,1) 70%) !important;}' +
            '#' + ROOT_ID + '.theme-crimson #abSaLoadoutHero,#' + ROOT_ID + '.theme-crimson .ab-panel-card{background:linear-gradient(180deg, rgba(220,38,38,0.12), rgba(124,45,18,0.05)) !important; border-color:rgba(220,38,38,0.45) !important;}' +
            '#' + ROOT_ID + '.theme-crimson .ab-tab.active{background:linear-gradient(135deg,#dc2626,#7c2d12) !important; color:#fff !important;}' +
            '#' + ROOT_ID + '.theme-crimson .ab-store-row-head{border-bottom-color:rgba(220,38,38,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-crimson .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-crimson .ab-cos-row-head .material-icons{color:#fca5a5 !important;}' +
            // ---- Vaporwave ----
            '#' + ROOT_ID + '.theme-vaporwave{background:linear-gradient(180deg, rgba(236,72,153,0.22), rgba(168,85,247,0.18) 30%, rgba(6,182,212,0.14) 60%, rgba(15,8,30,1) 100%) !important;}' +
            '#' + ROOT_ID + '.theme-vaporwave #abSaLoadoutHero,#' + ROOT_ID + '.theme-vaporwave .ab-panel-card{background:linear-gradient(135deg, rgba(236,72,153,0.18), rgba(6,182,212,0.12)) !important; border-color:rgba(236,72,153,0.42) !important;}' +
            '#' + ROOT_ID + '.theme-vaporwave .ab-tab.active{background:linear-gradient(135deg,#ec4899,#06b6d4) !important; color:#fff !important;}' +
            '#' + ROOT_ID + '.theme-vaporwave .ab-store-row-head{border-bottom-color:rgba(236,72,153,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-vaporwave .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-vaporwave .ab-cos-row-head .material-icons{color:#f9a8d4 !important;}' +
            '#' + ROOT_ID + '.theme-vaporwave .ab-store-card:hover,#' + ROOT_ID + '.theme-vaporwave .ab-cos-card:hover{border-color:#ec4899 !important; box-shadow:0 0 24px rgba(236,72,153,0.35) !important;}' +
            // ---- v2.0.x: 5 newer themes (galaxy, forest, ocean, rose gold, midnight) ----
            // ---- Galaxy ----
            '#' + ROOT_ID + '.theme-galaxy{background:radial-gradient(ellipse at top, rgba(88,28,135,0.45), rgba(15,8,40,1) 60%, rgba(0,0,0,1) 100%) !important;}' +
            '#' + ROOT_ID + '.theme-galaxy #abSaLoadoutHero,#' + ROOT_ID + '.theme-galaxy .ab-panel-card{background:linear-gradient(135deg, rgba(88,28,135,0.18), rgba(30,27,75,0.10)) !important; border-color:rgba(168,85,247,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-galaxy .ab-tab.active{background:linear-gradient(135deg,#581c87,#1e1b4b) !important; color:#fff !important;}' +
            '#' + ROOT_ID + '.theme-galaxy .ab-store-row-head{border-bottom-color:rgba(168,85,247,0.35) !important;}' +
            '#' + ROOT_ID + '.theme-galaxy .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-galaxy .ab-cos-row-head .material-icons{color:#d8b4fe !important;}' +
            // ---- Forest ----
            '#' + ROOT_ID + '.theme-forest{background:radial-gradient(ellipse at top, rgba(21,128,61,0.32), rgba(6,30,16,1) 65%) !important;}' +
            '#' + ROOT_ID + '.theme-forest #abSaLoadoutHero,#' + ROOT_ID + '.theme-forest .ab-panel-card{background:linear-gradient(135deg, rgba(21,128,61,0.14), rgba(180,83,9,0.06)) !important; border-color:rgba(34,197,94,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-forest .ab-tab.active{background:linear-gradient(135deg,#15803d,#854d0e) !important; color:#fff !important;}' +
            '#' + ROOT_ID + '.theme-forest .ab-store-row-head{border-bottom-color:rgba(34,197,94,0.35) !important;}' +
            '#' + ROOT_ID + '.theme-forest .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-forest .ab-cos-row-head .material-icons{color:#86efac !important;}' +
            // ---- Ocean ----
            '#' + ROOT_ID + '.theme-ocean{background:linear-gradient(180deg, rgba(12,74,110,0.45), rgba(2,21,42,1) 70%) !important;}' +
            '#' + ROOT_ID + '.theme-ocean #abSaLoadoutHero,#' + ROOT_ID + '.theme-ocean .ab-panel-card{background:linear-gradient(135deg, rgba(12,74,110,0.18), rgba(34,211,238,0.08)) !important; border-color:rgba(34,211,238,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-ocean .ab-tab.active{background:linear-gradient(135deg,#0c4a6e,#0e7490) !important; color:#fff !important;}' +
            '#' + ROOT_ID + '.theme-ocean .ab-store-row-head{border-bottom-color:rgba(34,211,238,0.35) !important;}' +
            '#' + ROOT_ID + '.theme-ocean .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-ocean .ab-cos-row-head .material-icons{color:#7dd3fc !important;}' +
            // ---- Rose Gold ----
            '#' + ROOT_ID + '.theme-rosegold{background:linear-gradient(180deg, rgba(251,113,133,0.22), rgba(245,158,11,0.10) 35%, rgba(24,8,15,1) 100%) !important;}' +
            '#' + ROOT_ID + '.theme-rosegold #abSaLoadoutHero,#' + ROOT_ID + '.theme-rosegold .ab-panel-card{background:linear-gradient(135deg, rgba(251,113,133,0.20), rgba(245,158,11,0.10)) !important; border-color:rgba(251,113,133,0.42) !important;}' +
            '#' + ROOT_ID + '.theme-rosegold .ab-tab.active{background:linear-gradient(135deg,#fb7185,#f59e0b) !important; color:#1c1106 !important;}' +
            '#' + ROOT_ID + '.theme-rosegold .ab-store-row-head{border-bottom-color:rgba(251,113,133,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-rosegold .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-rosegold .ab-cos-row-head .material-icons{color:#fda4af !important;}' +
            // ---- Midnight ----
            '#' + ROOT_ID + '.theme-midnight{background:radial-gradient(ellipse at top, rgba(30,27,75,0.5), rgba(2,6,23,1) 65%) !important;}' +
            '#' + ROOT_ID + '.theme-midnight #abSaLoadoutHero,#' + ROOT_ID + '.theme-midnight .ab-panel-card{background:linear-gradient(135deg, rgba(30,27,75,0.20), rgba(15,23,42,0.10)) !important; border-color:rgba(99,102,241,0.4) !important;}' +
            '#' + ROOT_ID + '.theme-midnight .ab-tab.active{background:linear-gradient(135deg,#1e1b4b,#3730a3) !important; color:#fff !important;}' +
            '#' + ROOT_ID + '.theme-midnight .ab-store-row-head{border-bottom-color:rgba(99,102,241,0.35) !important;}' +
            '#' + ROOT_ID + '.theme-midnight .ab-store-row-head .material-icons,#' + ROOT_ID + '.theme-midnight .ab-cos-row-head .material-icons{color:#a5b4fc !important;}' +
            // ---- More frames (obsidian/emerald/neon) ----
            '#' + ROOT_ID + ' .ab-card.frame-obsidian{box-shadow:0 0 0 2px #292524, 0 0 18px rgba(220,38,38,0.4);border-color:#292524 !important;background-color:#0c0a09 !important;}' +
            '#' + ROOT_ID + ' .ab-card.frame-emerald{box-shadow:0 0 0 2px #10b981, 0 0 18px rgba(16,185,129,0.5);border-color:#10b981 !important;}' +
            '#' + ROOT_ID + ' .ab-card.frame-neon{box-shadow:0 0 0 2px #ec4899, 0 0 22px rgba(236,72,153,0.6);border-color:#ec4899 !important;}' +
            // ---- v2.0.x animated backgrounds (full-page) + shop previews ----
            // position:fixed on the ::before so the bg layer is anchored to
            // the viewport, not to the (scrollable) standalone root — the old
            // position:absolute meant scrolling down moved past the bg layer
            // and the bg only covered roughly the first viewport height.
            // pointer-events:none so it doesn't capture clicks.
            // z-index handling: stamping `position:relative; z-index:1` on
            // direct children of root ensures all our UI renders above the
            // fixed pseudo. The preview tiles re-scope the same class on a
            // contained block, so the shop card shows the live animation
            // without breaking the page layout (the .ab-store-bg-preview
            // overrides position to absolute so it stays inside the card).
            '#' + ROOT_ID + ' .ab-store-bg-preview,#' + ROOT_ID + ' .ab-store-border-preview{position:relative;width:70px;height:70px;border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#0f172a;border:1px solid rgba(255,255,255,0.08);}' +
            // When a video background is active on the root, suppress the
            // CSS-only animation pseudos for the same bg-* class so we don't
            // get the old conic ring spinning on top of the video.
            '#' + ROOT_ID + '.has-video-bg::before,#' + ROOT_ID + '.has-video-bg::after{display:none !important;}' +
            // v2.0 first-visit welcome toast (pointer at the Loadout tab).
            // Floats top-right, dismissable, auto-clears after 30s, set via
            // localStorage so it never re-shows on the same browser.
            '#' + ROOT_ID + ' #abSaV2Welcome{position:fixed;top:84px;right:28px;width:min(380px,calc(100vw - 48px));background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border:1px solid rgba(252,211,77,0.5);border-radius:14px;padding:1.1em 1.25em 1.15em;color:#fff;z-index:1000001;box-shadow:0 20px 50px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), 0 0 28px rgba(252,211,77,0.18);animation:ab-v2-welcome-in 0.4s cubic-bezier(.21,1.02,.73,1) both;}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-row{display:flex;gap:0.9em;align-items:flex-start;}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-icon{font-size:2.1em;line-height:1;flex-shrink:0;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4));}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-body{flex:1;min-width:0;}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-eyebrow{font-size:0.7em;font-weight:800;letter-spacing:0.12em;color:#fcd34d;margin-bottom:0.2em;}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-title{font-family:"Cinzel","Trajan Pro",Georgia,serif;font-style:italic;font-size:1.2em;font-weight:700;color:#fff;margin-bottom:0.4em;background:linear-gradient(135deg,#fcd34d 0%,#f59e0b 50%,#fde68a 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-desc{font-size:0.85em;line-height:1.5;color:rgba(255,255,255,0.85);margin-bottom:0.85em;}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-cta{background:linear-gradient(180deg,#75b022,#5c7e10);color:#fff;border:none;padding:0.55em 1.15em;border-radius:4px;font-weight:800;font-size:0.82em;letter-spacing:0.06em;cursor:pointer;transition:filter 150ms ease, transform 150ms ease;text-shadow:0 1px 2px rgba(0,0,0,0.35);}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-cta:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:0 8px 16px rgba(140,195,74,0.35);}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-close{position:absolute;top:8px;right:10px;background:transparent;color:rgba(255,255,255,0.5);border:none;cursor:pointer;width:26px;height:26px;font-size:1.3em;line-height:1;border-radius:6px;transition:color 120ms ease, background 120ms ease;}' +
            '#' + ROOT_ID + ' .ab-v2-welcome-close:hover{color:#fff;background:rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' #abSaV2Welcome.ab-v2-welcome-out{animation:ab-v2-welcome-out 0.25s ease both;}' +
            '@keyframes ab-v2-welcome-in{from{transform:translate(20px,-10px);opacity:0;}to{transform:translate(0,0);opacity:1;}}' +
            '@keyframes ab-v2-welcome-out{to{transform:translate(20px,-10px);opacity:0;}}' +
            '#' + ROOT_ID + '.bg-blackhole > *,#' + ROOT_ID + '.bg-starfield > *,#' + ROOT_ID + '.bg-nebula > *,#' + ROOT_ID + '.bg-matrix > *,#' + ROOT_ID + '.bg-aurora > *,#' + ROOT_ID + '.bg-fireflies > *{position:relative;z-index:1;}' +
            // Common: full-viewport fixed paint layer with a back-of-stack
            // z-index. Each bg variant overrides the background image.
            '#' + ROOT_ID + '.bg-blackhole::before,#' + ROOT_ID + '.bg-starfield::before,#' + ROOT_ID + '.bg-nebula::before,#' + ROOT_ID + '.bg-matrix::before,#' + ROOT_ID + '.bg-aurora::before,#' + ROOT_ID + '.bg-fireflies::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;}' +
            // Preview tile variants use position:absolute scoped to the tile
            '#' + ROOT_ID + ' .ab-store-bg-preview.bg-blackhole::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-starfield::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-nebula::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-matrix::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-aurora::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-fireflies::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;}' +
            // ---- Black hole: deep-space radial darken + slow rotating accretion ring ----
            '#' + ROOT_ID + '.bg-blackhole,#' + ROOT_ID + ' .ab-store-bg-preview.bg-blackhole{background-color:#020617 !important;}' +
            '#' + ROOT_ID + '.bg-blackhole::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-blackhole::before{background:conic-gradient(from 0deg at 50% 50%,transparent 0deg,rgba(124,58,237,0.18) 40deg,rgba(34,211,238,0.18) 120deg,transparent 180deg,rgba(220,38,38,0.16) 240deg,rgba(245,158,11,0.16) 300deg,transparent 360deg);animation:ab-bg-blackhole-spin 40s linear infinite;}' +
            '#' + ROOT_ID + '.bg-blackhole::after{content:"";position:fixed;inset:0;background:radial-gradient(circle at 50% 50%,#000 0%,#000 6%,transparent 18%);pointer-events:none;z-index:0;}' +
            '#' + ROOT_ID + ' .ab-store-bg-preview.bg-blackhole::after{content:"";position:absolute;inset:0;background:radial-gradient(circle,#000 0%,#000 18%,transparent 42%);pointer-events:none;z-index:1;}' +
            '@keyframes ab-bg-blackhole-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}' +
            // ---- Starfield: 3 layered star fields ----
            '#' + ROOT_ID + '.bg-starfield,#' + ROOT_ID + ' .ab-store-bg-preview.bg-starfield{background-color:#020617 !important;}' +
            '#' + ROOT_ID + '.bg-starfield::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-starfield::before{background-image:radial-gradient(1px 1px at 20% 12%,#fff,transparent 60%),radial-gradient(1px 1px at 65% 18%,#fff,transparent 60%),radial-gradient(2px 2px at 38% 78%,#fde68a,transparent 60%),radial-gradient(1px 1px at 85% 55%,#fff,transparent 60%),radial-gradient(1px 1px at 9% 70%,#fff,transparent 60%),radial-gradient(1.5px 1.5px at 55% 38%,#fff,transparent 60%),radial-gradient(1px 1px at 92% 88%,#fff,transparent 60%),radial-gradient(2px 2px at 30% 50%,#a5b4fc,transparent 60%);background-size:240px 240px;animation:ab-bg-starfield-twinkle 4.5s ease-in-out infinite alternate;}' +
            '@keyframes ab-bg-starfield-twinkle{from{opacity:0.55;}to{opacity:1;}}' +
            // ---- Nebula: drifting purple+cyan blobs ----
            '#' + ROOT_ID + '.bg-nebula,#' + ROOT_ID + ' .ab-store-bg-preview.bg-nebula{background-color:#0c0a1f !important;}' +
            '#' + ROOT_ID + '.bg-nebula::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-nebula::before{background:radial-gradient(60% 60% at 25% 30%,rgba(168,85,247,0.45),transparent 70%),radial-gradient(55% 55% at 75% 65%,rgba(34,211,238,0.35),transparent 70%),radial-gradient(50% 50% at 50% 50%,rgba(236,72,153,0.3),transparent 70%);background-size:200% 200%;animation:ab-bg-nebula-drift 28s ease-in-out infinite alternate;}' +
            '@keyframes ab-bg-nebula-drift{from{background-position:0% 0%, 100% 100%, 50% 50%;}to{background-position:100% 50%, 0% 30%, 60% 80%;}}' +
            // ---- Matrix: 3 overlapping layers of green code at different
            // speeds + densities so it actually reads as digital rain, not
            // static stripes. Each layer is a repeating gradient with its
            // own keyframe — fast/medium/slow scroll. The "characters" are
            // approximated by short bright dashes inside taller faint columns.
            '#' + ROOT_ID + '.bg-matrix,#' + ROOT_ID + ' .ab-store-bg-preview.bg-matrix{background-color:#000 !important;}' +
            '#' + ROOT_ID + '.bg-matrix::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-matrix::before{background:repeating-linear-gradient(180deg, transparent 0, transparent 8px, rgba(74,222,128,0.95) 8px, rgba(74,222,128,0.95) 10px, rgba(34,197,94,0.55) 10px, rgba(34,197,94,0.55) 16px, transparent 16px, transparent 40px),repeating-linear-gradient(180deg, transparent 0, transparent 30px, rgba(22,163,74,0.45) 30px, rgba(22,163,74,0.45) 32px, transparent 32px, transparent 80px),repeating-linear-gradient(90deg, transparent 0, transparent 12px, rgba(0,0,0,0.55) 12px, rgba(0,0,0,0.55) 16px),linear-gradient(180deg, #001a05 0%, #000 70%);background-size: 14px 240px, 22px 320px, 28px 100%, 100% 100%;background-position: 0 0, 8px 0, 0 0, 0 0;animation: ab-bg-matrix-fall-fast 2.2s linear infinite, ab-bg-matrix-fall-slow 4.5s linear infinite;opacity:0.55;}' +
            '@keyframes ab-bg-matrix-fall-fast{from{background-position:0 0, 0 0, 0 0, 0 0;}to{background-position:0 240px, 8px 0, 0 0, 0 0;}}' +
            '@keyframes ab-bg-matrix-fall-slow{from{background-position:0 0, 8px 0, 0 0, 0 0;}to{background-position:0 0, 8px 320px, 0 0, 0 0;}}' +
            // ---- Aurora: green→blue→violet ribbons drifting at the top ----
            '#' + ROOT_ID + '.bg-aurora,#' + ROOT_ID + ' .ab-store-bg-preview.bg-aurora{background-color:#02061a !important;}' +
            '#' + ROOT_ID + '.bg-aurora::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-aurora::before{background:linear-gradient(180deg,rgba(16,185,129,0.35) 0%,rgba(59,130,246,0.25) 20%,rgba(139,92,246,0.18) 35%,transparent 65%);background-size:200% 120%;animation:ab-bg-aurora-wave 14s ease-in-out infinite alternate;filter:blur(40px);}' +
            '@keyframes ab-bg-aurora-wave{from{background-position:0% 0%;}to{background-position:100% 5%;}}' +
            // ---- Fireflies: warm bokeh particles ----
            '#' + ROOT_ID + '.bg-fireflies,#' + ROOT_ID + ' .ab-store-bg-preview.bg-fireflies{background-color:#0c0a09 !important;}' +
            '#' + ROOT_ID + '.bg-fireflies::before,#' + ROOT_ID + ' .ab-store-bg-preview.bg-fireflies::before{background-image:radial-gradient(3px 3px at 20% 80%,rgba(252,211,77,0.85),transparent 60%),radial-gradient(2px 2px at 60% 40%,rgba(253,224,71,0.7),transparent 60%),radial-gradient(4px 4px at 80% 70%,rgba(252,211,77,0.8),transparent 60%),radial-gradient(2px 2px at 30% 30%,rgba(254,240,138,0.65),transparent 60%),radial-gradient(3px 3px at 70% 90%,rgba(252,211,77,0.75),transparent 60%),radial-gradient(1px 1px at 10% 15%,rgba(252,211,77,0.6),transparent 60%);background-size:400px 400px;animation:ab-bg-fireflies-float 22s linear infinite;}' +
            '@keyframes ab-bg-fireflies-float{0%{background-position:0 0;opacity:0.4;}50%{opacity:1;}100%{background-position:-400px -400px;opacity:0.4;}}' +
            // ---- v2.0.x animated profile borders (applied to .ab-hero) ----
            '#' + ROOT_ID + '.border-gold-shimmer .ab-hero,#' + ROOT_ID + ' .ab-store-border-preview.border-gold-shimmer{position:relative;border-radius:14px;background-clip:padding-box;}' +
            '#' + ROOT_ID + '.border-gold-shimmer .ab-hero::before,#' + ROOT_ID + ' .ab-store-border-preview.border-gold-shimmer::before{content:"";position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:linear-gradient(120deg,#facc15 0%,#fde68a 30%,#facc15 50%,#a16207 70%,#facc15 100%);background-size:300% 100%;animation:ab-border-shimmer 4s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}' +
            '@keyframes ab-border-shimmer{from{background-position:0% 0%;}to{background-position:300% 0%;}}' +
            // Plasma: hue-rotate the gradient in place — no whole-card spin.
            '#' + ROOT_ID + '.border-plasma .ab-hero,#' + ROOT_ID + ' .ab-store-border-preview.border-plasma{position:relative;border-radius:14px;}' +
            '#' + ROOT_ID + '.border-plasma .ab-hero::before,#' + ROOT_ID + ' .ab-store-border-preview.border-plasma::before{content:"";position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:linear-gradient(90deg,#ec4899,#a855f7,#06b6d4,#22d3ee,#ec4899);background-size:300% 100%;animation:ab-border-plasma 5s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}' +
            '@keyframes ab-border-plasma{from{background-position:0% 0%;filter:hue-rotate(0deg);}to{background-position:300% 0%;filter:hue-rotate(360deg);}}' +
            '#' + ROOT_ID + '.border-ember .ab-hero,#' + ROOT_ID + ' .ab-store-border-preview.border-ember{position:relative;border-radius:14px;animation:ab-border-ember-pulse 2.5s ease-in-out infinite;}' +
            '@keyframes ab-border-ember-pulse{0%,100%{box-shadow:0 0 0 1px #dc2626,0 0 14px rgba(220,38,38,0.5);}50%{box-shadow:0 0 0 2px #fca5a5,0 0 28px rgba(220,38,38,0.85);}}' +
            // Holo Edge: distinctly different from Plasma — uses a SLOW
            // pulsing rainbow ring with a bright "specular highlight" that
            // sweeps once per cycle (not a continuous color crawl). The
            // gradient is conic (full ring) not horizontal, and the highlight
            // is a separate masked overlay so it reads as a chrome shimmer.
            '#' + ROOT_ID + '.border-holo .ab-hero,#' + ROOT_ID + ' .ab-store-border-preview.border-holo{position:relative;border-radius:14px;}' +
            '#' + ROOT_ID + '.border-holo .ab-hero::before,#' + ROOT_ID + ' .ab-store-border-preview.border-holo::before{content:"";position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:conic-gradient(from 0deg, #ff006e, #ffbe0b, #06ffa5, #00b4d8, #8338ec, #ff006e);animation:ab-border-holo-pulse 6s ease-in-out infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}' +
            '#' + ROOT_ID + '.border-holo .ab-hero::after,#' + ROOT_ID + ' .ab-store-border-preview.border-holo::after{content:"";position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.85) 50%, transparent 70%);background-size:400% 100%;animation:ab-border-holo-sweep 4s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;mix-blend-mode:screen;}' +
            '@keyframes ab-border-holo-pulse{0%,100%{filter:saturate(1) brightness(1);}50%{filter:saturate(1.6) brightness(1.25);}}' +
            '@keyframes ab-border-holo-sweep{from{background-position:-100% 0;}to{background-position:200% 0;}}' +
            '#' + ROOT_ID + '.border-crystal .ab-hero,#' + ROOT_ID + ' .ab-store-border-preview.border-crystal{position:relative;border-radius:14px;box-shadow:0 0 0 2px #bfdbfe, inset 0 0 18px rgba(191,219,254,0.25);}' +
            // ---- Active boost pills (multi-pill stack in the Loadout hero) ----
            '#' + ROOT_ID + ' .ab-boost-pill{padding:0.5em 0.95em; border-radius:10px; min-width:170px; backdrop-filter:blur(6px); border:1px solid; transition:transform 150ms ease;}' +
            '#' + ROOT_ID + ' .ab-boost-pill:hover{transform:translateX(-3px);}' +
            '#' + ROOT_ID + ' .ab-boost-pill-head{display:flex; align-items:center; gap:0.35em; font-size:0.7em; font-weight:800; letter-spacing:0.1em;}' +
            '#' + ROOT_ID + ' .ab-boost-pill-head .material-icons{font-size:1em;}' +
            '#' + ROOT_ID + ' .ab-boost-pill-body{font-size:0.95em; margin-top:0.15em; font-weight:700; letter-spacing:0.02em;}' +
            '#' + ROOT_ID + ' .ab-boost-xp{background:rgba(251,191,36,0.18); border-color:#f59e0b; color:#fcd34d;}' +
            '#' + ROOT_ID + ' .ab-boost-xp .ab-boost-pill-body{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-variant-numeric:tabular-nums; color:#fde68a;}' +
            '#' + ROOT_ID + ' .ab-boost-dc{background:rgba(16,185,129,0.18); border-color:#10b981; color:#6ee7b7;}' +
            '#' + ROOT_ID + ' .ab-boost-dc .ab-boost-pill-body{color:#a7f3d0; font-weight:600; font-size:0.85em;}' +
            '#' + ROOT_ID + ' .ab-boost-sf{background:rgba(125,211,252,0.18); border-color:#0ea5e9; color:#7dd3fc;}' +
            '#' + ROOT_ID + ' .ab-boost-sf .ab-boost-pill-body{color:#bae6fd; font-weight:600; font-size:0.85em;}' +
            // v2.0: badge frame cosmetics — applied as a class on equipped
            // badge cards by renderEquipped() once the user equips a frame.
            '#' + ROOT_ID + ' .ab-card.frame-gilded{box-shadow:0 0 0 2px #facc15, 0 0 18px rgba(250,204,21,0.55);border-color:#facc15 !important;}' +
            '#' + ROOT_ID + ' .ab-card.frame-holo{box-shadow:0 0 0 2px #22d3ee, 0 0 18px rgba(34,211,238,0.5);border-color:#22d3ee !important;background-image:linear-gradient(135deg, rgba(168,85,247,0.16), rgba(34,211,238,0.16) 50%, rgba(250,204,21,0.16));transition:filter 300ms ease;}' +
            '#' + ROOT_ID + ' .ab-card.frame-holo:hover{filter:hue-rotate(40deg);}' +
            '#' + ROOT_ID + ' .ab-card.frame-frosted{box-shadow:0 0 0 2px #bfdbfe, inset 0 0 0 1px rgba(255,255,255,0.4);border-color:#bfdbfe !important;background-color:rgba(191,219,254,0.06) !important;}' +
            // v2.0 polish: deeper Steam-store hero for the Loadout score balance
            '#' + ROOT_ID + ' #abSaLoadoutHero{background:linear-gradient(135deg,#1b2838 0%,#2a475e 60%,#1b2838 100%) !important;border-color:rgba(102,192,244,0.18) !important;box-shadow:0 10px 38px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05) !important;}' +
            // Featured carousel
            '#' + ROOT_ID + ' .ab-store-featured-wrap{position:relative;}' +
            '#' + ROOT_ID + ' .ab-store-featured-track{display:flex;gap:1em;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;padding-bottom:0.25em;}' +
            '#' + ROOT_ID + ' .ab-store-featured-track::-webkit-scrollbar{display:none;}' +
            '#' + ROOT_ID + ' .ab-store-featured-track > .ab-store-featured{flex:0 0 100%;scroll-snap-align:start;margin:0;}' +
            '#' + ROOT_ID + ' .ab-store-carousel-btn{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;background:rgba(15,23,42,0.7);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.4em;font-weight:900;z-index:5;box-shadow:0 4px 14px rgba(0,0,0,0.55);opacity:0;transition:opacity 200ms ease, background 150ms ease, transform 150ms ease;backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.12);}' +
            '#' + ROOT_ID + ' .ab-store-featured-wrap:hover .ab-store-carousel-btn{opacity:1;}' +
            '#' + ROOT_ID + ' .ab-store-carousel-btn:hover{background:#66c0f4;color:#0f172a;transform:translateY(-50%) scale(1.12);}' +
            '#' + ROOT_ID + ' .ab-store-carousel-btn.prev{left:-12px;}' +
            '#' + ROOT_ID + ' .ab-store-carousel-btn.next{right:-12px;}' +
            '#' + ROOT_ID + ' .ab-store-carousel-dots{display:flex;justify-content:center;gap:0.4em;margin-top:0.6em;}' +
            '#' + ROOT_ID + ' .ab-store-carousel-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.25);cursor:pointer;transition:all 150ms ease;border:none;padding:0;}' +
            '#' + ROOT_ID + ' .ab-store-carousel-dot.active{background:#66c0f4;width:24px;border-radius:4px;}' +
            // Cosmetics-tab Steam-style cards (mirrors Shop grid but with Equip controls)
            '#' + ROOT_ID + ' .ab-cos-row-head{display:flex;align-items:center;gap:0.6em;margin:1.4em 0 0.8em;padding-bottom:0.45em;border-bottom:1px solid rgba(255,255,255,0.08);}' +
            '#' + ROOT_ID + ' .ab-cos-row-head h3{margin:0;font-size:1.05em;font-weight:800;letter-spacing:0.02em;}' +
            '#' + ROOT_ID + ' .ab-cos-row-head .material-icons{color:#66c0f4;font-size:1.25em;}' +
            '#' + ROOT_ID + ' .ab-cos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.85em;}' +
            '#' + ROOT_ID + ' .ab-cos-card{position:relative;border:1px solid rgba(255,255,255,0.08);border-radius:10px;background:linear-gradient(180deg,#1b2838 0%,#0f172a 100%);overflow:hidden;display:flex;flex-direction:column;transition:transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;}' +
            '#' + ROOT_ID + ' .ab-cos-card:hover{transform:translateY(-3px);border-color:#66c0f4;box-shadow:0 12px 28px rgba(0,0,0,0.5);}' +
            '#' + ROOT_ID + ' .ab-cos-card.equipped{border-color:#10b981;box-shadow:0 0 0 1px #10b981, 0 0 22px rgba(16,185,129,0.22);}' +
            '#' + ROOT_ID + ' .ab-cos-card-hero{position:relative;height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden;}' +
            '#' + ROOT_ID + ' .ab-cos-card-equipped-pill{position:absolute;top:8px;right:8px;background:#10b981;color:#03150e;padding:0.22em 0.65em;border-radius:3px;font-size:0.66em;font-weight:800;letter-spacing:0.08em;z-index:2;box-shadow:0 2px 6px rgba(0,0,0,0.35);}' +
            '#' + ROOT_ID + ' .ab-cos-card-body{padding:0.7em 0.85em 0.45em;flex:1;}' +
            '#' + ROOT_ID + ' .ab-cos-card-name{font-weight:700;font-size:0.96em;color:rgba(255,255,255,0.95);margin-bottom:0.2em;}' +
            '#' + ROOT_ID + ' .ab-cos-card-foot{padding:0.6em 0.85em 0.85em;}' +
            '#' + ROOT_ID + ' .ab-cos-action{display:block;width:100%;padding:0.55em 1em;border:none;border-radius:3px;font-weight:800;letter-spacing:0.06em;font-size:0.86em;cursor:pointer;transition:filter 150ms ease, box-shadow 150ms ease, transform 150ms ease;}' +
            '#' + ROOT_ID + ' .ab-cos-action.equip{background:linear-gradient(180deg,#75b022,#5c7e10);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.4);}' +
            '#' + ROOT_ID + ' .ab-cos-action.equip:hover{filter:brightness(1.15);box-shadow:0 0 16px rgba(140,195,74,0.45);}' +
            '#' + ROOT_ID + ' .ab-cos-action.unequip{background:rgba(239,68,68,0.18);color:#fca5a5;border:1px solid rgba(239,68,68,0.45);}' +
            '#' + ROOT_ID + ' .ab-cos-action.unequip:hover{background:rgba(239,68,68,0.3);}' +
            // Custom Tabs / Plugin Pages reuse this root inside their own
            // content area instead of presenting the stock full-screen overlay.
            '#' + ROOT_ID + '[data-ab-embedded="true"]{position:relative !important;inset:auto !important;width:100% !important;height:auto !important;min-height:70vh !important;max-height:none !important;z-index:auto !important;padding:1.5em !important;}';
        document.head.appendChild(s);
    }

    var userId = '';
    var root = null;
    var activeHost = null;

    function el(id) { return root ? root.querySelector('#' + id) : null; }

    function createRoot(embedded) {
        var r = document.getElementById(ROOT_ID);
        if (r) { r.innerHTML = ''; } else { r = document.createElement('div'); r.id = ROOT_ID; }
        r.setAttribute('data-ab-embedded', embedded ? 'true' : 'false');
        r.innerHTML =
            '<div class="ab-wrap">' +
                '<div id="abSaWelcomeBanner" class="ab-welcome-banner" style="display:none;"></div>' +
                '<div class="ab-topbar">' +
                    '<h2 style="margin:0;" data-i18n="achievements.title">Achievements</h2>' +
                    /* v1.8.47: Classic/Revamp toggle \u2014 mirrors the admin-page
                       toggle. Persists via the same `ab-style-pref` localStorage
                       key so the user's choice is shared across both surfaces. */
                    '<button type="button" id="abSaStyleToggleBtn" class="abSaStyleToggleBtn" aria-pressed="false" title="Toggle Revamp / Classic UI" data-i18n="ui.toggle.classic">UI: Classic</button>' +
                    '<a class="ab-back" href="/web/index.html#!/home">\u2190 <span data-i18n="achievements.back_home">Back Home</span></a>' +
                '</div>' +
                '<div class="ab-hero">' +
                    /* v1.8.52: hero arc donut on the right side. Hidden in Classic
                       via CSS display:none. SVG ships with stroke-dashoffset =
                       circumference (empty ring); JS updates --rv-arc-off + offset
                       to the target value once the completion % loads. */
                    '<div class="abSaHeroArc" aria-hidden="true">' +
                        '<svg class="abSaHeroArcSvg" viewBox="0 0 200 200">' +
                            '<circle class="abSaHeroArcTrack" cx="100" cy="100" r="86"></circle>' +
                            '<circle class="abSaHeroArcFill"  cx="100" cy="100" r="86"' +
                                ' stroke-dasharray="540.35" stroke-dashoffset="540.35"' +
                                ' style="--rv-arc-c:540.35;--rv-arc-off:540.35"></circle>' +
                        '</svg>' +
                        '<div class="abSaHeroArcCenter">' +
                            '<div class="abSaHeroArcEyebrow" data-i18n="achievements.completion">Completion</div>' +
                            '<div id="abSaHeroArcPct" class="abSaHeroArcPct">0%</div>' +
                        '</div>' +
                    '</div>' +
                    '<div style="flex:1;min-width:280px;">' +
                        '<div class="ab-hero-left">' +
                            '<div id="abSaRankIcon" class="ab-hero-icon">\ud83c\udfc5</div>' +
                            '<div>' +
                                '<div id="abSaTitle" class="ab-hero-title" data-i18n="achievements.profile_title">Achievement Profile</div>' +
                                '<div id="abSaTitleDisplay" class="ab-title-display" style="display:none; font-size:0.85em; font-weight:600; margin-top:0.2em;"></div>' +
                                '<div id="abSaRankLabel" class="ab-hero-sub" style="font-size:1em; font-weight:600; margin-top:0.2em;" data-i18n="rank.rookie">Rookie</div>' +
                                '<div id="abSaSub" class="ab-hero-sub" style="font-size:0.85em; opacity:0.8;" data-i18n="common.loading">Loading...</div>' +
                                '<div id="abSaHeroStreak" class="ab-hero-streak" style="display:none;"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="margin-top:0.75em;">' +
                            '<div id="abSaRankBarText" class="ab-eyebrow" style="display:flex; justify-content:space-between;"><span data-i18n="achievements.rank_progress">Rank progress</span><span id="abSaRankBarPct">0%</span></div>' +
                            '<div id="abSaRankBarTrack" style="height:6px; border-radius:3px; background:rgba(255,255,255,0.12); overflow:hidden; margin-top:4px;">' +
                                '<div id="abSaRankBarFill" style="height:100%; width:0%; background:#667eea; transition:width 0.4s;"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div id="abSaShowcaseWrap" style="margin-top:1em;"><div class="ab-eyebrow" data-i18n="achievements.showcase">Showcase</div><div id="abSaShowcase" class="ab-showcase"><div class="ab-muted" data-i18n="achievements.showcase_empty">Equip badges to build your showcase.</div></div></div>' +
                        '<div style="margin-top:1em;"><a id="abSaProfileCardLink" href="#" target="_blank" class="ab-muted" style="font-size:0.85em; text-decoration:underline;" data-i18n="achievements.profile_card_link">Open shareable profile card</a></div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaError" style="display:none;" class="ab-error"></div>' +
                '<div class="ab-stats">' +
                    '<div class="ab-stat"><div class="ab-stat-t" data-i18n="achievements.unlocked">Unlocked</div><div id="abSaUnlocked" class="ab-stat-v">0</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t" data-i18n="achievements.total">Total</div><div id="abSaTotal" class="ab-stat-v">0</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t" data-i18n="achievements.completion">Completion</div><div id="abSaPct" class="ab-stat-v">0%</div></div>' +
                    '<div class="ab-stat"><div class="ab-stat-t" data-i18n="achievements.score">Score</div><div id="abSaScore" class="ab-stat-v">0</div></div>' +
                '</div>' +
                '<div class="ab-tabs">' +
                    '<button type="button" class="ab-tab active" id="abSaTabBadges" data-i18n="tabs.my_badges">My Badges</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabQuests" data-i18n="tabs.quests">Quests</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabRecap" data-i18n="tabs.recap">Recap</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabLb" data-i18n="tabs.leaderboard">Leaderboard</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabCompare" data-i18n="tabs.compare">Compare</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabActivity" data-i18n="tabs.activity">Activity</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabWrapped" data-i18n="tabs.wrapped">Wrapped</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabStats" data-i18n="tabs.stats">Stats</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabLoadout" data-i18n="tabs.loadout">Loadout</button>' +
                    '<button type="button" class="ab-tab" id="abSaTabSettings" data-i18n-title="tabs.settings" title="Settings"><span class="material-icons" style="font-size:1.1em;vertical-align:middle;">settings</span></button>' +
                '</div>' +
                '<div id="abSaPanelBadges" class="ab-panel">' +
                    '<div id="abSaPinnedWrap" style="display:none;">' +
                        '<div class="ab-eyebrow" style="display:flex; align-items:center; gap:0.4em;"><span class="material-icons" style="font-size:1em;">push_pin</span> <span data-i18n="achievements.working_on">Working on</span></div>' +
                        '<div id="abSaPinnedRow" class="ab-goals-row"></div>' +
                    '</div>' +
                    '<div class="ab-filter-row" style="display:flex; gap:0.75em; flex-wrap:wrap; margin-bottom:1em; align-items:center;">' +
                        '<input type="search" id="abSaSearch" placeholder="Search badges by title, category, rarity..." data-i18n-placeholder="filter.search_placeholder" class="ab-input" style="flex:1; min-width:240px;">' +
                        '<select id="abSaCategoryFilter" class="ab-select" title="Filter by category" data-i18n-title="filter.by_category">' +
                            '<option value="" data-i18n="filter.all_categories">All categories</option>' +
                        '</select>' +
                        '<select id="abSaFilter" class="ab-select">' +
                            '<option value="all" data-i18n="filter.all_badges">All badges</option>' +
                            '<option value="unlocked" data-i18n="filter.unlocked_only">Unlocked only</option>' +
                            '<option value="recent" data-i18n="filter.recently_unlocked">Recently unlocked</option>' +
                            '<option value="locked" data-i18n="filter.locked_only">Locked only</option>' +
                            '<option value="close" data-i18n="filter.close_to_unlock">Close to unlock (&gt;50%)</option>' +
                            '<option value="r-common" data-i18n="filter.rarity_common">Rarity: Common</option>' +
                            '<option value="r-uncommon" data-i18n="filter.rarity_uncommon">Rarity: Uncommon</option>' +
                            '<option value="r-rare" data-i18n="filter.rarity_rare">Rarity: Rare</option>' +
                            '<option value="r-epic" data-i18n="filter.rarity_epic">Rarity: Epic</option>' +
                            '<option value="r-legendary" data-i18n="filter.rarity_legendary">Rarity: Legendary</option>' +
                            '<option value="r-mythic" data-i18n="filter.rarity_mythic">Rarity: Mythic</option>' +
                        '</select>' +
                        '<select id="abSaSort" class="ab-select" title="Sort order" data-i18n-title="filter.sort_order">' +
                            '<option value="default" data-i18n="filter.sort_default">Default</option>' +
                            '<option value="rarity-desc" data-i18n="filter.sort_rarity_desc">Sort: Rarity (highest)</option>' +
                            '<option value="rarity-asc" data-i18n="filter.sort_rarity_asc">Sort: Rarity (lowest)</option>' +
                            '<option value="progress-desc" data-i18n="filter.sort_progress_desc">Sort: Progress (most)</option>' +
                            '<option value="progress-asc" data-i18n="filter.sort_progress_asc">Sort: Progress (least)</option>' +
                            '<option value="title-asc" data-i18n="filter.sort_title_asc">Sort: Title A-Z</option>' +
                        '</select>' +
                    '</div>' +
                    '<div id="abSaEquippedWrap">' +
                      '<h3 style="margin:0 0 0.75em;" data-i18n="achievements.equipped_badges">Equipped badges</h3>' +
                      '<div id="abSaEquippedEmpty" class="ab-muted" style="padding:0.8em;border:1px dashed rgba(255,255,255,0.16);border-radius:12px;" data-i18n="achievements.equipped_empty">No equipped badges yet.</div>' +
                      '<div id="abSaEquipped" class="ab-grid"></div>' +
                    '</div>' +
                    '<div id="abSaGrid" class="ab-grid" style="margin-top:1.5em;"></div>' +
                    '<div id="abSaEmptyFilter" class="ab-muted" style="display:none; margin-top:1em;" data-i18n="achievements.no_badges_match_filter">No badges match your filter.</div>' +
                '</div>' +
                '<div id="abSaPanelQuests" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<div style="display:flex; align-items:center; justify-content:space-between; gap:0.6em; flex-wrap:wrap;">' +
                            '<h3 style="margin:0;">Daily quests</h3>' +
                            '<div id="abSaDailyRerollSlot"></div>' +
                        '</div>' +
                        '<div class="ab-muted" style="font-size:0.85em; margin:0.4em 0 0.85em;">Resets at midnight UTC. Everyone shares the same daily challenge.</div>' +
                        '<div id="abSaDailyQuest" data-i18n="common.loading">Loading...</div>' +
                        '<div style="display:flex; align-items:center; justify-content:space-between; gap:0.6em; margin-top:1.6em; flex-wrap:wrap;">' +
                            '<h3 style="margin:0;">Weekly quests</h3>' +
                            '<div id="abSaWeeklyRerollSlot"></div>' +
                        '</div>' +
                        '<div class="ab-muted" style="font-size:0.85em; margin:0.4em 0 0.85em;">Resets every Monday UTC. Bigger reward, harder target.</div>' +
                        '<div id="abSaWeeklyQuest" data-i18n="common.loading">Loading...</div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelRecap" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<div style="display:flex; gap:0.5em; margin-bottom:1em;">' +
                            '<button type="button" class="ab-btn" data-period="week" data-i18n="recap.this_week">This week</button>' +
                            '<button type="button" class="ab-btn" data-period="month" data-i18n="recap.this_month">This month</button>' +
                            '<button type="button" class="ab-btn" data-period="year" data-i18n="recap.this_year">This year</button>' +
                        '</div>' +
                        '<div id="abSaRecap" data-i18n="recap.loading">Loading recap...</div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelLb" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<div class="ab-tabs" style="margin-bottom:1em;">' +
                            '<button type="button" class="ab-tab active" data-lb="score" data-i18n="lb.score">Score</button>' +
                            '<button type="button" class="ab-tab" data-lb="movies" data-i18n="lb.movies">Movies</button>' +
                            '<button type="button" class="ab-tab" data-lb="episodes" data-i18n="lb.episodes">Episodes</button>' +
                            '<button type="button" class="ab-tab" data-lb="hours" data-i18n="lb.hours">Hours</button>' +
                            '<button type="button" class="ab-tab" data-lb="streak" data-i18n="lb.best_streak">Best Streak</button>' +
                            '<button type="button" class="ab-tab" data-lb="series" data-i18n="lb.series">Series</button>' +
                        '</div>' +
                        '<div id="abSaLb" data-i18n="common.loading">Loading...</div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelCompare" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<h3 style="margin:0 0 0.75em;" data-i18n="compare.title">Compare profiles</h3>' +
                        '<div id="abSaCompareHistoryWrap" style="display:none;">' +
                            '<div class="ab-eyebrow" style="margin-bottom:0.5em;" data-i18n="compare.recent">Recent comparisons</div>' +
                            '<div id="abSaCompareHistory" style="display:flex; gap:0.5em; flex-wrap:wrap; margin-bottom:1em;"></div>' +
                        '</div>' +
                        '<div style="display:flex; gap:0.75em; flex-wrap:wrap; margin-bottom:1em;">' +
                            '<select id="abSaCompareUserA" class="ab-select" style="flex:1; min-width:200px;"></select>' +
                            '<div style="font-weight:800; align-self:center; opacity:0.6;" data-i18n="compare.vs">VS</div>' +
                            '<select id="abSaCompareUserB" class="ab-select" style="flex:1; min-width:200px;"></select>' +
                        '</div>' +
                        '<div id="abSaCompareResult"><div class="ab-muted" data-i18n="compare.pick_two">Pick two users to compare.</div></div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelActivity" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<h3 id="abSaActivityHeading" style="margin:0 0 0.75em;" data-i18n="activity.server_feed">Server activity feed</h3>' +
                        '<div style="display:flex; gap:0.6em; flex-wrap:wrap; margin-bottom:1em; align-items:center;">' +
                            '<select id="abSaActivityUserFilter" class="ab-select" style="min-width:200px;"></select>' +
                            '<div style="flex:1;"></div>' +
                            '<div id="abSaActivityPager" class="ab-pager"></div>' +
                        '</div>' +
                        '<div id="abSaActivity" data-i18n="common.loading">Loading...</div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelWrapped" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<div style="display:flex; align-items:center; gap:1em; margin-bottom:1em; flex-wrap:wrap;">' +
                            '<h3 style="margin:0;" data-i18n="wrapped.title">Year wrapped</h3>' +
                            '<select id="abSaWrappedYear" class="ab-select" style="width:auto;"></select>' +
                            '<div class="ab-muted" style="font-size:0.85em;" data-i18n="wrapped.description">Spotify-style end-of-year recap of your viewing</div>' +
                        '</div>' +
                        '<div id="abSaWrapped" data-i18n="common.loading">Loading...</div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelStats" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<h3 style="margin:0 0 0.75em;" data-i18n="stats.your_data">Your data</h3>' +
                        '<div id="abSaCategoryRings" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:0.75em; margin-bottom:1.25em;"></div>' +
                        '<div id="abSaCharts" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1em;"></div>' +
                        '<h3 style="margin:1.5em 0 0.75em;" data-i18n="stats.personal_records">Personal records</h3>' +
                        '<div id="abSaRecords" data-i18n="common.loading">Loading...</div>' +
                        '<h3 style="margin:1.5em 0 0.75em;" data-i18n="stats.score_bank">Score bank & prestige</h3>' +
                        '<div id="abSaBank" data-i18n="common.loading">Loading...</div>' +
                        '<h3 style="margin:1.5em 0 0.75em;" data-i18n="stats.prestige_lb">Prestige leaderboard</h3>' +
                        '<div id="abSaPrestigeLb" data-i18n="common.loading">Loading...</div>' +
                        '<h3 style="margin:1.5em 0 0.75em;" data-i18n="stats.server_stats">Server stats</h3>' +
                        '<div id="abSaServerStats" data-i18n="common.loading">Loading...</div>' +
                        '<h3 style="margin:1.5em 0 0.75em;" data-i18n="stats.notification_prefs">Notification preferences</h3>' +
                        '<div class="ab-muted" style="font-size:0.85em; margin-bottom:0.5em;" data-i18n="stats.notification_prefs_desc">Control what the plugin shows you and whether you appear in server features.</div>' +
                        '<div id="abSaPrefs" class="ab-prefs" data-i18n="common.loading">Loading...</div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelLoadout" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<div id="abSaLoadoutHero" style="display:flex; gap:1em; flex-wrap:wrap; align-items:center; justify-content:space-between; padding:1.1em 1.35em; border-radius:14px; background:linear-gradient(135deg, rgba(102,126,234,0.22), rgba(118,75,162,0.22)); border:1px solid rgba(255,255,255,0.1); margin-bottom:1.25em; box-shadow:0 6px 24px rgba(0,0,0,0.18);">' +
                            '<div>' +
                                '<div class="ab-muted" style="font-size:0.78em; letter-spacing:0.06em; text-transform:uppercase; font-weight:600;" data-i18n="loadout.score_balance">Score balance</div>' +
                                '<div style="display:flex; align-items:baseline; gap:0.5em; margin-top:0.25em;">' +
                                    '<div id="abSaLoadoutScore" style="font-size:2.6em; font-weight:800; background:linear-gradient(135deg,#a3b5f7,#d4c1ff); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; line-height:1;">0</div>' +
                                    '<div class="ab-muted" style="font-size:0.9em;" data-i18n="loadout.shop.score">score</div>' +
                                '</div>' +
                                '<div class="ab-muted" style="font-size:0.8em; margin-top:0.4em;"><span data-i18n="loadout.lifetime_spent">Lifetime spent:</span> <span id="abSaLoadoutSpent" style="color:rgba(255,255,255,0.85); font-weight:600;">0</span></div>' +
                            '</div>' +
                            '<div id="abSaLoadoutBoostStack" style="display:flex; flex-direction:column; gap:0.5em; align-items:flex-end;"></div>' +
                        '</div>' +
                        '<div class="ab-tabs" style="margin-bottom:1.1em;">' +
                            '<button type="button" class="ab-tab active" data-lo="powerups" data-i18n="loadout.tab.powerups">Power-ups</button>' +
                            '<button type="button" class="ab-tab" data-lo="shop" data-i18n="loadout.tab.shop">Shop</button>' +
                            '<button type="button" class="ab-tab" data-lo="cosmetics" data-i18n="loadout.tab.cosmetics">Cosmetics</button>' +
                        '</div>' +
                        '<div id="abSaLoPanelPowerups" class="ab-lo-panel">' +
                            '<div class="ab-muted" style="font-size:0.88em; margin-bottom:0.85em;" data-i18n="loadout.intro.powerups">Activate consumables you have earned or bought. Streak Freeze auto-consumes if you miss a day.</div>' +
                            '<div id="abSaLoPowerupGrid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:0.85em;"><div class="ab-muted" data-i18n="common.loading">Loading...</div></div>' +
                        '</div>' +
                        '<div id="abSaLoPanelShop" class="ab-lo-panel" style="display:none;">' +
                            '<div class="ab-muted" style="font-size:0.88em; margin-bottom:0.85em;" data-i18n="loadout.intro.shop">Spend score on power-up refills, profile themes, badge frames, and custom rank titles.</div>' +
                            '<div id="abSaLoShopBody"><div class="ab-muted" data-i18n="common.loading">Loading...</div></div>' +
                        '</div>' +
                        '<div id="abSaLoPanelCosmetics" class="ab-lo-panel" style="display:none;">' +
                            '<div class="ab-muted" style="font-size:0.88em; margin-bottom:0.85em;" data-i18n="loadout.intro.cosmetics">Equip cosmetics you own. Theme repaints this page; frame restyles equipped badges; title replaces your auto rank name.</div>' +
                            '<div id="abSaLoCosmeticsBody"><div class="ab-muted" data-i18n="common.loading">Loading...</div></div>' +
                        '</div>' +
                        '<div id="abSaLoStatus" class="ab-muted" style="margin-top:0.85em; font-size:0.85em; min-height:1.2em;"></div>' +
                    '</div>' +
                '</div>' +
                '<div id="abSaPanelSettings" class="ab-panel" style="display:none;">' +
                    '<div class="ab-panel-card">' +
                        '<h3 style="margin:0 0 1em;" data-i18n="settings.title">Settings</h3>' +
                        '<div id="abSaSettingsContent" data-i18n="settings.loading">Loading settings...</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        return r;
    }

    function showError(msg) {
        var e = el('abSaError');
        if (e) { e.textContent = msg; e.style.display = 'block'; }
    }

    function setTab(name) {
        var panels = { badges: 'abSaPanelBadges', quests: 'abSaPanelQuests', recap: 'abSaPanelRecap', lb: 'abSaPanelLb', compare: 'abSaPanelCompare', activity: 'abSaPanelActivity', wrapped: 'abSaPanelWrapped', stats: 'abSaPanelStats', loadout: 'abSaPanelLoadout', settings: 'abSaPanelSettings' };
        var tabs = { badges: 'abSaTabBadges', quests: 'abSaTabQuests', recap: 'abSaTabRecap', lb: 'abSaTabLb', compare: 'abSaTabCompare', activity: 'abSaTabActivity', wrapped: 'abSaTabWrapped', stats: 'abSaTabStats', loadout: 'abSaTabLoadout', settings: 'abSaTabSettings' };
        for (var k in panels) {
            var p = el(panels[k]); if (p) p.style.display = k === name ? 'block' : 'none';
            var t = el(tabs[k]); if (t) t.classList.toggle('active', k === name);
        }
        if (name === 'recap') { loadRecap('week'); }
        if (name === 'stats') { loadStats(); }
        if (name === 'quests') { loadQuests(); }
        if (name === 'compare') { loadCompareUserList(); }
        if (name === 'activity') { loadActivity(); }
        if (name === 'wrapped') { loadWrapped(); }
        if (name === 'lb') { loadCategoryLb('score'); }
        if (name === 'loadout') { loadLoadout(); }
        if (name === 'settings') { loadSettingsPanel(); }
    }

    function loadWrapped() {
        var box = el('abSaWrapped');
        var yearSel = el('abSaWrappedYear');
        if (!box) return;
        if (yearSel && yearSel.options.length === 0) {
            var thisYear = new Date().getFullYear();
            for (var y = thisYear; y >= thisYear - 4; y--) {
                var opt = document.createElement('option');
                opt.value = y; opt.textContent = y;
                yearSel.appendChild(opt);
            }
            yearSel.addEventListener('change', loadWrapped);
        }
        var year = yearSel ? yearSel.value : new Date().getFullYear();
        box.innerHTML = tr('common.loading', 'Loading...');
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/wrapped?year=' + year).then(function (w) {
            if (!w || w.Empty) { box.innerHTML = '<div class="ab-muted" style="padding:2em; text-align:center;">' + tr('wrapped.no_activity', 'No watching activity found for this year.') + ' (' + year + ')</div>'; return; }

            var card = function (accent, icon, big, label) {
                return '<div class="ab-wrapped-card ' + accent + '">' +
                    (icon ? '<div class="ab-wrapped-icon">' + icon + '</div>' : '') +
                    '<div class="ab-wrapped-big">' + big + '</div>' +
                    '<div class="ab-wrapped-label">' + label + '</div>' +
                '</div>';
            };

            var listCard = function (accent, icon, title, items, suffix) {
                var listHtml = items && items.length
                    ? '<ul class="ab-wrapped-list">' + items.slice(0, 5).map(function (x) {
                        return '<li><strong>' + escapeHtml(x.Name) + '</strong><span>' + x.Count + (suffix || '') + '</span></li>';
                    }).join('') + '</ul>'
                    : '<div class="ab-muted" style="font-size:0.85em; margin-top:0.5em;">' + tr('wrapped.no_data', 'No data') + '</div>';
                return '<div class="ab-wrapped-card ' + accent + '">' +
                    (icon ? '<div class="ab-wrapped-icon">' + icon + '</div>' : '') +
                    '<div class="ab-wrapped-label" style="margin-bottom:0.3em;">' + title + '</div>' +
                    listHtml +
                '</div>';
            };

            box.innerHTML =
                '<div class="ab-wrapped-hero">' +
                    '<div class="ab-wrapped-hero-label">' + tr('wrapped.hero_label', 'Your year in Jellyfin') + '</div>' +
                    '<div class="ab-wrapped-hero-year">\u2014 ' + year + ' \u2014</div>' +
                    '<div class="ab-wrapped-hero-big">' + w.TotalItemsWatched + '</div>' +
                    '<div class="ab-wrapped-hero-sub">' + tr('wrapped.items_watched', 'items watched') + '</div>' +
                '</div>' +

                '<div class="ab-wrapped-section">' +
                    '<div class="ab-wrapped-section-title">' + tr('wrapped.your_numbers', 'Your numbers') + '</div>' +
                    '<div class="ab-wrapped-grid">' +
                        card('', '🎬', w.MoviesWatched, tr('wrapped.movies_watched_label', 'movies watched')) +
                        card('', '📺', w.EpisodesWatched, tr('wrapped.episodes_label', 'episodes')) +
                        card('cool', '📅', w.ActiveDays, tr('wrapped.active_days_label', 'active days')) +
                        card('warm', '🔥', w.BestStreak, tr('wrapped.best_streak_label', 'best streak ever')) +
                        card('gold', '⏱️', w.TotalHoursWatched, tr('wrapped.total_hours_label', 'total hours')) +
                    '</div>' +
                '</div>' +

                '<div class="ab-wrapped-section">' +
                    '<div class="ab-wrapped-section-title">' + tr('wrapped.your_highlights', 'Your highlights') + '</div>' +
                    '<div class="ab-wrapped-grid">' +
                        (w.BiggestDay ? card('warm', '🏆', w.BiggestDayCount, tr('wrapped.biggest_day_label', 'items on') + ' ' + w.BiggestDay) : '') +
                        (w.TopMonth ? card('cool', '🗓️', w.TopMonthCount, tr('wrapped.top_month_label', 'items in') + ' ' + w.TopMonth) : '') +
                        (w.TopDayOfWeek ? card('green', '⭐', w.TopDayOfWeekCount, tr('wrapped.top_dow_label', 'on a') + ' ' + w.TopDayOfWeek) : '') +
                    '</div>' +
                '</div>' +

                '<div class="ab-wrapped-section">' +
                    '<div class="ab-wrapped-section-title">' + tr('wrapped.your_favorites', 'Your favorites') + '</div>' +
                    '<div class="ab-wrapped-grid">' +
                        listCard('cool', '🎭', tr('recap.top_genres', 'Top genres'), w.TopGenres) +
                        listCard('warm', '🎬', tr('recap.top_directors', 'Top directors'), w.TopDirectors) +
                        listCard('gold', '⭐', tr('recap.top_actors', 'Top actors'), w.TopActors) +
                    '</div>' +
                '</div>';
        }).catch(function () {
            box.innerHTML = '<div class="ab-muted">' + tr('wrapped.load_failed', 'Failed to load wrapped.') + '</div>';
        });
    }

    // Inline SVG dice icon used by the reroll button so it renders even when
    // the host page hasn't loaded the Material Icons font.
    function diceSvg(size) {
        var s = size || 14;
        return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;">' +
            '<path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm3.5 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM8.5 14.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>' +
        '</svg>';
    }

    function renderQuestCards(list, containerId, _ignoredAllowReroll, _ignoredRem, _ignoredPeriod) {
        var box = el(containerId);
        if (!box) return;
        if (!list || !list.length) { box.innerHTML = '<div class="ab-muted">' + tr('quests.none_available', 'No quests available.') + '</div>'; return; }

        box.innerHTML = list.map(function (q) {
            var pct = q.Target ? Math.round(100 * (q.Current || 0) / q.Target) : 0;
            var borderColor = q.Completed ? '#4caf50' : 'rgba(255,255,255,0.1)';
            var glow = q.Completed ? 'box-shadow:0 0 20px rgba(76,175,80,0.15);' : '';
            var title = tr('quest.' + q.Id + '.title', q.Title);
            var desc = tr('quest.' + q.Id + '.desc', q.Description || '');
            return '<div style="padding:0.95em 1.1em; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid ' + borderColor + ';' + glow + ' margin-bottom:0.75em;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; gap:0.5em; flex-wrap:wrap;">' +
                    '<div style="font-weight:700; font-size:1.05em;">' + escapeHtml(title) + (q.Completed ? ' \u2713' : '') + '</div>' +
                    '<div style="font-size:0.78em; padding:0.25em 0.6em; border-radius:999px; background:rgba(102,126,234,0.2); color:#a3b5f7; font-weight:600;">+' + (q.Reward || 0) + ' ' + tr('quests.pts', 'pts') + '</div>' +
                '</div>' +
                '<div class="ab-muted" style="font-size:0.88em; margin-top:0.3em;">' + escapeHtml(desc) + '</div>' +
                '<div style="height:8px; border-radius:4px; background:rgba(255,255,255,0.08); margin-top:0.85em; overflow:hidden;">' +
                    '<div style="height:100%; width:' + pct + '%; background:' + (q.Completed ? 'linear-gradient(90deg,#66bb6a,#4caf50)' : 'linear-gradient(90deg,#667eea,#764ba2)') + '; transition:width 0.4s;"></div>' +
                '</div>' +
                '<div class="ab-muted" style="font-size:0.78em; margin-top:0.35em; text-align:right;">' + (q.Current || 0) + ' / ' + (q.Target || 0) + '</div>' +
            '</div>';
        }).join('');
    }

    // Render the single per-section reroll button into the slot in the
    // quests panel header. One reroll per period (daily/weekly) rerolls the
    // entire set on the server, so showing a button per-card was misleading.
    function renderRerollSlot(slotId, period, remaining) {
        var slot = el(slotId); if (!slot) return;
        var canReroll = remaining > 0;
        var rerollPath = (period === 'weekly') ? 'quests/weekly/reroll' : 'quests/daily/reroll';
        var usedLabel  = (period === 'weekly')
            ? tr('loadout.reroll.used_weekly', 'REROLLED THIS WEEK')
            : tr('loadout.reroll.used_daily', 'REROLLED TODAY');
        var tip        = (period === 'weekly') ? 'Reroll this week\'s quests (1 per ISO week)' : 'Reroll today\'s daily set (1 per UTC day)';
        if (canReroll) {
            slot.innerHTML = '<button type="button" class="ab-quest-reroll"' +
                ' title="' + tip + '"' +
                ' style="background:linear-gradient(180deg,#5e6ad2,#4c5bc0); color:#fff; border:none; padding:0.45em 1em; border-radius:999px; font-size:0.78em; font-weight:800; letter-spacing:0.06em; cursor:pointer; display:inline-flex; align-items:center; gap:0.4em; box-shadow:0 4px 12px rgba(94,106,210,0.45); transition:filter 150ms ease, transform 150ms ease;">' +
                diceSvg(14) + '<span>' + tr('loadout.reroll.btn', 'REROLL SET') + '</span>' +
            '</button>';
            var btn = slot.firstChild;
            btn.addEventListener('mouseover', function () { btn.style.filter = 'brightness(1.15)'; btn.style.transform = 'translateY(-1px)'; });
            btn.addEventListener('mouseout',  function () { btn.style.filter = ''; btn.style.transform = ''; });
            btn.addEventListener('click', function () {
                if (!userId) return;
                btn.disabled = true;
                btn.style.opacity = '0.6';
                btn.innerHTML = diceSvg(14) + '<span>' + tr('loadout.reroll.in_progress', 'REROLLING\u2026') + '</span>';
                fetchJson('Plugins/AchievementBadges/users/' + userId + '/' + rerollPath, 'POST', {})
                    .then(function () { loadQuests(); })
                    .catch(function () { loadQuests(); });
            });
        } else {
            slot.innerHTML = '<span class="ab-quest-reroll-used"' +
                ' title="Available again ' + (period === 'weekly' ? 'Monday UTC' : 'at UTC midnight') + '"' +
                ' style="background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.55); border:1px solid rgba(255,255,255,0.1); padding:0.4em 0.95em; border-radius:999px; font-size:0.72em; font-weight:700; letter-spacing:0.06em; display:inline-flex; align-items:center; gap:0.35em;">' +
                diceSvg(12) + '<span>' + usedLabel + '</span>' +
            '</span>';
        }
    }

    function loadQuests() {
        if (!userId) return;
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/quests').then(function (res) {
            var dRem = (res && typeof res.DailyRerollsRemaining === 'number') ? res.DailyRerollsRemaining : 1;
            var wRem = (res && typeof res.WeeklyRerollsRemaining === 'number') ? res.WeeklyRerollsRemaining : 1;
            renderQuestCards(res && res.Daily, 'abSaDailyQuest');
            renderQuestCards(res && res.Weekly, 'abSaWeeklyQuest');
            renderRerollSlot('abSaDailyRerollSlot', 'daily', dRem);
            renderRerollSlot('abSaWeeklyRerollSlot', 'weekly', wRem);
        }).catch(function (err) {
            // Both panels own a "Loading..." placeholder, so both have to be
            // overwritten. Writing only into the daily one left the weekly
            // panel saying "Loading..." forever, which reads as a slow request
            // rather than a failed one.
            var msg = '<div class="ab-muted">' + tr('quests.load_failed', 'Failed to load quests.') + '</div>';
            var d = el('abSaDailyQuest'); if (d) d.innerHTML = msg;
            var w = el('abSaWeeklyQuest'); if (w) w.innerHTML = msg;
            console.warn('[AchievementBadges] quests load failed', err);
        });
    }

    // --- v2.0: Loadout (Power-ups + Shop + Cosmetics) ---
    var _loSubtabInit = false;
    var _loThemeApplied = '';

    function loSetStatus(msg, isError) {
        var s = el('abSaLoStatus'); if (!s) return;
        s.textContent = msg || '';
        s.style.color = isError ? '#f87171' : '';
    }

    function loShowSubtab(name) {
        ['powerups', 'shop', 'cosmetics'].forEach(function (id) {
            var p = el('abSaLoPanel' + id.charAt(0).toUpperCase() + id.slice(1));
            if (p) p.style.display = (id === name) ? '' : 'none';
        });
        var btns = document.querySelectorAll('#abSaPanelLoadout .ab-tabs button[data-lo]');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('active', btns[i].getAttribute('data-lo') === name);
        }
    }

    // v2.0.x: revamp page section header reads from data-rv-label on the
    // .ab-hero so we can localize what used to be a CSS-hardcoded English
    // "01 / ACHIEVEMENT PROFILE". Re-runs on every translation load.
    function syncRevampSectionLabel() {
        if (!root) return;
        var hero = root.querySelector('.ab-hero');
        if (!hero) return;
        var label = '01 / ' + tr('achievements.profile_title', 'Achievement Profile');
        hero.setAttribute('data-rv-label', label);
    }

    function applyEquippedThemeStd(themeId) {
        if (!root) return;
        if (_loThemeApplied) root.classList.remove(_loThemeApplied);
        if (themeId) { root.classList.add(themeId); _loThemeApplied = themeId; }
        else _loThemeApplied = '';
    }

    // v2.0: live countdown for XP Boost + multi-pill rendering for the
    // hero. Each active power-up gets its own pill (XP Boost shows a ticking
    // MM:SS, DoubleCredit shows "ON NEXT WATCH", StreakFreeze shows
    // "PROTECTING STREAK"). The timer is a single setInterval that updates
    // the visible XP-Boost pill text — replacing the previous code that did
    // `new Date(null).toLocaleTimeString()` and rendered "Invalid Date".
    var _boostTimer = null;
    var _boostExpiry = 0;
    function renderActiveBoostStack(inventory) {
        var stack = el('abSaLoadoutBoostStack');
        if (!stack) return;
        var actives = inventory.filter(function (i) { return i.Active; });
        if (!actives.length) {
            stack.innerHTML = '';
            stopBoostTimer();
            return;
        }
        var html = actives.map(function (item) {
            switch (item.Type) {
                case 'XpBoost':
                    return '<div class="ab-boost-pill ab-boost-xp">' +
                            '<div class="ab-boost-pill-head"><span class="material-icons">flash_on</span><span>' + tr('loadout.boost.xp', 'XP BOOST') + '</span></div>' +
                            '<div class="ab-boost-pill-body"><span id="abSaXpBoostCountdown">--:--</span></div>' +
                        '</div>';
                case 'DoubleCredit':
                    return '<div class="ab-boost-pill ab-boost-dc">' +
                            '<div class="ab-boost-pill-head"><span class="material-icons">looks_two</span><span>' + tr('loadout.boost.dc', 'DOUBLE CREDIT') + '</span></div>' +
                            '<div class="ab-boost-pill-body">' + tr('loadout.boost.dc_msg', '+2x on next watch') + '</div>' +
                        '</div>';
                case 'StreakFreeze':
                    return '<div class="ab-boost-pill ab-boost-sf">' +
                            '<div class="ab-boost-pill-head"><span class="material-icons">ac_unit</span><span>' + tr('loadout.boost.sf', 'STREAK FREEZE') + '</span></div>' +
                            '<div class="ab-boost-pill-body">' + tr('loadout.boost.sf_msg', 'Streak protected') + '</div>' +
                        '</div>';
                default:
                    return '';
            }
        }).join('');
        stack.innerHTML = html;
        // Wire the XP Boost live countdown
        var xp = actives.filter(function (i) { return i.Type === 'XpBoost'; })[0];
        if (xp && xp.ActiveUntil) {
            var t = Date.parse(xp.ActiveUntil);
            if (!isNaN(t)) {
                _boostExpiry = t;
                startBoostTimer();
            } else {
                _boostExpiry = 0;
                stopBoostTimer();
                var cd = el('abSaXpBoostCountdown'); if (cd) cd.textContent = 'active';
            }
        } else {
            stopBoostTimer();
        }
    }
    function startBoostTimer() {
        if (_boostTimer) clearInterval(_boostTimer);
        var tick = function () {
            var cd = el('abSaXpBoostCountdown');
            if (!cd || !_boostExpiry) { stopBoostTimer(); return; }
            var ms = _boostExpiry - Date.now();
            if (ms <= 0) {
                cd.textContent = '00:00';
                stopBoostTimer();
                // Refresh inventory so the pill clears when the server-side
                // boost actually expires (cheap call, only when timer hits 0).
                if (typeof loadLoadout === 'function') loadLoadout();
                return;
            }
            var s = Math.floor(ms / 1000);
            var h = Math.floor(s / 3600);
            var m = Math.floor((s % 3600) / 60);
            var sec = s % 60;
            var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
            cd.textContent = (h > 0 ? pad(h) + ':' : '') + pad(m) + ':' + pad(sec);
        };
        tick();
        _boostTimer = setInterval(tick, 1000);
    }
    function stopBoostTimer() {
        if (_boostTimer) { clearInterval(_boostTimer); _boostTimer = null; }
    }

    // v2.0: pull current cosmetic equip state + catalog and surface what the
    // rest of the renderer needs (frame id for badge cards, custom title name
    // for the rank label). Cached so we only fetch the catalog once per page
    // session — equip/unequip handlers force a refresh by passing force=true.
    function loadV2Cosmetics(force) {
        if (!userId) return Promise.resolve(null);
        var catP = (v2CosmeticsCatalogCache && !force)
            ? Promise.resolve(v2CosmeticsCatalogCache)
            : fetchJson('Plugins/AchievementBadges/shop/catalog').then(function (c) { v2CosmeticsCatalogCache = c; return c; });
        return Promise.all([
            catP,
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/cosmetics')
        ]).then(function (r) {
            var catalog = r[0] || {}; var own = r[1] || {};
            v2EquippedFrameId = own.EquippedBadgeFrameId || '';
            v2EquippedThemeId = own.EquippedThemeId || '';
            v2EquippedBackgroundId = own.EquippedBackgroundId || '';
            v2EquippedBorderId = own.EquippedProfileBorderId || '';
            v2EquippedTitleName = '';
            v2EquippedAvatarEmoji = '';
            var tid = own.EquippedCustomTitleId;
            var avid = own.EquippedAvatarId;
            if (catalog.Cosmetics) {
                if (tid) {
                    var found = catalog.Cosmetics.filter(function (c) { return c.Id === tid; })[0];
                    if (found) v2EquippedTitleName = trCatName(found.Id, found.DisplayName || '');
                }
                if (avid) {
                    var av = catalog.Cosmetics.filter(function (c) { return c.Id === avid; })[0];
                    if (av) v2EquippedAvatarEmoji = av.PreviewColor || '';
                }
            }
            applyEquippedThemeStd(v2EquippedThemeId);
            applyEquippedBackground(v2EquippedBackgroundId);
            applyEquippedBorder(v2EquippedBorderId);
            return own;
        }).catch(function () { return null; });
    }

    // v2.0.x: swap the bg-* class on the root (mirrors how theme- works).
    // The CSS animation for each background id is shipped in injectStyles().
    // For video-backed bgs (blackhole, nebula, fireflies, galaxy) we also
    // inject a <video> element that streams the embedded MP4 loop — the
    // class still gets applied so CSS picks up theme/page bg color.
    var _bgApplied = '';
    // Every bg that has a real video asset shipped under /asset/. The CSS
    // ::before animation for these ids must NOT paint at the same time, or
    // you get the old CSS conic ring spinning on top of the video (the black
    // hole color-bar bug). Adding `has-video-bg` to root suppresses the
    // pseudo via the CSS rule shipped in injectStyles().
    var VIDEO_BG_IDS = [
        'bg-blackhole', 'bg-nebula', 'bg-fireflies', 'bg-galaxy',
        'bg-moonlit-village', 'bg-rainy-station', 'bg-matrix', 'bg-aurora'
    ];
    function applyEquippedBackground(bgId) {
        if (!root) return;
        if (_bgApplied) root.classList.remove(_bgApplied);
        root.classList.remove('has-video-bg');
        // Tear down any previous video + overlay
        var oldVid = document.getElementById('abSaBgVideo');
        if (oldVid && oldVid.parentNode) oldVid.parentNode.removeChild(oldVid);
        var oldOver = document.getElementById('abSaBgOverlay');
        if (oldOver && oldOver.parentNode) oldOver.parentNode.removeChild(oldOver);

        if (bgId && bgId !== 'bg-none') {
            root.classList.add(bgId);
            _bgApplied = bgId;
            if (VIDEO_BG_IDS.indexOf(bgId) >= 0) {
                root.classList.add('has-video-bg');
                var v = document.createElement('video');
                v.id = 'abSaBgVideo';
                v.autoplay = true;
                v.loop = true;
                v.muted = true;
                v.playsInline = true;
                v.setAttribute('playsinline', '');
                v.setAttribute('disableremoteplayback', '');
                v.src = buildUrl('Plugins/AchievementBadges/asset/' + encodeURIComponent(bgId));
                v.style.cssText = 'position:fixed; inset:0; width:100vw; height:100vh; object-fit:cover; z-index:0; pointer-events:none; opacity:0.50; filter:brightness(0.62) saturate(0.85);';
                root.insertBefore(v, root.firstChild);
                v.play().catch(function () { /* swallow — will start on click */ });

                // Stronger dark overlay — the previous gradient still let too
                // much hot color show through near the top/bottom edges. Pure
                // 50% black with a slight vignette gradient = readable UI on
                // every bg from black hole to fireflies.
                var overlay = document.createElement('div');
                overlay.id = 'abSaBgOverlay';
                overlay.style.cssText = 'position:fixed; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.55) 100%); z-index:0; pointer-events:none;';
                root.insertBefore(overlay, v.nextSibling);
            }
        } else {
            _bgApplied = '';
        }
    }

    // v2.0.x: profile-border class on root drives the .ab-hero edge effect.
    var _borderApplied = '';
    function applyEquippedBorder(borderId) {
        if (!root) return;
        if (_borderApplied) root.classList.remove(_borderApplied);
        if (borderId && borderId !== 'border-none') {
            root.classList.add(borderId);
            _borderApplied = borderId;
        } else {
            _borderApplied = '';
        }
    }

    // Re-paints the equipped-badge frame + rank-label custom title without
    // having to rerun the heavier loadAll. Safe to call any time after
    // loadV2Cosmetics() has populated state.
    function reapplyV2Visuals() {
        // Strip then reapply frame class on equipped badge cards (frame
        // cosmetic only applies to equipped badges, matching the design spec).
        var FRAME_CLASSES = ['frame-default', 'frame-gilded', 'frame-holo', 'frame-frosted'];
        var cards = document.querySelectorAll('#abSaEquipped .ab-card');
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            for (var j = 0; j < FRAME_CLASSES.length; j++) card.classList.remove(FRAME_CLASSES[j]);
            if (v2EquippedFrameId && v2EquippedFrameId !== 'frame-default') {
                card.classList.add(v2EquippedFrameId);
            }
        }
        // Rank label substitution — only if a custom title is equipped. Mirrors
        // the loadAll rendering: small star prefix + gold-gradient Cinzel italic
        // title + faded tier name as a subtle suffix.
        var lbl = el('abSaRankLabel');
        if (lbl && v2EquippedTitleName) {
            var tierTxt = (lbl.dataset && lbl.dataset.abTier) || '';
            lbl.innerHTML =
                '<span style="display:inline-flex; align-items:center; gap:0.4em;">' +
                    '<span style="color:#fcd34d; font-size:0.85em;">&#9733;</span>' +
                    '<span style="font-family:\'Cinzel\',\'Trajan Pro\',Georgia,serif; font-style:italic; font-weight:700; letter-spacing:0.03em; background:linear-gradient(135deg,#fcd34d 0%,#f59e0b 50%,#fde68a 100%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;">' + escapeHtml(v2EquippedTitleName) + '</span>' +
                    (tierTxt ? '<span class="ab-muted" style="font-size:0.65em; font-weight:500; opacity:0.55; margin-left:0.1em;">&middot; ' + escapeHtml(tierTxt) + '</span>' : '') +
                '</span>';
        }
        // v2.0 Avatar: replace the default 🏅 next to the rank label. When
        // nothing is equipped, restore the default so unequip is reversible.
        var icon = el('abSaRankIcon');
        if (icon) {
            icon.textContent = v2EquippedAvatarEmoji || '🏅';
        }
    }

    function themeSwatchFor(id) {
        switch (id) {
            case 'theme-sunset':     return 'linear-gradient(135deg,#ff6b6b,#feca57,#ff9f43)';
            case 'theme-cyberpunk':  return 'linear-gradient(135deg,#0f0f23,#ff006e,#06ffa5)';
            case 'theme-pastel':     return 'linear-gradient(135deg,#ffeaa7,#fab1a0,#a29bfe)';
            case 'theme-monochrome': return 'linear-gradient(135deg,#2d3436,#636e72,#dfe6e9)';
            case 'theme-noir':       return 'linear-gradient(135deg,#1c1917,#44403c,#a8a29e)';
            case 'theme-aurora':     return 'linear-gradient(135deg,#064e3b,#10b981,#3b82f6,#8b5cf6)';
            case 'theme-crimson':    return 'linear-gradient(135deg,#450a0a,#dc2626,#7c2d12)';
            case 'theme-vaporwave':  return 'linear-gradient(135deg,#ec4899,#a855f7,#06b6d4,#fde68a)';
            case 'theme-galaxy':     return 'linear-gradient(135deg,#1e1b4b,#581c87,#a855f7,#fcd34d)';
            case 'theme-forest':     return 'linear-gradient(135deg,#15803d,#854d0e,#facc15)';
            case 'theme-ocean':      return 'linear-gradient(135deg,#0c4a6e,#0e7490,#22d3ee)';
            case 'theme-rosegold':   return 'linear-gradient(135deg,#fb7185,#fbbf24,#fde68a)';
            case 'theme-midnight':   return 'linear-gradient(135deg,#020617,#1e1b4b,#3730a3)';
            default:                 return 'linear-gradient(135deg,#667eea,#764ba2)';
        }
    }

    function frameSwatchFor(id) {
        switch (id) {
            case 'frame-gilded':   return 'background:#1a1410; border:2px solid #f59e0b; box-shadow:inset 0 0 8px rgba(245,158,11,0.45);';
            case 'frame-holo':     return 'background:linear-gradient(135deg,#0ea5e9,#a855f7,#ec4899); border:2px solid #fff;';
            case 'frame-frosted':  return 'background:rgba(255,255,255,0.1); border:2px solid rgba(255,255,255,0.6);';
            case 'frame-obsidian': return 'background:#0c0a09; border:2px solid #292524; box-shadow:inset 0 0 12px rgba(220,38,38,0.4);';
            case 'frame-emerald':  return 'background:#022c22; border:2px solid #10b981; box-shadow:inset 0 0 10px rgba(16,185,129,0.45);';
            case 'frame-neon':     return 'background:#1f0a1a; border:2px solid #ec4899; box-shadow:0 0 14px rgba(236,72,153,0.7), inset 0 0 8px rgba(236,72,153,0.4);';
            default:               return 'background:rgba(255,255,255,0.05); border:2px solid rgba(255,255,255,0.18);';
        }
    }

    function loadLoadout() {
        if (!userId) return;
        if (!_loSubtabInit) {
            _loSubtabInit = true;
            var subBtns = document.querySelectorAll('#abSaPanelLoadout .ab-tabs button[data-lo]');
            for (var i = 0; i < subBtns.length; i++) {
                (function (b) { b.addEventListener('click', function () { loShowSubtab(b.getAttribute('data-lo')); }); })(subBtns[i]);
            }
        }
        Promise.all([
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/powerups'),
            fetchJson('Plugins/AchievementBadges/shop/catalog'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/cosmetics')
        ]).then(function (r) {
            var pu = r[0] || {}; var catalog = r[1] || {}; var cos = r[2] || {};
            var sEl = el('abSaLoadoutScore'); if (sEl) sEl.textContent = pu.ScoreBank || 0;
            var spEl = el('abSaLoadoutSpent'); if (spEl) spEl.textContent = cos.LifetimeScoreSpent || 0;
            renderActiveBoostStack(pu.Inventory || []);
            renderLoadoutPowerups(pu);
            var ownedSet = {};
            (cos.Owned || []).forEach(function (id) { ownedSet[id] = true; });
            lifetimeScoreForShop = (typeof cos.LifetimeScore === 'number') ? cos.LifetimeScore : (pu.ScoreBank || 0);
            renderLoadoutShop(catalog, ownedSet);
            renderLoadoutCosmetics(catalog, ownedSet, cos);
            applyEquippedThemeStd(cos.EquippedThemeId);
        }).catch(function (e) { loSetStatus((e && e.message) || tr('loadout.load_failed', 'Load failed'), true); });
    }

    function renderLoadoutPowerups(data) {
        var host = el('abSaLoPowerupGrid'); if (!host) return;
        var inv = (data && data.Inventory) || [];
        if (!inv.length) {
            host.innerHTML = '<div class="ab-muted" style="padding:1em; border:1px dashed rgba(255,255,255,0.15); border-radius:10px;">' + tr('loadout.pu.empty', 'No power-ups yet. Earn from daily login bonuses or buy refills in the Shop.') + '</div>';
            return;
        }
        host.innerHTML = inv.map(function (item) {
            var canUse = item.Count > 0 && item.Type !== 'StreakFreeze';
            var activePill = item.Active
                ? '<span style="display:inline-block; margin-left:0.5em; padding:0.18em 0.6em; background:#10b981; color:#03150e; border-radius:999px; font-size:0.66em; font-weight:800; letter-spacing:0.04em;">' + tr('loadout.pu.active', 'ACTIVE') + '</span>'
                : '';
            var action = canUse
                ? '<button type="button" class="ab-btn" data-lo-use="' + (item.Type || '') + '" style="background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; padding:0.45em 1em; border-radius:8px; font-weight:600;">' + tr('loadout.pu.use', 'Use') + '</button>'
                : (item.Type === 'StreakFreeze'
                    ? '<span class="ab-muted" style="font-size:0.78em;">' + tr('loadout.pu.auto_consumed', 'Auto-consumed') + '</span>'
                    : '<span class="ab-muted" style="font-size:0.78em;">' + tr('loadout.pu.none_to_use', 'None to use') + '</span>');
            return '<div class="ab-lo-card" style="border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:0.95em 1em; background:linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)); transition:transform .15s ease, border-color .15s ease, box-shadow .15s ease;">' +
                '<div style="display:flex; align-items:center; gap:0.6em; margin-bottom:0.35em;">' +
                    '<span class="material-icons" style="font-size:1.6em; color:#a3b5f7;">' + escapeHtml(item.Icon || 'extension') + '</span>' +
                    '<div style="font-weight:700; font-size:1.02em;">' + escapeHtml(trPuName(item.Type, item.DisplayName)) + activePill + '</div>' +
                '</div>' +
                '<div class="ab-muted" style="font-size:0.84em; margin:0.2em 0 0.75em;">' + escapeHtml(trPuDesc(item.Type, item.Description)) + '</div>' +
                '<div style="display:flex; align-items:center; justify-content:space-between; gap:0.6em;">' +
                    '<div><span style="font-size:1.4em; font-weight:800;">' + (item.Count || 0) + '</span> <span class="ab-muted" style="font-size:0.78em;">' + tr('loadout.pu.owned', 'owned') + '</span></div>' +
                    action +
                '</div>' +
                (item.ActiveUntil ? '<div class="ab-muted" style="font-size:0.74em; margin-top:0.55em; text-align:right;">' + tr('loadout.pu.until', 'Until') + ' ' + new Date(item.ActiveUntil).toLocaleTimeString() + '</div>' : '') +
            '</div>';
        }).join('');
        host.querySelectorAll('button[data-lo-use]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var type = btn.getAttribute('data-lo-use');
                btn.disabled = true;
                fetchJson('Plugins/AchievementBadges/users/' + userId + '/powerups/use/' + encodeURIComponent(type), 'POST', {})
                    .then(function (r) { loSetStatus((r && r.Message) || tr('loadout.used', 'Activated.')); loadLoadout(); })
                    .catch(function (e) { loSetStatus((e && e.message) || tr('loadout.use_failed', 'Failed'), true); btn.disabled = false; });
            });
        });
    }

    function powerupIconFor(id) {
        id = id || '';
        if (id.indexOf('xp-boost') >= 0) return 'flash_on';
        if (id.indexOf('double-credit') >= 0) return 'looks_two';
        if (id.indexOf('streak-freeze') >= 0) return 'ac_unit';
        return 'extension';
    }

    // v2.0.x: look up a localized name/description for a catalog item, falling
    // back to the English DisplayName/Description that the server shipped.
    // The key namespace is `cat.{id}.name` / `cat.{id}.desc`.
    function trCatName(id, fallback)  { return tr('cat.' + (id || '') + '.name', fallback || ''); }
    function trCatDesc(id, fallback)  { return tr('cat.' + (id || '') + '.desc', fallback || ''); }
    // Power-ups identify themselves by Type ("XpBoost") rather than Id, so we
    // key inventory cards under `pu.{type}.name` instead. Shop power-up cards
    // (which DO have an Id) use the cat.* namespace via the cosmetic path.
    function trPuName(type, fallback) { return tr('pu.' + (type || '').toLowerCase() + '.name', fallback || ''); }
    function trPuDesc(type, fallback) { return tr('pu.' + (type || '').toLowerCase() + '.desc', fallback || ''); }
    function powerupHeroFor(id) {
        id = id || '';
        if (id.indexOf('xp-boost') >= 0)       return 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 60%,#b45309 100%)';
        if (id.indexOf('double-credit') >= 0)  return 'linear-gradient(135deg,#6ee7b7 0%,#10b981 60%,#065f46 100%)';
        if (id.indexOf('streak-freeze') >= 0)  return 'linear-gradient(135deg,#bae6fd 0%,#3b82f6 60%,#1e3a8a 100%)';
        return 'linear-gradient(135deg,#a3b5f7,#5e6ad2)';
    }

    var lifetimeScoreForShop = 0;
    function renderLoadoutShop(catalog, ownedSet) {
        var host = el('abSaLoShopBody'); if (!host) return;
        var pu  = (catalog && catalog.PowerUps)  || [];
        var cos = (catalog && catalog.Cosmetics) || [];
        var scoreBank = parseInt((el('abSaLoadoutScore') || {}).textContent || '0', 10) || 0;

        // ----- Featured carousel: top 5 unowned items by price (most enticing first) -----
        var featuredPool = cos
            .filter(function (c) { return !ownedSet[c.Id] && c.PriceScore > 0; })
            .sort(function (a, b) { return b.PriceScore - a.PriceScore; })
            .slice(0, 5);
        var featuredHtml = '';
        if (featuredPool.length) {
            featuredHtml = '<div class="ab-store-featured-wrap">' +
                '<div class="ab-store-featured-track" id="abSaFeaturedTrack">' +
                featuredPool.map(function (f) {
                    var fHero = f.Kind === 'ProfileTheme'
                        ? themeSwatchFor(f.Id)
                        : (f.Kind === 'BadgeFrame'
                            ? 'linear-gradient(135deg,#0f172a,#1e293b 60%,#0c4a6e)'
                            : 'linear-gradient(135deg,#1e1b4b,#312e81 60%,#1e3a8a)');
                    var afford = scoreBank >= (f.PriceScore || 0);
                    return '<div class="ab-store-featured" style="background:' + fHero + ';">' +
                        '<div class="ab-store-featured-glow"></div>' +
                        '<div class="ab-store-featured-overlay">' +
                            '<div class="ab-store-featured-eyebrow">★ ' + tr('loadout.shop.featured', 'FEATURED') + '</div>' +
                            '<div class="ab-store-featured-title">' + escapeHtml(trCatName(f.Id, f.DisplayName)) + '</div>' +
                            '<div class="ab-store-featured-desc">' + escapeHtml(trCatDesc(f.Id, f.Description)) + '</div>' +
                            '<div class="ab-store-featured-foot">' +
                                '<div class="ab-store-featured-price">' + (f.PriceScore || 0) + ' <span class="ab-store-featured-price-unit">' + tr('loadout.shop.score', 'score') + '</span></div>' +
                                (afford
                                    ? '<button type="button" class="ab-store-cta" data-lo-buy="' + (f.Id || '') + '">' + tr('loadout.shop.buy_now', 'BUY NOW') + '</button>'
                                    : '<button type="button" class="ab-store-cta off" disabled>' + tr('loadout.shop.need_more', 'NEED MORE SCORE').replace('{n}', String((f.PriceScore || 0) - scoreBank)) + '</button>'
                                ) +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }).join('') +
                '</div>' +
                (featuredPool.length > 1
                    ? '<button type="button" class="ab-store-carousel-btn prev" id="abSaFeaturedPrev" aria-label="Previous">&#8249;</button>' +
                      '<button type="button" class="ab-store-carousel-btn next" id="abSaFeaturedNext" aria-label="Next">&#8250;</button>' +
                      '<div class="ab-store-carousel-dots" id="abSaFeaturedDots">' +
                          featuredPool.map(function (_, i) { return '<button type="button" class="ab-store-carousel-dot' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '" aria-label="Slide ' + (i + 1) + '"></button>'; }).join('') +
                      '</div>'
                    : '') +
            '</div>';
        }

        // ----- Power-ups storefront -----
        var puHtml = '<div class="ab-store-row-head">' +
            '<span class="material-icons">flash_on</span>' +
            '<h3>' + tr('loadout.shop.powerup_refills', 'Power-up Refills') + '</h3>' +
            '<span class="ab-store-row-count">' + pu.length + ' ' + tr('loadout.shop.items', 'items') + '</span>' +
        '</div>' +
        '<div class="ab-store-grid">' +
            pu.map(function (item) {
                var afford = scoreBank >= (item.PriceScore || 0);
                return '<div class="ab-store-card">' +
                    '<div class="ab-store-card-hero" style="background:' + powerupHeroFor(item.Id) + ';">' +
                        '<span class="material-icons ab-store-card-icon">' + powerupIconFor(item.Id) + '</span>' +
                        (item.BundleSize > 1 ? '<div class="ab-store-card-tag">x' + item.BundleSize + ' ' + tr('loadout.shop.bundle', 'BUNDLE') + '</div>' : '') +
                    '</div>' +
                    '<div class="ab-store-card-body">' +
                        '<div class="ab-store-card-title">' + escapeHtml(trCatName(item.Id, item.DisplayName)) + '</div>' +
                        '<div class="ab-store-card-desc">' + escapeHtml(trCatDesc(item.Id, item.Description)) + '</div>' +
                    '</div>' +
                    '<div class="ab-store-card-foot">' +
                        '<div class="ab-store-card-price' + (afford ? '' : ' off') + '">' +
                            '<span class="ab-store-card-price-num">' + (item.PriceScore || 0) + '</span>' +
                            '<span class="ab-store-card-price-unit">' + tr('loadout.shop.score', 'score') + '</span>' +
                        '</div>' +
                        (afford
                            ? '<button type="button" class="ab-store-cta sm" data-lo-buy="' + (item.Id || '') + '">' + tr('loadout.shop.buy', 'BUY') + '</button>'
                            : '<button type="button" class="ab-store-cta sm off" disabled>' + tr('loadout.shop.locked', 'LOCKED') + '</button>'
                        ) +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>';

        // ----- Cosmetics storefronts (themes, frames, titles) -----
        var byKind = { ProfileTheme: [], BadgeFrame: [], RankTitle: [], Avatar: [], Background: [], ProfileBorder: [] };
        cos.forEach(function (c) { if (byKind[c.Kind]) byKind[c.Kind].push(c); });

        var kindMeta = {
            ProfileTheme:  { icon: 'palette',       title: tr('loadout.kind.themes',      'Profile Themes') },
            BadgeFrame:    { icon: 'filter_frames', title: tr('loadout.kind.frames',      'Badge Frames') },
            RankTitle:     { icon: 'military_tech', title: tr('loadout.kind.titles',      'Custom Rank Titles') },
            Avatar:        { icon: 'mood',          title: tr('loadout.kind.avatars',     'Avatars') },
            Background:    { icon: 'animation',     title: tr('loadout.kind.backgrounds', 'Animated Backgrounds') },
            ProfileBorder: { icon: 'border_color',  title: tr('loadout.kind.borders',     'Profile Borders') }
        };

        function cosCard(c, k) {
            var owned = !!ownedSet[c.Id];
            var isMilestone = c.MilestoneScore > 0;
            var afford = scoreBank >= (c.PriceScore || 0);
            var hero, preview;
            if (k === 'ProfileTheme') {
                hero = themeSwatchFor(c.Id);
                preview = '<div class="ab-store-theme-tag">' + escapeHtml(trCatName(c.Id, c.DisplayName)).toUpperCase() + '</div>';
            } else if (k === 'BadgeFrame') {
                hero = 'linear-gradient(135deg,#0f172a,#1e293b 70%,#0c4a6e)';
                preview = '<div class="ab-store-frame-preview" style="' + frameSwatchFor(c.Id) + '"><span class="material-icons" style="font-size:1.9em; color:#fde68a; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));">emoji_events</span></div>';
            } else if (k === 'Avatar') {
                hero = 'radial-gradient(circle at 50% 45%, rgba(102,192,244,0.25), rgba(15,23,42,1) 70%)';
                preview = '<div style="font-size:3.4em; line-height:1; filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));">' + escapeHtml(c.PreviewColor || '★') + '</div>';
            } else if (k === 'Background') {
                // Live mini-preview: scope the bg-* class to a contained
                // element so the shop card shows the animation in a tile.
                hero = '#0f172a';
                preview = '<div class="ab-store-bg-preview ' + (c.Id || '') + '"><span class="material-icons" style="font-size:1.6em; color:rgba(255,255,255,0.45); z-index:2; position:relative;">' + escapeHtml(c.PreviewIcon || 'animation') + '</span></div>';
            } else if (k === 'ProfileBorder') {
                hero = 'linear-gradient(135deg,#1e293b,#0f172a)';
                preview = '<div class="ab-store-border-preview ' + (c.Id || '') + '"><span class="material-icons" style="font-size:1.6em; color:#fcd34d;">' + escapeHtml(c.PreviewIcon || 'border_color') + '</span></div>';
            } else {
                hero = 'linear-gradient(135deg,#1e1b4b,#312e81 70%,#0c4a6e)';
                preview = '<div class="ab-store-title-preview">' + escapeHtml(trCatName(c.Id, c.DisplayName)) + '</div>';
            }

            var foot;
            if (owned) {
                foot = '<div class="ab-store-owned"><span class="material-icons" style="font-size:1.1em;">check_circle</span><span>' + tr('loadout.shop.owned', 'IN LIBRARY') + '</span></div>';
            } else if (isMilestone) {
                // Show concrete progress toward the milestone (lifetime score
                // basis, matches the server's CheckMilestones check). Hits
                // 100% as soon as the user crosses the threshold — next watch
                // event auto-unlocks the cosmetic. Admin "Backfill milestones"
                // tool also grants it on demand.
                var lifetime = (typeof lifetimeScoreForShop === 'number') ? lifetimeScoreForShop : scoreBank;
                var pct = c.MilestoneScore > 0 ? Math.min(100, Math.round(100 * lifetime / c.MilestoneScore)) : 0;
                var pctTxt = lifetime + ' / ' + c.MilestoneScore;
                foot = '<div class="ab-store-milestone-wrap">' +
                    '<div class="ab-store-milestone"><span class="material-icons" style="font-size:1em;">lock</span> ' + tr('loadout.shop.auto_unlock_at', 'Auto-unlock at {n} score').replace('{n}', '<strong>' + c.MilestoneScore + '</strong>') + '</div>' +
                    '<div style="height:6px; border-radius:3px; background:rgba(255,255,255,0.08); margin-top:0.45em; overflow:hidden;">' +
                        '<div style="height:100%; width:' + pct + '%; background:linear-gradient(90deg,#fbbf24,#f59e0b); transition:width 0.4s;"></div>' +
                    '</div>' +
                    '<div style="display:flex; justify-content:space-between; font-size:0.7em; color:rgba(255,255,255,0.55); margin-top:0.3em; font-weight:600; letter-spacing:0.04em;">' +
                        '<span>' + pctTxt + '</span><span>' + pct + '%</span>' +
                    '</div>' +
                '</div>';
            } else {
                foot = '<div class="ab-store-card-price' + (afford ? '' : ' off') + '">' +
                    '<span class="ab-store-card-price-num">' + (c.PriceScore || 0) + '</span>' +
                    '<span class="ab-store-card-price-unit">score</span>' +
                '</div>' +
                (afford
                    ? '<button type="button" class="ab-store-cta sm" data-lo-buy="' + (c.Id || '') + '">BUY</button>'
                    : '<button type="button" class="ab-store-cta sm off" disabled>LOCKED</button>'
                );
            }

            return '<div class="ab-store-card' + (owned ? ' is-owned' : '') + (isMilestone && !owned ? ' is-milestone' : '') + '">' +
                '<div class="ab-store-card-hero" style="background:' + hero + ';">' + preview +
                    (owned ? '<div class="ab-store-card-owned-stripe">' + tr('loadout.shop.owned_stripe', 'OWNED') + '</div>' : '') +
                '</div>' +
                '<div class="ab-store-card-body">' +
                    '<div class="ab-store-card-title">' + escapeHtml(trCatName(c.Id, c.DisplayName)) + '</div>' +
                    '<div class="ab-store-card-desc">' + escapeHtml(trCatDesc(c.Id, c.Description)) + '</div>' +
                '</div>' +
                '<div class="ab-store-card-foot">' + foot + '</div>' +
            '</div>';
        }

        var cosHtml = ['ProfileTheme', 'BadgeFrame', 'RankTitle', 'Avatar', 'Background', 'ProfileBorder'].map(function (k) {
            if (!byKind[k].length) return '';
            var m = kindMeta[k];
            return '<div class="ab-store-row-head">' +
                '<span class="material-icons">' + m.icon + '</span>' +
                '<h3>' + m.title + '</h3>' +
                '<span class="ab-store-row-count">' + byKind[k].length + ' ' + tr('loadout.shop.items', 'items') + '</span>' +
            '</div>' +
            '<div class="ab-store-grid">' +
                byKind[k].map(function (c) { return cosCard(c, k); }).join('') +
            '</div>';
        }).join('');

        host.innerHTML = featuredHtml + puHtml + cosHtml;

        host.querySelectorAll('button[data-lo-buy]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-lo-buy');
                btn.disabled = true;
                fetchJson('Plugins/AchievementBadges/users/' + userId + '/shop/purchase', 'POST', { ItemId: id })
                    .then(function (r) { loSetStatus((r && r.Message) || 'Purchased.'); loadLoadout(); })
                    .catch(function (e) { loSetStatus((e && e.message) || 'Purchase failed', true); btn.disabled = false; });
            });
        });

        // Featured carousel — arrow + dot navigation. Snap-scroll on the
        // track gives us the per-slide motion for free; we only have to
        // compute the target scrollLeft per dot/arrow press.
        var track = el('abSaFeaturedTrack');
        if (track) {
            var prevBtn = el('abSaFeaturedPrev');
            var nextBtn = el('abSaFeaturedNext');
            var dotsHost = el('abSaFeaturedDots');
            var slideW = function () { return track.clientWidth; };
            var currentIdx = function () { return Math.round(track.scrollLeft / Math.max(1, slideW())); };
            function syncDots() {
                if (!dotsHost) return;
                var i = currentIdx();
                dotsHost.querySelectorAll('.ab-store-carousel-dot').forEach(function (d, idx) {
                    d.classList.toggle('active', idx === i);
                });
            }
            function goTo(idx) {
                var w = slideW();
                var maxIdx = featuredPool.length - 1;
                if (idx < 0) idx = maxIdx;
                if (idx > maxIdx) idx = 0;
                track.scrollTo({ left: idx * w, behavior: 'smooth' });
                setTimeout(syncDots, 350);
            }
            if (prevBtn) prevBtn.addEventListener('click', function () { goTo(currentIdx() - 1); });
            if (nextBtn) nextBtn.addEventListener('click', function () { goTo(currentIdx() + 1); });
            if (dotsHost) {
                dotsHost.querySelectorAll('.ab-store-carousel-dot').forEach(function (d) {
                    d.addEventListener('click', function () { goTo(parseInt(d.getAttribute('data-idx'), 10) || 0); });
                });
            }
            track.addEventListener('scroll', function () {
                // Throttle via rAF so the dot highlight follows manual
                // scroll/swipe without firing on every scroll event.
                if (track._dotRaf) return;
                track._dotRaf = requestAnimationFrame(function () {
                    track._dotRaf = null;
                    syncDots();
                });
            });
        }
    }

    function renderLoadoutCosmetics(catalog, owned, equipped) {
        var host = el('abSaLoCosmeticsBody'); if (!host) return;
        var ownedItems = ((catalog && catalog.Cosmetics) || []).filter(function (c) { return owned[c.Id]; });
        if (!ownedItems.length) {
            host.innerHTML = '<div class="ab-muted" style="padding:1em; border:1px dashed rgba(255,255,255,0.15); border-radius:10px;">You don\'t own any cosmetics yet. Buy or earn one in the Shop tab.</div>';
            return;
        }
        var groups = { ProfileTheme: [], BadgeFrame: [], RankTitle: [], Avatar: [], Background: [], ProfileBorder: [] };
        ownedItems.forEach(function (c) { if (groups[c.Kind]) groups[c.Kind].push(c); });
        var meta = {
            ProfileTheme:  { icon: 'palette',       title: tr('loadout.kind.themes',      'Profile Themes') },
            BadgeFrame:    { icon: 'filter_frames', title: tr('loadout.kind.frames',      'Badge Frames') },
            RankTitle:     { icon: 'military_tech', title: tr('loadout.kind.titles',      'Rank Titles') },
            Avatar:        { icon: 'mood',          title: tr('loadout.kind.avatars',     'Avatars') },
            Background:    { icon: 'animation',     title: tr('loadout.kind.backgrounds', 'Animated Backgrounds') },
            ProfileBorder: { icon: 'border_color',  title: tr('loadout.kind.borders',     'Profile Borders') }
        };

        host.innerHTML = Object.keys(groups).map(function (k) {
            if (!groups[k].length) return '';
            var equippedId = k === 'ProfileTheme'  ? equipped.EquippedThemeId
                          : k === 'BadgeFrame'     ? equipped.EquippedBadgeFrameId
                          : k === 'Avatar'         ? equipped.EquippedAvatarId
                          : k === 'Background'     ? equipped.EquippedBackgroundId
                          : k === 'ProfileBorder'  ? equipped.EquippedProfileBorderId
                          :                          equipped.EquippedCustomTitleId;
            var m = meta[k];
            return '<div class="ab-cos-row-head">' +
                '<span class="material-icons">' + m.icon + '</span>' +
                '<h3>' + m.title + '</h3>' +
                '<span class="ab-store-row-count">' + groups[k].length + ' ' + tr('loadout.shop.owned_count', 'owned') + '</span>' +
            '</div>' +
            '<div class="ab-cos-grid">' +
                groups[k].map(function (c) {
                    var isEq = equippedId === c.Id;
                    var hero, preview;
                    if (k === 'ProfileTheme') {
                        hero = themeSwatchFor(c.Id);
                        preview = '<div style="padding:0.4em 0.95em; background:rgba(0,0,0,0.5); border-radius:4px; font-weight:800; font-size:0.78em; letter-spacing:0.12em; color:#fff;">' + escapeHtml((c.DisplayName || '').toUpperCase()) + '</div>';
                    } else if (k === 'BadgeFrame') {
                        hero = 'linear-gradient(135deg,#0f172a,#1e293b 70%,#0c4a6e)';
                        preview = '<div style="width:70px; height:70px; border-radius:8px; display:flex; align-items:center; justify-content:center; ' + frameSwatchFor(c.Id) + '"><span class="material-icons" style="font-size:1.9em; color:#fde68a; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));">emoji_events</span></div>';
                    } else if (k === 'Avatar') {
                        hero = 'radial-gradient(circle at 50% 45%, rgba(102,192,244,0.25), rgba(15,23,42,1) 70%)';
                        preview = '<div style="font-size:3em; line-height:1; filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));">' + escapeHtml(c.PreviewColor || '★') + '</div>';
                    } else if (k === 'Background') {
                        hero = '#0f172a';
                        preview = '<div class="ab-store-bg-preview ' + (c.Id || '') + '"><span class="material-icons" style="font-size:1.6em; color:rgba(255,255,255,0.45); z-index:2; position:relative;">' + escapeHtml(c.PreviewIcon || 'animation') + '</span></div>';
                    } else if (k === 'ProfileBorder') {
                        hero = 'linear-gradient(135deg,#1e293b,#0f172a)';
                        preview = '<div class="ab-store-border-preview ' + (c.Id || '') + '"><span class="material-icons" style="font-size:1.6em; color:#fcd34d;">' + escapeHtml(c.PreviewIcon || 'border_color') + '</span></div>';
                    } else {
                        hero = 'linear-gradient(135deg,#1e1b4b,#312e81 70%,#0c4a6e)';
                        preview = '<div style="font-family:\'Cinzel\',\'Trajan Pro\',Georgia,serif; font-size:1.25em; font-weight:700; color:#fde68a; letter-spacing:0.06em; text-shadow:0 2px 8px rgba(0,0,0,0.55), 0 0 18px rgba(252,211,77,0.25); text-align:center; padding:0 1em;">' + escapeHtml(trCatName(c.Id, c.DisplayName)) + '</div>';
                    }
                    var action = isEq
                        ? '<button type="button" class="ab-cos-action unequip" data-lo-unequip="' + k + '">' + tr('loadout.cos.unequip', 'UNEQUIP') + '</button>'
                        : '<button type="button" class="ab-cos-action equip" data-lo-equip="' + (c.Id || '') + '">' + tr('loadout.cos.equip', 'EQUIP') + '</button>';
                    return '<div class="ab-cos-card' + (isEq ? ' equipped' : '') + '">' +
                        '<div class="ab-cos-card-hero" style="background:' + hero + ';">' +
                            preview +
                            (isEq ? '<div class="ab-cos-card-equipped-pill">' + tr('loadout.cos.equipped', 'EQUIPPED') + '</div>' : '') +
                        '</div>' +
                        '<div class="ab-cos-card-body">' +
                            '<div class="ab-cos-card-name">' + escapeHtml(trCatName(c.Id, c.DisplayName)) + '</div>' +
                        '</div>' +
                        '<div class="ab-cos-card-foot">' + action + '</div>' +
                    '</div>';
                }).join('') +
            '</div>';
        }).join('');
        host.querySelectorAll('button[data-lo-equip]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                btn.disabled = true;
                fetchJson('Plugins/AchievementBadges/users/' + userId + '/cosmetics/equip', 'POST', { CosmeticId: btn.getAttribute('data-lo-equip') })
                    .then(function (r) {
                        loSetStatus((r && r.Message) || 'Equipped.');
                        if (r) applyEquippedThemeStd(r.EquippedThemeId);
                        loadV2Cosmetics(true).then(function () { reapplyV2Visuals(); });
                        loadLoadout();
                    })
                    .catch(function (e) { loSetStatus((e && e.message) || 'Equip failed', true); btn.disabled = false; });
            });
        });
        host.querySelectorAll('button[data-lo-unequip]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                btn.disabled = true;
                fetchJson('Plugins/AchievementBadges/users/' + userId + '/cosmetics/unequip?kind=' + encodeURIComponent(btn.getAttribute('data-lo-unequip')), 'POST', {})
                    .then(function (r) {
                        loSetStatus((r && r.Message) || 'Unequipped.');
                        applyEquippedThemeStd(null);
                        loadV2Cosmetics(true).then(function () { reapplyV2Visuals(); });
                        loadLoadout();
                    })
                    .catch(function (e) { loSetStatus((e && e.message) || 'Unequip failed', true); btn.disabled = false; });
            });
        });
    }

    function applyThemeForTier(tierName) {
        if (!root) return;
        var themeClass = 'ab-theme-' + (tierName || 'rookie').toLowerCase();
        var classes = root.className.split(/\s+/).filter(function (c) { return c.indexOf('ab-theme-') !== 0; });
        classes.push(themeClass);
        root.className = classes.join(' ');
    }

    var allBadges = [];
    var equippedIdsGlobal = {};
    var pinnedIdsGlobal = {};
    var equippedTitleId = null;
    // v2.0: cosmetic equip state — populated by loadV2Cosmetics(). The frame
    // id (e.g. "frame-gilded") becomes a CSS class on each equipped badge
    // card; the resolved title name overrides the auto rank label.
    var v2EquippedFrameId = '';
    var v2EquippedThemeId = '';
    var v2EquippedTitleName = '';
    var v2EquippedAvatarEmoji = '';
    var v2EquippedBackgroundId = '';
    var v2EquippedBorderId = '';
    var v2CosmeticsCatalogCache = null;
    var badgeEtaMap = {};
    // Server-wide rarity percentages { badgeId: pct }. Populated by loadAll
    // from /badges/rarity-stats so every badge card can show how scarce it
    // is across this server's user base.
    var rarityPctMap = {};
    var publicConfigGlobal = {};
    var publicConfigPromise = null;
    var navigationPreferencesGlobal = {};
    var navigationPreferencesPromise = null;
    var navigationPreferencesUserId = '';
    var nativeNavigationSettingsMountPromise = null;
    var currentSearch = '';
    var currentFilter = 'all';
    var currentCategory = '';
    var currentSort = 'default';
    var currentPrestige = 0;
    var lastHandledAchievementRoute = '';

    var rarityRank = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5, 'mythic': 6 };
    var rarityScore = { 'common': 10, 'uncommon': 20, 'rare': 35, 'epic': 60, 'legendary': 100, 'mythic': 150 };

    function scoreForBadge(b) {
        var base = rarityScore[(b.Rarity || '').toLowerCase()] || 10;
        var multiplier = 1 + 0.5 * (currentPrestige || 0);
        return Math.round(base * multiplier);
    }

    function passesFilter(b) {
        var q = currentSearch.toLowerCase();
        if (q) {
            var hay = [(b.Title || ''), (b.Category || ''), (b.Rarity || ''), (b.Description || '')].join(' ').toLowerCase();
            if (hay.indexOf(q) === -1) return false;
        }
        if (currentCategory && (b.Category || '') !== currentCategory) return false;
        if (currentFilter === 'unlocked') return !!b.Unlocked;
        if (currentFilter === 'recent') return !!b.Unlocked;
        if (currentFilter === 'locked') return !b.Unlocked;
        if (currentFilter === 'close') {
            if (b.Unlocked) return false;
            var tar = b.TargetValue || 0, cur = b.CurrentValue || 0;
            return tar > 0 && (cur / tar) > 0.5;
        }
        if (currentFilter.indexOf('r-') === 0) {
            var want = currentFilter.substring(2);
            return (b.Rarity || '').toLowerCase() === want;
        }
        return true;
    }

    function applySort(arr) {
        var copy = arr.slice();
        switch (currentSort) {
            case 'rarity-desc':
                copy.sort(function (a, b) { return (rarityRank[(b.Rarity || '').toLowerCase()] || 0) - (rarityRank[(a.Rarity || '').toLowerCase()] || 0); });
                break;
            case 'rarity-asc':
                copy.sort(function (a, b) { return (rarityRank[(a.Rarity || '').toLowerCase()] || 0) - (rarityRank[(b.Rarity || '').toLowerCase()] || 0); });
                break;
            case 'progress-desc':
                copy.sort(function (a, b) {
                    var pa = (a.TargetValue || 0) > 0 ? (a.CurrentValue || 0) / a.TargetValue : 0;
                    var pb = (b.TargetValue || 0) > 0 ? (b.CurrentValue || 0) / b.TargetValue : 0;
                    return pb - pa;
                });
                break;
            case 'progress-asc':
                copy.sort(function (a, b) {
                    var pa = (a.TargetValue || 0) > 0 ? (a.CurrentValue || 0) / a.TargetValue : 0;
                    var pb = (b.TargetValue || 0) > 0 ? (b.CurrentValue || 0) / b.TargetValue : 0;
                    return pa - pb;
                });
                break;
            case 'title-asc':
                copy.sort(function (a, b) { return (a.Title || '').localeCompare(b.Title || ''); });
                break;
        }
        // Stable secondary sort: pinned badges always float to the top
        copy.sort(function (a, b) {
            var pa = pinnedIdsGlobal[a.Id] ? 0 : 1;
            var pb = pinnedIdsGlobal[b.Id] ? 0 : 1;
            return pa - pb;
        });
        return copy;
    }

    function applyFilter() {
        var filtered = allBadges.filter(passesFilter);
        var sorted;
        if (currentFilter === 'recent') {
            // Sort by UnlockedAt descending (most recent first) and limit to top 10.
            // This overrides any other sort selection because "recent" is intrinsically time-ordered.
            sorted = filtered.slice().sort(function (a, b) {
                var ta = a.UnlockedAt ? new Date(a.UnlockedAt).getTime() : 0;
                var tb = b.UnlockedAt ? new Date(b.UnlockedAt).getTime() : 0;
                return tb - ta;
            }).slice(0, 10);
            // Still keep pinned badges on top (stable secondary sort, matches applySort behavior)
            sorted.sort(function (a, b) {
                var pa = pinnedIdsGlobal[a.Id] ? 0 : 1;
                var pb = pinnedIdsGlobal[b.Id] ? 0 : 1;
                return pa - pb;
            });
        } else {
            sorted = applySort(filtered);
        }
        renderBadges(sorted, equippedIdsGlobal);
        var empty = el('abSaEmptyFilter');
        if (empty) empty.style.display = (sorted.length === 0 && allBadges.length > 0) ? 'block' : 'none';
    }

    function readAchievementRouteTarget() {
        var hash = window.location.hash || '';
        var queryAt = hash.indexOf('?');
        if (queryAt < 0) return null;
        try {
            var params = new URLSearchParams(hash.substring(queryAt + 1));
            var badgeId = params.get('badge');
            if (badgeId) return { type: 'badge', badgeId: badgeId, routeKey: hash };
            if (params.get('filter') === 'recent') return { type: 'recent', routeKey: hash };
        } catch (e) { }
        return null;
    }

    function resetBadgeRouteControls(filterValue) {
        currentSearch = '';
        currentCategory = '';
        currentFilter = filterValue || 'all';
        currentSort = 'default';
        var search = el('abSaSearch'); if (search) search.value = '';
        var category = el('abSaCategoryFilter'); if (category) category.value = '';
        var filter = el('abSaFilter'); if (filter) filter.value = currentFilter;
        var sort = el('abSaSort'); if (sort) sort.value = 'default';
    }

    function findRenderedBadgeCard(badgeId) {
        var cards = document.querySelectorAll('#abSaGrid .ab-card[data-badge-id]');
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].getAttribute('data-badge-id') === badgeId) return cards[i];
        }
        return null;
    }

    function prefersReducedMotion() {
        try {
            if (localStorage.getItem('ab-reduced-motion') === 'true') return true;
            return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch (e) { return false; }
    }

    function focusAchievementCard(card) {
        if (!card) return;
        var previous = document.querySelector('#abSaGrid .ab-toast-focus');
        if (previous && previous !== card) previous.classList.remove('ab-toast-focus');
        card.classList.add('ab-toast-focus');
        card.setAttribute('tabindex', '-1');
        try {
            card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
            card.focus({ preventScroll: true });
        } catch (e) {
            try { card.scrollIntoView(); card.focus(); } catch (ignored) { }
        }
        setTimeout(function () {
            card.classList.remove('ab-toast-focus');
            card.removeAttribute('tabindex');
        }, 6000);
    }

    function applyAchievementRouteTarget() {
        var target = readAchievementRouteTarget();
        if (!target || target.routeKey === lastHandledAchievementRoute) return false;
        if (!root || !allBadges.length) return false;
        lastHandledAchievementRoute = target.routeKey;
        setTab('badges');

        if (target.type === 'recent') {
            resetBadgeRouteControls('recent');
            applyFilter();
            var grid = el('abSaGrid');
            if (grid) {
                try { grid.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }); }
                catch (e) { try { grid.scrollIntoView(); } catch (ignored) { } }
            }
            return true;
        }

        resetBadgeRouteControls('all');
        applyFilter();
        var card = findRenderedBadgeCard(target.badgeId);
        if (card) {
            focusAchievementCard(card);
            return true;
        }

        // A stale client cache should still land somewhere useful rather than
        // on an empty target: show the user's latest unlocks as a fallback.
        resetBadgeRouteControls('recent');
        applyFilter();
        return true;
    }

    function loadRecap(period) {
        if (!userId) return;
        var box = el('abSaRecap'); if (box) box.innerHTML = tr('recap.loading', 'Loading recap...');
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/recap?period=' + period).then(function (r) {
            if (!box) return;

            // Render a top-N list as a bar chart
            var barList = function (items, title, emoji) {
                if (!items || !items.length) return '';
                var max = Math.max.apply(null, items.map(function (x) { return x.Count; }));
                if (max === 0) max = 1;
                return '<div class="ab-recap-section">' +
                    '<div class="ab-recap-section-title"><span>' + emoji + '</span>' + title + '</div>' +
                    items.map(function (x, i) {
                        var pct = Math.round(100 * x.Count / max);
                        return '<div class="ab-recap-bar-row">' +
                            '<div class="ab-recap-bar-name">' + escapeHtml(x.Name) + '</div>' +
                            '<div class="ab-recap-bar-track"><div class="ab-recap-bar-fill" style="width:' + pct + '%;"></div></div>' +
                            '<div class="ab-recap-bar-val">' + x.Count + '</div>' +
                        '</div>';
                    }).join('') +
                '</div>';
            };

            box.innerHTML =
                '<div class="ab-recap-hero">' +
                    '<div class="ab-recap-big">' +
                        '<div class="ab-recap-big-num">' + (r.TotalItems || 0) + '</div>' +
                        '<div class="ab-recap-big-label">' + tr('recap.total_items_watched', 'Total items watched') + '</div>' +
                    '</div>' +
                    '<div class="ab-recap-mini-grid">' +
                        '<div class="ab-recap-mini"><div class="ab-recap-mini-icon">🎬</div><div class="ab-recap-mini-num">' + (r.MoviesWatched || 0) + '</div><div class="ab-recap-mini-label">' + tr('recap.movies', 'Movies') + '</div></div>' +
                        '<div class="ab-recap-mini"><div class="ab-recap-mini-icon">📺</div><div class="ab-recap-mini-num">' + (r.EpisodesWatched || 0) + '</div><div class="ab-recap-mini-label">' + tr('recap.episodes', 'Episodes') + '</div></div>' +
                        '<div class="ab-recap-mini"><div class="ab-recap-mini-icon">📅</div><div class="ab-recap-mini-num">' + (r.DaysWatched || 0) + '</div><div class="ab-recap-mini-label">' + tr('recap.active_days', 'Active days') + '</div></div>' +
                        '<div class="ab-recap-mini"><div class="ab-recap-mini-icon">🏆</div><div class="ab-recap-mini-num">' + (r.BadgesUnlocked || 0) + '</div><div class="ab-recap-mini-label">' + tr('recap.unlocks', 'Unlocks') + '</div></div>' +
                    '</div>' +
                '</div>' +
                '<div class="ab-recap-grid">' +
                    barList(r.TopGenres, tr('recap.top_genres', 'Top genres'), '🎭') +
                    barList(r.TopDirectors, tr('recap.top_directors', 'Top directors'), '🎬') +
                    barList(r.TopActors, tr('recap.top_actors', 'Top actors'), '⭐') +
                '</div>';
        }).catch(function () {
            if (box) box.innerHTML = '<div class="ab-muted">' + tr('recap.load_failed', 'Failed to load recap.') + '</div>';
        });
    }

    var serverUsers = null;

    function fetchServerUsers() {
        if (serverUsers) return Promise.resolve(serverUsers);
        return fetch(buildUrl('Users'), { headers: getAuthHeaders(), credentials: 'include' })
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (list) {
                serverUsers = (list || []).map(function (u) { return { Id: (u.Id || '').toString(), Name: u.Name || u.Id }; });
                return serverUsers;
            })
            .catch(function () { return []; });
    }


    function loadCompareUserList() {
        fetchServerUsers().then(function (users) {
            var a = el('abSaCompareUserA');
            var b = el('abSaCompareUserB');
            if (!a || !b) return;
            if (a.options.length === 0) {
                users.forEach(function (u) {
                    var oA = document.createElement('option'); oA.value = u.Id; oA.textContent = u.Name; a.appendChild(oA);
                    var oB = document.createElement('option'); oB.value = u.Id; oB.textContent = u.Name; b.appendChild(oB);
                });
                if (users.length >= 2) { a.value = userId; b.value = users.find(function (u) { return u.Id !== userId; }).Id; }
                a.addEventListener('change', loadCompareData);
                b.addEventListener('change', loadCompareData);
                loadCompareData();
            }
            // Always refresh history
            loadCompareHistory();
        });
    }

    function loadCompareHistory() {
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/compare-history').then(function (history) {
            var wrap = el('abSaCompareHistoryWrap');
            var box = el('abSaCompareHistory');
            if (!wrap || !box) return;
            if (!history || !history.length) { wrap.style.display = 'none'; return; }
            wrap.style.display = 'block';
            box.innerHTML = history.map(function (h) {
                var when = h.At ? new Date(h.At).toLocaleDateString() : '';
                return '<button type="button" class="ab-cmp-history-pill" data-other="' + h.OtherUserId + '">' +
                    '<strong>' + escapeHtml(h.OtherUserName) + '</strong>' +
                    '<span class="ab-muted" style="font-size:0.75em; margin-left:0.4em;">' + when + '</span>' +
                '</button>';
            }).join('');
            box.querySelectorAll('.ab-cmp-history-pill').forEach(function (pill) {
                pill.addEventListener('click', function () {
                    var b = el('abSaCompareUserB');
                    if (b) { b.value = pill.getAttribute('data-other'); loadCompareData(); }
                });
            });
        }).catch(function () { });
    }

    function loadCompareData() {
        var a = el('abSaCompareUserA'), b = el('abSaCompareUserB');
        var resultBox = el('abSaCompareResult');
        if (!a || !b || !resultBox) return;
        if (!a.value || !b.value || a.value === b.value) {
            resultBox.innerHTML = '<div class="ab-muted">' + tr('compare.pick_two_diff', 'Pick two different users.') + '</div>';
            return;
        }
        resultBox.innerHTML = tr('common.loading', 'Loading...');
        Promise.all([
            fetchJson('Plugins/AchievementBadges/compare/' + a.value + '/' + b.value),
            fetchJson('Plugins/AchievementBadges/profiles/' + a.value + '/equipped').catch(function () { return []; }),
            fetchJson('Plugins/AchievementBadges/profiles/' + b.value + '/equipped').catch(function () { return []; })
        ]).then(function (results) {
            var cmp = results[0], equippedA = results[1] || [], equippedB = results[2] || [];
            if (!cmp || cmp.Error) { resultBox.innerHTML = '<div class="ab-muted">' + (cmp && cmp.Error || tr('lb.no_data', 'No data.')) + '</div>'; return; }
            var rows = [
                [tr('compare.metric_score', 'SCORE'), tr('lb.score', 'Score'), cmp.UserA.Score, cmp.UserB.Score],
                [tr('compare.metric_badges', 'BADGES'), tr('admin.my_badges', 'My Badges'), cmp.UserA.Unlocked + ' / ' + cmp.UserA.Total, cmp.UserB.Unlocked + ' / ' + cmp.UserB.Total],
                [tr('compare.metric_prestige', 'PRESTIGE'), tr('achievements.prestige', 'Prestige'), cmp.UserA.PrestigeLevel, cmp.UserB.PrestigeLevel],
                [tr('compare.metric_score', 'ITEMS'), tr('compare.metric_items_watched', 'Items watched'), cmp.UserA.TotalItemsWatched, cmp.UserB.TotalItemsWatched],
                [tr('compare.metric_movies', 'MOVIES'), tr('recap.movies', 'Movies'), cmp.UserA.MoviesWatched, cmp.UserB.MoviesWatched],
                [tr('lb.series', 'Series'), tr('compare.metric_series_finished', 'Series finished'), cmp.UserA.SeriesCompleted, cmp.UserB.SeriesCompleted],
                [tr('achievements.streak', 'Streak'), tr('compare.metric_best_streak', 'Best streak'), cmp.UserA.BestWatchStreak, cmp.UserB.BestWatchStreak],
                [tr('compare.metric_hours', 'HOURS'), tr('compare.metric_total_hours', 'Total hours'), Math.round(cmp.UserA.TotalMinutesWatched / 60), Math.round(cmp.UserB.TotalMinutesWatched / 60)],
                [tr('stats.records.late_nights', 'Late nights'), tr('compare.metric_late_nights', 'Late nights'), cmp.UserA.LateNightSessions, cmp.UserB.LateNightSessions],
                [tr('stats.records.weekends', 'Weekends'), tr('compare.metric_weekend_sessions', 'Weekend sessions'), cmp.UserA.WeekendSessions, cmp.UserB.WeekendSessions],
                [tr('stats.records.genres', 'Genres'), tr('compare.metric_unique_genres', 'Unique genres'), cmp.UserA.UniqueGenresWatched, cmp.UserB.UniqueGenresWatched],
                [tr('stats.records.libraries', 'Libraries'), tr('compare.metric_libraries_visited', 'Libraries visited'), cmp.UserA.UniqueLibrariesVisited, cmp.UserB.UniqueLibrariesVisited]
            ];
            resultBox.innerHTML =
                '<div class="ab-cmp-header">' +
                    '<div class="ab-cmp-user"><div class="ab-cmp-name">' + escapeHtml(cmp.UserA.UserName) + '</div>' +
                        '<div style="display:flex;justify-content:center;margin-top:0.4em;">' + renderEquippedDots(equippedA, 22) + '</div>' +
                    '</div>' +
                    '<div class="ab-cmp-vs">' + tr('compare.vs', 'VS') + '</div>' +
                    '<div class="ab-cmp-user"><div class="ab-cmp-name">' + escapeHtml(cmp.UserB.UserName) + '</div>' +
                        '<div style="display:flex;justify-content:center;margin-top:0.4em;">' + renderEquippedDots(equippedB, 22) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ab-cmp-rows">' +
                    rows.map(function (r) {
                        var aVal = parseFloat(r[2]) || 0;
                        var bVal = parseFloat(r[3]) || 0;
                        var max = Math.max(aVal, bVal, 1);
                        var aPct = Math.round(100 * aVal / max);
                        var bPct = Math.round(100 * bVal / max);
                        var winnerA = aVal > bVal;
                        var winnerB = bVal > aVal;
                        return '<div class="ab-cmp-row">' +
                            '<div class="ab-cmp-val ab-cmp-val-l ' + (winnerA ? 'ab-cmp-winner' : '') + '">' + r[2] + '</div>' +
                            '<div class="ab-cmp-bar"><div class="ab-cmp-fill ab-cmp-fill-left" style="width:' + aPct + '%;"></div></div>' +
                            '<div class="ab-cmp-label">' + r[1] + '</div>' +
                            '<div class="ab-cmp-bar"><div class="ab-cmp-fill ab-cmp-fill-right" style="width:' + bPct + '%;"></div></div>' +
                            '<div class="ab-cmp-val ab-cmp-val-r ' + (winnerB ? 'ab-cmp-winner' : '') + '">' + r[3] + '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' +
                '<div class="ab-cmp-summary">' +
                    '<div class="ab-cmp-pill"><strong>' + cmp.OnlyA + '</strong> ' + tr('compare.only_has_a', 'badges only {name} has').replace('{name}', escapeHtml(cmp.UserA.UserName)) + '</div>' +
                    '<div class="ab-cmp-pill"><strong>' + cmp.Both + '</strong> ' + tr('compare.shared_badges', 'shared badges') + '</div>' +
                    '<div class="ab-cmp-pill"><strong>' + cmp.OnlyB + '</strong> ' + tr('compare.only_has_b', 'badges only {name} has').replace('{name}', escapeHtml(cmp.UserB.UserName)) + '</div>' +
                '</div>';
        }).catch(function () {
            resultBox.innerHTML = '<div class="ab-muted">' + tr('compare.load_failed', 'Failed to load comparison.') + '</div>';
        });
    }

    var activityPage = 1;
    var activityFilter = '';

    function ensureActivityFilterPopulated() {
        var sel = el('abSaActivityUserFilter');
        if (!sel || sel.options.length > 0) return Promise.resolve();
        return fetchServerUsers().then(function (users) {
            sel.innerHTML = '<option value="">' + tr('activity.filter_all', 'All users') + '</option>' +
                users.map(function (u) { return '<option value="' + u.Id + '">' + escapeHtml(u.Name) + '</option>'; }).join('');
            sel.addEventListener('change', function () {
                activityFilter = sel.value || '';
                activityPage = 1;
                loadActivity();
            });
        });
    }

    function loadActivity() {
        var box = el('abSaActivity');
        if (!box) return;
        box.innerHTML = tr('common.loading', 'Loading...');
        // When admin force-privacy is on, always scope to the current user.
        var pc = publicConfigGlobal || {};
        var forcePrivacy = !!(pc.ForcePrivacyMode || pc.forcePrivacyMode);
        if (forcePrivacy && userId) {
            activityFilter = userId;
        }
        ensureActivityFilterPopulated().then(function () {
            var qs = '?page=' + activityPage + '&pageSize=20';
            if (activityFilter) qs += '&userId=' + encodeURIComponent(activityFilter);
            return fetchJson('Plugins/AchievementBadges/activity-feed' + qs);
        }).then(function (res) {
            if (!res || !res.Entries || !res.Entries.length) { box.innerHTML = '<div class="ab-muted">' + tr('activity.no_activity_yet', 'No activity yet.') + '</div>'; renderActivityPager(0, 0); return; }
            box.innerHTML = res.Entries.map(function (e) {
                var when = e.At ? new Date(e.At).toLocaleString() : '';
                var rarityCls = rarityClass(e.Rarity);
                return '<div class="ab-feed-row">' +
                    '<div class="ab-feed-icon ' + rarityCls + '">' + icon(e.Icon) + '</div>' +
                    '<div class="ab-feed-body">' +
                        '<div class="ab-feed-text"><strong>' + escapeHtml(e.UserName) + '</strong> ' + tr('activity.unlocked_verb', 'unlocked') + ' <strong>' + escapeHtml(e.Title) + '</strong></div>' +
                        '<div class="ab-feed-meta"><span class="' + rarityCls + '">' + escapeHtml(trRarity(e.Rarity)) + '</span> · ' + escapeHtml(trCategory(e.Category || '')) + ' · ' + when + '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
            renderActivityPager(res.Page || 1, res.TotalPages || 1);
        }).catch(function () {
            box.innerHTML = '<div class="ab-muted">' + tr('activity.load_failed', 'Failed to load activity.') + '</div>';
        });
    }

    function renderActivityPager(page, totalPages) {
        var p = el('abSaActivityPager');
        if (!p) return;
        if (totalPages <= 1) { p.innerHTML = ''; return; }
        var btn = function (label, target, disabled) {
            return '<button type="button" class="ab-pager-btn" data-page="' + target + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>';
        };
        p.innerHTML = btn('\u2039', Math.max(1, page - 1), page <= 1) +
            '<span class="ab-pager-info">' + tr('activity.page_label', 'Page') + ' ' + page + ' / ' + totalPages + '</span>' +
            btn('\u203a', Math.min(totalPages, page + 1), page >= totalPages);
        var btns = p.querySelectorAll('.ab-pager-btn');
        btns.forEach(function (b) {
            b.addEventListener('click', function () {
                if (b.disabled) return;
                activityPage = parseInt(b.getAttribute('data-page'), 10);
                loadActivity();
            });
        });
    }

    var currentHeatmapDays = 90;

    function loadStats() {
        if (!userId) return;
        Promise.all([
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/bank'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/summary'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/recap?period=year'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/watch-calendar?days=' + currentHeatmapDays),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/records'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/category-progress'),
            fetchJson('Plugins/AchievementBadges/leaderboard-prestige?limit=10'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/watch-clock'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/streak-calendar?weeks=53'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/preferences').catch(function () { return null; })
        ]).then(function (r) {
            var bank = r[0], summary = r[1], recap = r[2], calendar = r[3];
            var records = r[4], categoryProgress = r[5], prestigeLb = r[6], clock = r[7], streakCal = r[8], prefs = r[9];
            renderPreferences(prefs);

            // Apply user page theme preference
            var pageTheme = prefs && (prefs.achievementPageTheme || prefs.AchievementPageTheme) || 'default';
            applyPageTheme(pageTheme);

            renderCategoryRings(categoryProgress);
            renderRecords(records);
            renderPrestigeLeaderboard(prestigeLb);
            var bankBox = el('abSaBank');
            if (bankBox) {
                var prestigeStars = '';
                for (var i = 0; i < (bank.PrestigeLevel || 0); i++) { prestigeStars += '\u2b50'; }
                currentPrestige = bank.PrestigeLevel || 0;
                var canPrestige = (summary && summary.Score >= 12000);
                var nextMultiplier = 1 + 0.5 * ((bank.PrestigeLevel || 0) + 1);
                bankBox.innerHTML =
                    '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.75em;">' +
                        '<div class="ab-stat"><div class="ab-stat-t">' + tr('stats.score_bank_label', 'Score bank') + '</div><div class="ab-stat-v">' + (bank.ScoreBank || 0) + '</div></div>' +
                        '<div class="ab-stat"><div class="ab-stat-t">' + tr('stats.lifetime_score', 'Lifetime score') + '</div><div class="ab-stat-v">' + (bank.LifetimeScore || 0) + '</div></div>' +
                        '<div class="ab-stat"><div class="ab-stat-t">' + tr('achievements.prestige', 'Prestige') + '</div><div class="ab-stat-v">' + (bank.PrestigeLevel || 0) + ' ' + prestigeStars + '</div></div>' +
                        '<div class="ab-stat"><div class="ab-stat-t">' + tr('stats.best_combo', 'Best combo') + '</div><div class="ab-stat-v">' + (bank.BestComboCount || 0) + '</div></div>' +
                    '</div>' +
                    '<div style="margin-top:1.25em; text-align:center;">' +
                        '<button type="button" class="ab-prestige-btn" id="abSaPrestigeBtn"' + (canPrestige ? '' : ' disabled') + '>' +
                            '\u2b50 ' + tr('stats.prestige_btn', 'Prestige') + ' \u2b50' +
                        '</button>' +
                        '<div class="ab-muted" style="font-size:0.8em; margin-top:0.5em;">' +
                            (canPrestige
                                ? tr('stats.prestige_explain', 'Reset to earn prestige') + ' \u2b50 ' + ((bank.PrestigeLevel || 0) + 1) + ' ' + tr('stats.prestige_explain_suffix', 'and unlock a {mult}x badge score multiplier').replace('{mult}', nextMultiplier.toFixed(1))
                                : tr('stats.reach_legend', 'Reach 12000 score (Legend rank) to prestige. Currently') + ' ' + (summary.Score || 0) + ' / 12000') +
                        '</div>' +
                    '</div>';
                var pb = el('abSaPrestigeBtn');
                if (pb) pb.addEventListener('click', function () {
                    if (!confirm(tr('stats.confirm_prestige', 'Prestige resets your badges and counters but grants a permanent score multiplier and a prestige star. Continue?'))) return;
                    fetchJson('Plugins/AchievementBadges/users/' + userId + '/prestige', 'POST').then(function (res) {
                        alert(res.Success ? (tr('achievements.prestige', 'Prestige') + ' ' + tr('lb.rank', 'Rank') + ' ' + res.PrestigeLevel + '! ' + tr('stats.prestige_explain_suffix', 'and unlock a {mult}x badge score multiplier').replace('{mult}', (1 + 0.5 * res.PrestigeLevel).toFixed(1))) : res.Message);
                        loadAll(); loadStats();
                    });
                });
            }

            renderCharts(recap, summary, calendar, clock, streakCal);
        }).catch(function () { });
    }

    function renderCategoryRings(items) {
        var box = el('abSaCategoryRings');
        if (!box) return;
        if (!items || !items.length) { box.innerHTML = ''; return; }
        box.innerHTML = items.map(function (it) {
            var pct = it.Percent || 0;
            var circ = 2 * Math.PI * 28;
            var dash = circ * pct / 100;
            var color = pct >= 100 ? '#4caf50' : pct >= 50 ? '#667eea' : '#9aa5b1';
            return '<div class="ab-cat-ring">' +
                '<svg width="72" height="72" viewBox="0 0 72 72">' +
                    '<circle cx="36" cy="36" r="28" stroke="rgba(255,255,255,0.08)" stroke-width="6" fill="none"/>' +
                    '<circle cx="36" cy="36" r="28" stroke="' + color + '" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="' + dash + ' ' + circ + '" transform="rotate(-90 36 36)"/>' +
                    '<text x="36" y="40" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">' + pct + '%</text>' +
                '</svg>' +
                '<div class="ab-cat-ring-label">' + escapeHtml(trCategory(it.Category)) + '</div>' +
                '<div class="ab-cat-ring-sub">' + it.Unlocked + '/' + it.Total + '</div>' +
            '</div>';
        }).join('');
    }

    function renderRecords(records) {
        var box = el('abSaRecords');
        if (!box) return;
        if (!records) { box.innerHTML = '<div class="ab-muted">' + tr('stats.no_records', 'No records.') + '</div>'; return; }
        var fields = [
            ['🎬', tr('stats.records.movies', 'Movies'), records.MoviesWatched],
            ['📺', tr('stats.records.total_items', 'Total items'), records.TotalItemsWatched],
            ['🏆', tr('stats.records.series_complete', 'Series complete'), records.SeriesCompleted],
            ['🔥', tr('stats.records.best_streak', 'Best streak'), records.BestWatchStreak + ' ' + tr('stats.records.days_suffix', 'days')],
            ['⏱️', tr('stats.records.total_time', 'Total time'), records.TotalHoursWatched + ' ' + tr('stats.records.hours_suffix', 'hours')],
            ['📅', tr('stats.records.days_watched', 'Days watched'), records.DaysWatched],
            ['🎭', tr('stats.records.genres', 'Genres'), records.UniqueGenresWatched],
            ['🌍', tr('stats.records.countries', 'Countries'), records.UniqueCountriesWatched],
            ['🗣️', tr('stats.records.languages', 'Languages'), records.UniqueLanguagesWatched],
            ['📚', tr('stats.records.libraries', 'Libraries'), records.UniqueLibrariesVisited],
            ['🌙', tr('stats.records.late_nights', 'Late nights'), records.LateNightSessions],
            ['🌅', tr('stats.records.early_mornings', 'Early mornings'), records.EarlyMorningSessions],
            ['📆', tr('stats.records.weekends', 'Weekends'), records.WeekendSessions],
            ['⚡', tr('stats.records.best_combo', 'Best combo'), records.BestComboCount],
            ['🔁', tr('stats.records.rewatches', 'Rewatches'), records.RewatchCount],
            ['🎯', tr('stats.records.login_streak', 'Login streak'), records.BestLoginStreak]
        ];
        box.innerHTML = '<div class="ab-records-grid">' + fields.map(function (f) {
            return '<div class="ab-record"><div class="ab-record-icon">' + f[0] + '</div><div class="ab-record-val">' + f[2] + '</div><div class="ab-record-label">' + f[1] + '</div></div>';
        }).join('') + '</div>';
    }

    function renderPrestigeLeaderboard(list) {
        var box = el('abSaPrestigeLb');
        if (!box) return;
        if (!list || !list.length) { box.innerHTML = '<div class="ab-muted">' + tr('stats.no_one_prestiged', 'No one has prestiged yet. Be the first!') + '</div>'; return; }
        box.innerHTML = list.map(function (e, i) {
            var stars = '';
            for (var s = 0; s < e.PrestigeLevel; s++) stars += '\u2b50';
            return '<div class="ab-lb-row-new">' +
                '<div class="ab-lb-rank">#' + (i + 1) + '</div>' +
                '<div class="ab-lb-info">' +
                    '<div class="ab-lb-name">' + escapeHtml(e.UserName) + ' ' + stars + '</div>' +
                    '<div class="ab-muted" style="font-size:0.78em;">' + tr('stats.lifetime_score', 'Lifetime score') + ' ' + (e.LifetimeScore || 0) + '</div>' +
                '</div>' +
                '<div class="ab-lb-value">P' + e.PrestigeLevel + '</div>' +
            '</div>';
        }).join('');
    }

    function renderRecentUnlocks(list) {
        var box = el('abSaRecentUnlocks');
        if (!box) return;
        if (!list || !list.length) { box.innerHTML = '<div class="ab-muted">' + tr('stats.no_unlocks_yet', 'No unlocks yet.') + '</div>'; return; }
        box.innerHTML = list.map(function (b) {
            var when = b.UnlockedAt ? new Date(b.UnlockedAt).toLocaleString() : '';
            return '<div class="ab-feed-row">' +
                '<div class="ab-feed-icon ' + rarityClass(b.Rarity) + '">' + icon(b.Icon) + '</div>' +
                '<div class="ab-feed-body">' +
                    '<div class="ab-feed-text"><strong>' + escapeHtml(b.Title) + '</strong></div>' +
                    '<div class="ab-feed-meta"><span class="' + rarityClass(b.Rarity) + '">' + b.Rarity + '</span> · ' + when + '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    function renderStreakCalendar(data) {
        if (!data || !data.Days || !data.Days.length) return '<div class="ab-muted">' + tr('stats.no_data', 'No data.') + '</div>';
        var days = data.Days;
        var watchedCount = data.ActiveDays || days.filter(function (d) { return d.W; }).length;
        var current = data.CurrentStreak || 0;
        var best = data.BestStreak || 0;

        // Map server rows ({D: "YYYY-MM-DD", W: bool}) to {date, key, watched}
        // so we can share the month-label builder with the heatmap.
        var cells = days.map(function (d) {
            var dt = new Date(d.D + 'T00:00:00');
            return { date: dt, key: d.D, watched: !!d.W };
        });
        var firstDow = cells[0].date.getDay();
        var leading = (firstDow + 6) % 7; // Monday = 0

        var leadingHtml = '';
        for (var pi = 0; pi < leading; pi++) {
            leadingHtml += '<div class="ab-streak-cell" style="background:transparent;visibility:hidden;"></div>';
        }
        var cellsHtml = leadingHtml + cells.map(function (c) {
            var cls = c.watched ? 'ab-streak-cell ab-streak-cell-on' : 'ab-streak-cell';
            return '<div class="' + cls + '" title="' + c.key + (c.watched ? ' · ' + tr('streak.watched', 'watched') : '') + '"></div>';
        }).join('');

        var streakHeader =
            '<div class="ab-streak-header">' +
                '<div class="ab-streak-flame">' +
                    '<span class="ab-streak-fire">\ud83d\udd25</span>' +
                    '<div>' +
                        '<div class="ab-streak-num">' + current + '</div>' +
                        '<div class="ab-streak-label">' + tr('stats.streak.day_streak', 'day streak') + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ab-streak-stat">' +
                    '<div class="ab-streak-num">' + best + '</div>' +
                    '<div class="ab-streak-label">' + tr('stats.streak.best_ever', 'best ever') + '</div>' +
                '</div>' +
                '<div class="ab-streak-stat">' +
                    '<div class="ab-streak-num">' + watchedCount + '</div>' +
                    '<div class="ab-streak-label">' + tr('stats.streak.active', 'active') + ' / ' + days.length + '</div>' +
                '</div>' +
            '</div>';

        // Desktop: inline grid-template-columns for full-width stretching.
        // Mobile CSS overrides with fixed-size cells.
        var desktopCols = Math.ceil((leading + cells.length) / 7);
        return streakHeader +
            '<div class="ab-cal-wrap">' +
                '<div class="ab-cal-grid">' +
                    renderDayLabels() +
                    '<div>' +
                        renderMonthLabels(cells, leading) +
                        '<div class="ab-streak-grid" style="grid-template-columns:repeat(' + desktopCols + ',1fr);">' + cellsHtml + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="ab-muted" style="font-size:0.75em; margin-top:0.5em;">' + tr('stats.streak.each_cell', 'Each cell is one day in the past year') + '</div>';
    }

    function renderWatchClock(clock) {
        if (!clock) return '<div class="ab-muted">' + tr('stats.no_data', 'No data.') + '</div>';
        var max = 0;
        for (var k in clock) { if (clock[k] > max) max = clock[k]; }
        if (max === 0) max = 1;
        var cx = 90, cy = 90, rOuter = 80, rInner = 30;
        var slices = '';
        var labels = '';
        for (var h = 0; h < 24; h++) {
            var startAngle = (h * 15 - 90) * Math.PI / 180;
            var endAngle = ((h + 1) * 15 - 90) * Math.PI / 180;
            var intensity = (clock[h] || 0) / max;
            var rEdge = rInner + (rOuter - rInner) * Math.max(0.1, intensity);
            var color = 'hsl(' + (220 + intensity * 60) + ', 70%, ' + (35 + intensity * 35) + '%)';
            var x1 = cx + rInner * Math.cos(startAngle);
            var y1 = cy + rInner * Math.sin(startAngle);
            var x2 = cx + rEdge * Math.cos(startAngle);
            var y2 = cy + rEdge * Math.sin(startAngle);
            var x3 = cx + rEdge * Math.cos(endAngle);
            var y3 = cy + rEdge * Math.sin(endAngle);
            var x4 = cx + rInner * Math.cos(endAngle);
            var y4 = cy + rInner * Math.sin(endAngle);
            slices += '<path d="M' + x1 + ',' + y1 + ' L' + x2 + ',' + y2 + ' A' + rEdge + ',' + rEdge + ' 0 0 1 ' + x3 + ',' + y3 + ' L' + x4 + ',' + y4 + ' A' + rInner + ',' + rInner + ' 0 0 0 ' + x1 + ',' + y1 + ' Z" fill="' + color + '"><title>' + h + ':00 — ' + (clock[h] || 0) + ' ' + tr('common.items', 'items') + '</title></path>';
            if (h % 6 === 0) {
                var labelAngle = ((h + 0.5) * 15 - 90) * Math.PI / 180;
                var lx = cx + (rOuter + 12) * Math.cos(labelAngle);
                var ly = cy + (rOuter + 12) * Math.sin(labelAngle) + 4;
                labels += '<text x="' + lx + '" y="' + ly + '" fill="#bbb" font-size="11" text-anchor="middle">' + h + 'h</text>';
            }
        }
        return '<svg viewBox="0 0 200 200" width="100%" height="200">' + slices + labels + '</svg>';
    }

    function renderCharts(recap, summary, calendar, clock, streakCal) {
        var box = el('abSaCharts'); if (!box) return;

        // Genre radar (SVG)
        var genres = (recap && recap.TopGenres) || [];
        var radarSvg = '';
        if (genres.length >= 3) {
            var max = Math.max.apply(null, genres.map(function (g) { return g.Count; }));
            var cx = 120, cy = 120, r = 90;
            var points = genres.map(function (g, i) {
                var angle = (Math.PI * 2 * i / genres.length) - Math.PI / 2;
                var pr = r * (g.Count / max);
                return (cx + Math.cos(angle) * pr) + ',' + (cy + Math.sin(angle) * pr);
            }).join(' ');
            var gridCircles = [0.33, 0.66, 1].map(function (s) {
                return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * s) + '" fill="none" stroke="rgba(255,255,255,0.1)" />';
            }).join('');
            var labels = genres.map(function (g, i) {
                var angle = (Math.PI * 2 * i / genres.length) - Math.PI / 2;
                var lx = cx + Math.cos(angle) * (r + 15);
                var ly = cy + Math.sin(angle) * (r + 15) + 4;
                return '<text x="' + lx + '" y="' + ly + '" fill="#ccc" font-size="11" text-anchor="middle">' + escapeHtml(g.Name) + '</text>';
            }).join('');
            radarSvg = '<svg viewBox="0 0 240 240" width="100%" height="240">' +
                gridCircles +
                '<polygon points="' + points + '" fill="rgba(102,126,234,0.35)" stroke="#667eea" stroke-width="2"/>' +
                labels +
                '</svg>';
        } else {
            radarSvg = '<div class="ab-muted">' + tr('stats.no_data_genres', 'Not enough genre data yet.') + '</div>';
        }

        // Watch heatmap (last 90 days)
        var heatSvg = renderHeatmap(calendar);

        // Duration histogram
        var histSvg = renderHistogram(summary);

        var heatHeader =
            '<div style="display:flex; justify-content:space-between; align-items:center; margin:0 0 0.5em;">' +
                '<h4 style="margin:0;">' + tr('stats.watch_heatmap', 'Watch heatmap') + '</h4>' +
                '<select id="abSaHeatmapRange" class="ab-select" style="padding:0.3em 0.6em; font-size:0.8em;">' +
                    '<option value="30"' + (currentHeatmapDays === 30 ? ' selected' : '') + '>' + tr('stats.heatmap.30', '30 days') + '</option>' +
                    '<option value="90"' + (currentHeatmapDays === 90 ? ' selected' : '') + '>' + tr('stats.heatmap.90', '90 days') + '</option>' +
                    '<option value="180"' + (currentHeatmapDays === 180 ? ' selected' : '') + '>' + tr('stats.heatmap.180', '180 days') + '</option>' +
                    '<option value="365"' + (currentHeatmapDays === 365 ? ' selected' : '') + '>' + tr('stats.heatmap.365', '1 year') + '</option>' +
                '</select>' +
            '</div>';

        var clockSvg = renderWatchClock(clock);
        var streakSvg = renderStreakCalendar(streakCal);

        box.innerHTML =
            '<div class="ab-panel-card"><h4 style="margin:0 0 0.5em;">' + tr('stats.genre_radar', 'Genre radar') + '</h4>' + radarSvg + '</div>' +
            '<div class="ab-panel-card"><h4 style="margin:0 0 0.5em;">' + tr('stats.watch_clock', 'Watch clock (24h)') + '</h4>' + clockSvg + '</div>' +
            '<div class="ab-panel-card" style="grid-column:1 / -1; min-width:0;">' + heatHeader + heatSvg + '</div>' +
            '<div class="ab-panel-card" style="grid-column:1 / -1; min-width:0;"><h4 style="margin:0 0 0.5em;">' + tr('stats.streak_calendar', 'Streak calendar (1 year)') + '</h4>' + streakSvg + '</div>' +
            '<div class="ab-panel-card"><h4 style="margin:0 0 0.5em;">' + tr('stats.snapshot', 'Stats snapshot') + '</h4>' + histSvg + '</div>';

        var rangeEl = document.getElementById('abSaHeatmapRange');
        if (rangeEl) rangeEl.addEventListener('change', function () {
            currentHeatmapDays = parseInt(rangeEl.value, 10) || 90;
            loadStats();
        });
    }

    // Day-of-week labels used on the left of both the heatmap and the
    // streak calendar. Mon/Wed/Fri only to keep it compact on mobile.
    function renderDayLabels() {
        return '<div class="ab-cal-daylabels">' +
            '<div></div>' +
            '<div>' + tr('cal.day_mon', 'Mon') + '</div>' +
            '<div></div>' +
            '<div>' + tr('cal.day_wed', 'Wed') + '</div>' +
            '<div></div>' +
            '<div>' + tr('cal.day_fri', 'Fri') + '</div>' +
            '<div></div>' +
            '</div>';
    }
    // Build a month-label strip that lines up with the first column of
    // each month in the cell grid. Accepts the full `cells` array and
    // starting weekday offset (how many leading empty cells to pad).
    function renderMonthLabels(cells, leadingBlank) {
        var monthNames = [
            tr('cal.month_jan', 'Jan'), tr('cal.month_feb', 'Feb'), tr('cal.month_mar', 'Mar'),
            tr('cal.month_apr', 'Apr'), tr('cal.month_may', 'May'), tr('cal.month_jun', 'Jun'),
            tr('cal.month_jul', 'Jul'), tr('cal.month_aug', 'Aug'), tr('cal.month_sep', 'Sep'),
            tr('cal.month_oct', 'Oct'), tr('cal.month_nov', 'Nov'), tr('cal.month_dec', 'Dec')
        ];
        // Each "column" in the CSS grid is a week; cells flow 7-at-a-time.
        // Compute the starting weekday so leading blanks are accounted for.
        var totalCells = (leadingBlank || 0) + cells.length;
        var totalCols = Math.ceil(totalCells / 7);
        // Walk every cell and record the column it lands in per month;
        // emit a span of that month's width, using CSS `--span` custom
        // property so the grid-column span matches.
        var bucket = []; // index = col, value = month (0-11) or null
        for (var c = 0; c < totalCols; c++) bucket.push(null);
        for (var i = 0; i < cells.length; i++) {
            var colIdx = Math.floor(((leadingBlank || 0) + i) / 7);
            var m = cells[i].date.getMonth();
            if (bucket[colIdx] === null) bucket[colIdx] = m;
        }
        var labels = [];
        var cur = null, span = 0;
        for (var col = 0; col < totalCols; col++) {
            if (bucket[col] !== cur) {
                if (cur !== null) labels.push({ m: cur, span: span });
                cur = bucket[col];
                span = 1;
            } else {
                span++;
            }
        }
        if (cur !== null) labels.push({ m: cur, span: span });
        // Only show label when the month has ≥ 2 columns (otherwise it
        // gets squished). First bucket is often partial so we still
        // render the name there.
        return '<div class="ab-cal-monthlabels" style="grid-template-columns:repeat(' + totalCols + ',1fr);">' +
            labels.map(function (b) {
                var label = b.span >= 2 ? monthNames[b.m] : '';
                return '<div class="ab-cal-month" style="--span:' + b.span + ';grid-column:span ' + b.span + ';">' + label + '</div>';
            }).join('') +
            '</div>';
    }
    // Legend strip showing the color intensity scale for the heatmap.
    function renderHeatLegend(max) {
        var steps = [0, 1, Math.max(2, Math.floor(max / 4)), Math.max(3, Math.floor(max / 2)), max].filter(function (v, i, a) { return a.indexOf(v) === i; });
        return '<div class="ab-cal-legend">' +
            '<span>' + tr('stats.heatmap.less', 'Less') + '</span>' +
            '<div class="ab-cal-legend-scale">' + steps.map(function (n) {
                var color = n === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(102, 126, 234, ' + Math.min(1, 0.2 + (n / Math.max(1, max)) * 0.8).toFixed(2) + ')';
                return '<span class="ab-cal-legend-cell" title="' + n + '" style="background:' + color + ';"></span>';
            }).join('') + '</div>' +
            '<span>' + tr('stats.heatmap.more', 'More') + '</span>' +
            '<span style="margin-left:auto;opacity:0.6;">' + tr('stats.heatmap.max_suffix', 'max {n}/day').replace('{n}', max) + '</span>' +
            '</div>';
    }

    function renderHeatmap(calendar) {
        var counts = (calendar && calendar.Counts) || {};
        var days = (calendar && calendar.Days) || currentHeatmapDays || 90;
        var max = 0;
        for (var k in counts) { if (counts[k] > max) max = counts[k]; }
        if (max === 0) max = 1;

        var today = new Date();
        var cells = [];
        for (var i = days - 1; i >= 0; i--) {
            var d = new Date(today); d.setDate(today.getDate() - i);
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            cells.push({ date: d, key: key, count: counts[key] || 0 });
        }

        function colorFor(count) {
            if (count === 0) return 'rgba(255,255,255,0.05)';
            var intensity = Math.min(1, 0.2 + (count / max) * 0.8);
            return 'rgba(102, 126, 234, ' + intensity.toFixed(2) + ')';
        }

        // Pad the first column with empty leading cells so the grid aligns
        // to calendar weeks (column 0 = the week containing the earliest
        // visible day). CSS Sunday = 0 in JS; we treat Monday = row 0 for
        // matching the Mon/Wed/Fri labels.
        var firstDate = cells[0].date;
        var dow = firstDate.getDay(); // 0..6 Sun..Sat
        var leading = (dow + 6) % 7; // shift so Monday is 0

        var leadingHtml = '';
        for (var pi = 0; pi < leading; pi++) {
            leadingHtml += '<div class="ab-heat-cell ab-heat-empty" style="background:transparent;visibility:hidden;"></div>';
        }

        var cellsHtml = leadingHtml + cells.map(function (c) {
            var tooltip = c.key + ' · ' + c.count + ' ' + (c.count === 1 ? tr('common.item', 'item') : tr('common.items', 'items'));
            var emptyClass = c.count === 0 ? ' ab-heat-empty' : '';
            return '<div class="ab-heat-cell' + emptyClass + '" style="background:' + colorFor(c.count) + ';" title="' + tooltip + '"></div>';
        }).join('');

        // For desktop, emit grid-template-columns inline so cells stretch to
        // fill the container width (the "perfect on pc" old look). Mobile
        // CSS overrides this with !important to get fixed-size cells.
        var desktopCols = Math.ceil((leading + cells.length) / 7);
        return '<div class="ab-cal-wrap">' +
                 '<div class="ab-cal-grid">' +
                     renderDayLabels() +
                     '<div>' +
                         renderMonthLabels(cells, leading) +
                         '<div class="ab-heat" style="grid-template-columns:repeat(' + desktopCols + ',1fr);">' + cellsHtml + '</div>' +
                     '</div>' +
                 '</div>' +
               '</div>' +
               renderHeatLegend(max) +
               '<div class="ab-muted" style="font-size:0.75em; margin-top:0.5em;">' + tr('stats.heatmap.hint', 'Last {days} days · hover a cell for details').replace('{days}', days) + '</div>';
    }

    function renderHistogram(summary) {
        if (!summary) return '<div class="ab-muted">' + tr('stats.no_data', 'No data.') + '</div>';
        var items = [
            { label: tr('stats.snapshot.unlocked', 'Unlocked'), value: summary.Unlocked || 0, max: summary.Total || 1, color: '#4caf50' },
            { label: tr('stats.snapshot.score', 'Score'), value: summary.Score || 0, max: Math.max(5000, summary.Score || 0), color: '#667eea' },
            { label: tr('stats.snapshot.best_streak', 'Best streak'), value: summary.BestWatchStreak || 0, max: Math.max(30, summary.BestWatchStreak || 0), color: '#ff9800' }
        ];
        return items.map(function (it) {
            var pct = Math.round(100 * it.value / (it.max || 1));
            return '<div style="margin:0.5em 0;">' +
                '<div style="display:flex; justify-content:space-between; font-size:0.85em;"><span>' + it.label + '</span><span>' + it.value + '</span></div>' +
                '<div style="height:6px; border-radius:3px; background:rgba(255,255,255,0.1); overflow:hidden;"><div style="height:100%; width:' + pct + '%; background:' + it.color + ';"></div></div>' +
                '</div>';
        }).join('');
    }

    function escapeHtml(s) { var d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }

    // Render a compact row of equipped-badge dots next to a leaderboard entry
    // or podium column. Accepts the Equipped array shipped by the server
    // (each item: { Icon, Title, Rarity }). Returns empty string when the
    // target has opted out or has no equipped badges.
    var LB_RARITY_COLORS = { common: '#9fb3c8', uncommon: '#34d399', rare: '#60a5fa', epic: '#a78bfa', legendary: '#fbbf24', mythic: '#f43f5e' };
    function renderEquippedDots(equipped, size) {
        if (!equipped || !equipped.length) return '';
        var px = size || 20;
        return '<div class="ab-lb-equipped" style="display:inline-flex;gap:3px;margin-left:0.5em;vertical-align:middle;">' +
            equipped.slice(0, 5).map(function (b) {
                var color = LB_RARITY_COLORS[(b.Rarity || '').toLowerCase()] || '#9fb3c8';
                var iconName = safeIcon(b.Icon);
                return '<span title="' + escapeHtml(b.Title || '') + ' (' + escapeHtml(b.Rarity || '') + ')" ' +
                    'style="width:' + px + 'px;height:' + px + 'px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;' +
                    'background:' + color + '26;border:1.5px solid ' + color + ';box-shadow:0 0 8px ' + color + '55;">' +
                    '<span class="material-icons" style="font-family:Material Icons;font-size:' + Math.max(10, px - 6) + 'px;line-height:1;color:#fff;">' + iconName + '</span>' +
                '</span>';
            }).join('') + '</div>';
    }

    function loadCategoryLb(cat) {
        fetchJson('Plugins/AchievementBadges/leaderboard/' + cat + '?limit=10').then(function (lb) {
            var box = el('abSaLb'); if (!box) return;
            if (!lb || !lb.length) { box.innerHTML = '<div class="ab-muted">' + tr('lb.no_data', 'No data yet.') + '</div>'; return; }

            var maxVal = Math.max.apply(null, lb.map(function (e) { return e.Value || 0; }));
            if (maxVal === 0) maxVal = 1;

            var suffix = {
                score: tr('lb.pts_suffix', ' pts'), movies: tr('lb.movies_suffix', ' movies'), episodes: tr('lb.episodes_suffix', ' episodes'),
                hours: tr('lb.hours_suffix', ' hrs'), streak: tr('lb.days_suffix', ' days'), series: tr('lb.series_suffix', ' series')
            }[cat] || '';

            // Top 3 podium
            var top3 = lb.slice(0, 3);
            var podiumSvg = '';
            if (top3.length >= 1) {
                var ordered = [top3[1], top3[0], top3[2]]; // silver, gold, bronze for podium order
                var heights = [80, 110, 60];
                var colors = ['#c0c0c0', '#ffd700', '#cd7f32'];
                var medals = ['🥈', '🥇', '🥉'];
                var labels = [tr('lb.second', '2nd'), tr('lb.first', '1st'), tr('lb.third', '3rd')];
                podiumSvg = '<div class="ab-lb-podium">' + ordered.map(function (e, i) {
                    if (!e) return '<div class="ab-lb-podium-col ab-lb-podium-empty" style="height:' + heights[i] + 'px;"></div>';
                    return '<div class="ab-lb-podium-col">' +
                        '<div class="ab-lb-podium-medal">' + medals[i] + '</div>' +
                        '<div class="ab-lb-podium-name">' + escapeHtml(e.UserName || e.UserId) + '</div>' +
                        '<div class="ab-lb-podium-val" style="color:' + colors[i] + ';">' + (e.Value || 0) + suffix + '</div>' +
                        renderEquippedDots(e.Equipped, 18) +
                        '<div class="ab-lb-podium-bar" style="height:' + heights[i] + 'px; background:linear-gradient(180deg,' + colors[i] + ',' + colors[i] + '66);">' +
                            '<div class="ab-lb-podium-rank">' + labels[i] + '</div>' +
                        '</div>' +
                    '</div>';
                }).join('') + '</div>';
            }

            // Rows 4-10 as sleek list
            var rest = lb.slice(3);
            var rowsHtml = rest.map(function (e, i) {
                var pct = Math.round(100 * (e.Value || 0) / maxVal);
                return '<div class="ab-lb-row-new">' +
                    '<div class="ab-lb-rank">#' + (i + 4) + '</div>' +
                    '<div class="ab-lb-info">' +
                        '<div class="ab-lb-name">' + escapeHtml(e.UserName || e.UserId) + renderEquippedDots(e.Equipped, 16) + '</div>' +
                        '<div class="ab-lb-bar"><div class="ab-lb-fill" style="width:' + pct + '%;"></div></div>' +
                    '</div>' +
                    '<div class="ab-lb-value">' + (e.Value || 0) + suffix + '</div>' +
                '</div>';
            }).join('');

            box.innerHTML = podiumSvg + (rest.length ? '<div style="margin-top:1em;">' + rowsHtml + '</div>' : '');
        });
    }

    function renderShowcase(badges) {
        var sc = el('abSaShowcase'); if (!sc) return;
        sc.innerHTML = '';
        if (!badges || !badges.length) { sc.innerHTML = '<div class="ab-muted">' + tr('achievements.showcase_empty', 'Equip badges to build your showcase.') + '</div>'; return; }
        badges.forEach(function (b) {
            var c = document.createElement('div'); c.className = 'ab-sc-card';
            c.innerHTML = '<div class="ab-sc-icon">' + icon(b.Icon) + '</div><div><div style="font-weight:700;">' + escapeHtml(b.Title) + '</div><div class="' + rarityClass(b.Rarity) + '" style="font-size:0.88em;">' + escapeHtml(b.Rarity) + '</div></div>';
            sc.appendChild(c);
        });
    }

    function renderEquipped(badges) {
        var row = el('abSaEquipped'), empty = el('abSaEquippedEmpty'); if (!row) return;
        row.innerHTML = '';
        if (!badges || !badges.length) { if (empty) empty.style.display = 'block'; return; }
        if (empty) empty.style.display = 'none';
        // v2.0: equipped Badge Frame cosmetic (e.g. frame-gilded) is applied
        // as a class to every equipped badge card so the .frame-* CSS in
        // injectStyles paints the gold/holo/frosted edge effect.
        var frameCls = (v2EquippedFrameId && v2EquippedFrameId !== 'frame-default') ? ' ' + v2EquippedFrameId : '';
        badges.forEach(function (b) {
            var c = document.createElement('div');
            c.className = 'ab-card' + frameCls;
            c.setAttribute('data-badge-id', b.Id);
            c.innerHTML = '<div class="ab-card-h"><div class="ab-card-icon">' + icon(b.Icon) + '</div><div style="flex:1;"><div class="ab-card-title">' + escapeHtml(b.Title) + '</div><div class="ab-card-meta ' + rarityClass(b.Rarity) + '">' + escapeHtml(b.Rarity) + '</div></div></div>' +
                '<div class="ab-footer"><div class="ab-unlocked">' + tr('badge.equipped_state', 'Equipped') + '</div><button type="button" class="ab-btn">' + tr('badge.unequip', 'Unequip') + '</button></div>';
            c.querySelector('button').addEventListener('click', function () { doUnequip(b.Id); });
            row.appendChild(c);
        });
    }

    function renderBadges(badges, equippedIds) {
        var grid = el('abSaGrid'); if (!grid) return;
        grid.innerHTML = '';
        if (!badges || !badges.length) return;
        badges.forEach(function (b) {
            var cur = b.CurrentValue || 0, tar = b.TargetValue || 0;
            var pct = tar > 0 ? Math.min(cur / tar * 100, 100) : 0;
            var eq = equippedIds && equippedIds[b.Id];
            var c = document.createElement('div'); c.className = 'ab-card';
            c.setAttribute('data-badge-id', b.Id);
            var pts = scoreForBadge(b);
            var isPinned = !!pinnedIdsGlobal[b.Id];
            var isTitleEquipped = equippedTitleId && equippedTitleId === b.Id;
            var eta = badgeEtaMap[b.Id];
            if (isPinned) c.classList.add('ab-card-pinned');
            c.classList.add(rarityClass(b.Rarity) + '-border');
            var etaHtml = '';
            if (eta && !b.Unlocked && eta.DaysRemaining != null) {
                var etaTpl = eta.DaysRemaining === 1 ? tr('badge.eta_days', 'ETA ~{n} day') : tr('badge.eta_days_plural', 'ETA ~{n} days');
                etaHtml = '<div class="ab-eta"><span class="material-icons">schedule</span> ' + etaTpl.replace('{n}', eta.DaysRemaining) + '</div>';
            }
            // Server-wide rarity chip: % of users on this server who have
            // unlocked this badge. Coloured green > 50%, amber 10-50%, red < 10%.
            var rarityHtml = '';
            if (rarityPctMap && rarityPctMap[b.Id] != null) {
                var pctR = rarityPctMap[b.Id];
                var chipColor = pctR >= 50 ? '#4ade80' : (pctR >= 10 ? '#fbbf24' : '#f43f5e');
                rarityHtml = '<div class="ab-rarity-chip" title="' + tr('badge.rarity_tooltip', '% of users on this server who have unlocked this') + '" ' +
                    'style="display:inline-flex;align-items:center;gap:0.3em;margin-top:0.4em;padding:0.25em 0.6em;border-radius:999px;background:' + chipColor + '1f;border:1px solid ' + chipColor + ';font-size:0.74em;font-weight:700;color:' + chipColor + ';">' +
                    '<span class="material-icons" style="font-size:0.9em;">groups</span>' + pctR + '%' +
                    '</div>';
            }
            c.innerHTML =
                '<div class="ab-card-h">' +
                    '<div class="ab-card-icon">' + icon(b.Icon) + '</div>' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div class="ab-card-title">' + escapeHtml(b.Title) + '</div>' +
                        '<div class="ab-card-meta ' + rarityClass(b.Rarity) + '">' + escapeHtml(trRarity(b.Rarity)) + ' \u2022 ' + escapeHtml(trCategory(b.Category)) + '</div>' +
                    '</div>' +
                    '<div class="ab-badge-pts" title="' + (currentPrestige > 0 ? tr('badge.pts_tooltip_prestige', 'Points awarded on unlock (prestige bonus applied)') : tr('badge.pts_tooltip', 'Points awarded on unlock')) + '">+' + pts + ' ' + tr('badge.pts_label', 'pts') + '</div>' +
                '</div>' +
                '<div class="ab-desc">' + escapeHtml(b.Description) + '</div>' +
                '<div class="ab-prog-text"><span>' + tr('badge.progress', 'Progress') + '</span><span>' + cur + '/' + tar + '</span></div>' +
                '<div class="ab-prog-bar"><div class="ab-prog-fill" style="width:' + pct + '%;"></div></div>' +
                rarityHtml +
                etaHtml +
                '<div class="ab-footer">' +
                    '<div class="' + (b.Unlocked ? 'ab-unlocked' : 'ab-locked') + '">' + (b.Unlocked ? tr('badge.unlocked_state', 'Unlocked') : tr('badge.locked_state', 'Locked')) + '</div>' +
                    '<div style="display:flex; gap:0.4em; align-items:center;">' +
                        '<button type="button" class="ab-pin-btn ' + (isPinned ? 'ab-pin-active' : '') + '" title="' + (isPinned ? tr('badge.unpin', 'Unpin') : tr('badge.pin', 'Pin to top')) + '"><span class="material-icons">push_pin</span></button>' +
                        (b.Unlocked ? '<button type="button" class="ab-btn ab-title-btn" title="' + tr('badge.equip_as_title', 'Equip as title') + '">' + (isTitleEquipped ? tr('badge.title_equipped', 'Title \u2713') : tr('badge.as_title', 'As title')) + '</button>' : '') +
                        '<button type="button" class="ab-btn"' + (!b.Unlocked ? ' disabled style="opacity:0.5;"' : '') + '>' + (eq ? tr('badge.unequip', 'Unequip') : tr('badge.equip', 'Equip')) + '</button>' +
                    '</div>' +
                '</div>';
            // Pin button
            var pinBtn = c.querySelector('.ab-pin-btn');
            if (pinBtn) pinBtn.addEventListener('click', function (ev) {
                ev.stopPropagation();
                doPin(b.Id, !pinnedIdsGlobal[b.Id]);
            });
            // Title button (unlocked only)
            var titleBtn = c.querySelector('.ab-title-btn');
            if (titleBtn) titleBtn.addEventListener('click', function (ev) {
                ev.stopPropagation();
                doEquipTitle(equippedTitleId === b.Id ? null : b.Id);
            });
            // Equip button is the LAST button in footer
            var footerBtns = c.querySelectorAll('.ab-footer button');
            var equipBtn = footerBtns[footerBtns.length - 1];
            if (equipBtn && b.Unlocked) {
                equipBtn.addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    if (eq) doUnequip(b.Id); else doEquip(b.Id);
                });
            }
            // Click anywhere else on the card to open the chase modal (only for locked badges)
            if (!b.Unlocked) {
                c.style.cursor = 'pointer';
                c.addEventListener('click', function (ev) {
                    if (ev.target.closest('.ab-pin-btn') || ev.target.closest('.ab-footer button')) return;
                    openChaseModal(b);
                });
            }
            grid.appendChild(c);
        });
    }

    function renderPreferences(prefs) {
        var box = el('abSaPrefs');
        if (!box) return;
        prefs = prefs || { EnableUnlockToasts: true, EnableMilestoneToasts: true, EnableConfetti: true, AppearInActivityFeed: true, EnableCoWatchBonus: true };
        // Hide AppearInActivityFeed when the admin has force-enabled privacy mode or
        // disabled the activity feed entirely — the user's preference is moot in those cases.
        var pc = publicConfigGlobal || {};
        var hideAppearInActivity = !!(pc.ForcePrivacyMode || pc.forcePrivacyMode)
            || pc.ActivityFeedEnabled === false || pc.activityFeedEnabled === false;
        var defs = [
            { key: 'EnableUnlockToasts', label: tr('prefs.unlock_toasts', 'Unlock toasts'), desc: tr('prefs.unlock_toasts_desc', 'Pop up a notification when you unlock a badge') },
            { key: 'EnableMilestoneToasts', label: tr('prefs.milestone_toasts', 'Milestone toasts'), desc: tr('prefs.milestone_toasts_desc', '25/50/75/100% completion celebrations') },
            { key: 'EnableConfetti', label: tr('prefs.confetti', 'Confetti effects'), desc: tr('prefs.confetti_desc', 'Particle bursts on unlock (disable for reduced motion)') },
            { key: 'AppearInActivityFeed', label: tr('prefs.appear_activity', 'Appear in activity feed'), desc: tr('prefs.appear_activity_desc', 'Let other users see your unlocks in the feed') },
            { key: 'EnableCoWatchBonus', label: tr('prefs.cowatch_bonus', 'Co-watch bonus'), desc: tr('prefs.cowatch_bonus_desc', 'Earn bonus score when another user watches the same item within an hour') }
        ];
        if (hideAppearInActivity) {
            defs = defs.filter(function (d) { return d.key !== 'AppearInActivityFeed'; });
        }
        box.innerHTML = defs.map(function (d) {
            var checked = prefs[d.key] !== false;
            return '<label class="ab-pref">' +
                '<input type="checkbox"' + (checked ? ' checked' : '') + ' data-pref="' + d.key + '">' +
                '<div>' +
                    '<div class="ab-pref-label">' + d.label + '</div>' +
                    '<div class="ab-pref-desc">' + d.desc + '</div>' +
                '</div>' +
            '</label>';
        }).join('');
        box.querySelectorAll('input[data-pref]').forEach(function (cb) {
            cb.addEventListener('change', function () { savePreferences(box); });
        });
    }

    function savePreferences(box) {
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/preferences').then(function (existing) {
            var payload = existing || {};
            box.querySelectorAll('input[data-pref]').forEach(function (cb) {
                var key = cb.getAttribute('data-pref');
                // Remove any camelCase duplicate from the GET response before setting PascalCase
                var camel = key.charAt(0).toLowerCase() + key.slice(1);
                delete payload[camel];
                delete payload[key];
                payload[key] = cb.checked;
            });
            return fetchJson('Plugins/AchievementBadges/users/' + userId + '/preferences', 'POST', payload);
        }).catch(function () { });
    }

    function applyPageTheme(theme) {
        if (!root) return;
        var classes = root.className.split(/\s+/).filter(function (c) {
            return c !== 'ab-theme-dark' && c !== 'ab-theme-light';
        });
        if (theme === 'dark') classes.push('ab-theme-dark');
        else if (theme === 'light') classes.push('ab-theme-light');
        root.className = classes.join(' ');
    }

    function loadSettingsPanel() {
        var box = el('abSaSettingsContent');
        if (!box) return;
        box.innerHTML = tr('settings.loading', 'Loading settings...');
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/preferences').then(function (prefs) {
            renderSettingsPanel(prefs || {});
        }).catch(function () {
            box.innerHTML = '<div class="ab-muted">' + tr('settings.save_failed', 'Failed to save settings.') + '</div>';
        });
    }

    function renderSettingsPanel(prefs) {
        var box = el('abSaSettingsContent');
        if (!box) return;
        // Strip the `data-i18n="settings.loading"` attribute that sat on the
        // container from initial HTML — without this, applyStaticTranslations
        // walks the DOM on every language-change pass and RESETS textContent
        // to the translated "Loading settings..." string, WIPING the entire
        // rendered panel. Classic textContent-kills-children hazard.
        if (box.hasAttribute('data-i18n')) box.removeAttribute('data-i18n');

        function toggle(key, label, desc, checked) {
            return '<label class="ab-toggle">' +
                '<div class="ab-toggle-switch">' +
                    '<input type="checkbox"' + (checked ? ' checked' : '') + ' data-settings-key="' + key + '">' +
                    '<span class="ab-toggle-track"></span>' +
                '</div>' +
                '<div class="ab-toggle-info">' +
                    '<div class="ab-toggle-label">' + label + '</div>' +
                    (desc ? '<div class="ab-toggle-desc">' + desc + '</div>' : '') +
                '</div>' +
            '</label>';
        }

        var minRarity = prefs.minimumToastRarity || prefs.MinimumToastRarity || 'all';
        var toastGrouping = (prefs.unlockToastGrouping || prefs.UnlockToastGrouping || 'grouped').toString().toLowerCase();
        var toastPos = (prefs.toastPosition || prefs.ToastPosition || 'top-right').toString().toLowerCase();
        var toastDeviceScope = (prefs.unlockToastDeviceScope || prefs.UnlockToastDeviceScope || 'all-devices').toString().toLowerCase();
        var pageTheme = prefs.achievementPageTheme || prefs.AchievementPageTheme || 'default';
        var slots = prefs.equippedBadgeSlots || prefs.EquippedBadgeSlots || 5;
        var prefLang = (prefs.language || prefs.Language || 'default').toString().toLowerCase();
        var prefCardStyle = (prefs.profileCardStyle || prefs.ProfileCardStyle || '').toString().toLowerCase();
        var prefCorner = (prefs.friendsButtonCorner || prefs.FriendsButtonCorner || 'bottom-left').toString().toLowerCase();

        // Admin-forced feature flags (from public-config). When an admin has forced a behavior
        // globally, the corresponding user toggle is moot and hidden.
        var pc = publicConfigGlobal || {};
        var forcePrivacy = !!(pc.ForcePrivacyMode || pc.forcePrivacyMode);
        var forceSpoiler = !!(pc.ForceSpoilerMode || pc.forceSpoilerMode);
        var forceExtremeSpoiler = !!(pc.ForceExtremeSpoilerMode || pc.forceExtremeSpoilerMode);
        var lbOff = pc.LeaderboardEnabled === false || pc.leaderboardEnabled === false;
        var compareOff = pc.CompareEnabled === false || pc.compareEnabled === false;
        var activityOff = pc.ActivityFeedEnabled === false || pc.activityFeedEnabled === false;
        var prestigeOff = pc.PrestigeEnabled === false || pc.prestigeEnabled === false;

        // Individual privacy toggles: hidden when admin forces privacy OR when the feature itself
        // is globally disabled (in which case the "hide me from X" toggle is meaningless).
        var hideLeaderboardToggle = forcePrivacy || lbOff;
        var hideCompareToggle = forcePrivacy || compareOff;
        var hideActivityToggle = forcePrivacy || activityOff;
        var hidePrestigeToggle = forcePrivacy || prestigeOff;
        var privacySectionHidden = hideLeaderboardToggle && hideCompareToggle && hideActivityToggle && hidePrestigeToggle;

        function maybeToggle(hidden, key, label, desc, checked) {
            if (hidden) return '';
            return toggle(key, label, desc, checked);
        }

        var privacySectionHtml = '';
        if (!privacySectionHidden) {
            var privacyNote = forcePrivacy
                ? '<div class="ab-muted" style="font-size:0.85em; margin-bottom:0.5em;">' + tr('settings.privacy_forced_admin', 'Privacy is enforced server-side by admin.') + '</div>'
                : '';
            privacySectionHtml =
                '<div class="ab-settings-section">' +
                    '<div class="ab-eyebrow">' + tr('settings.privacy', 'Privacy') + '</div>' +
                    privacyNote +
                    '<div class="ab-settings-grid">' +
                        maybeToggle(hideLeaderboardToggle, 'hideFromLeaderboard', tr('settings.hide_from_leaderboard', 'Hide from leaderboard'), tr('settings.hide_from_leaderboard_desc', 'Remove yourself from the public leaderboard'), prefs.hideFromLeaderboard === true || prefs.HideFromLeaderboard === true) +
                        maybeToggle(hideCompareToggle, 'hideFromCompare', tr('settings.hide_from_compare', 'Hide from compare profiles'), tr('settings.hide_from_compare_desc', 'Prevent others from comparing with you'), prefs.hideFromCompare === true || prefs.HideFromCompare === true) +
                        maybeToggle(hideActivityToggle, 'hideFromActivityFeed', tr('settings.hide_from_activity', 'Hide from activity feed'), tr('settings.hide_from_activity_desc', 'Prevent your unlocks from appearing in the server feed'), prefs.appearInActivityFeed === false || prefs.AppearInActivityFeed === false) +
                        maybeToggle(hidePrestigeToggle, 'hideFromPrestigeBoard', tr('settings.hide_from_prestige', 'Hide from prestige board'), tr('settings.hide_from_prestige_desc', 'Remove yourself from the prestige leaderboard'), prefs.hideFromPrestigeBoard === true || prefs.HideFromPrestigeBoard === true) +
                        // Friends-specific privacy toggles (v1.7.9+)
                        toggle('appearOffline', tr('settings.appear_offline', 'Appear offline to friends'), tr('settings.appear_offline_desc', 'Your friends will always see you as offline, even while you\'re browsing Jellyfin'), prefs.appearOffline === true || prefs.AppearOffline === true) +
                        toggle('hideNowPlaying', tr('settings.hide_now_playing', 'Hide what I\'m watching'), tr('settings.hide_now_playing_desc', 'Friends can still see you as online, but not the series or episode you\'re watching'), prefs.hideNowPlaying === true || prefs.HideNowPlaying === true) +
                        /* v1.8.56: hide the "Offline — last watched X" line that appears below
                           a friend's name when they're offline. Independent of the live
                           Now Playing toggle above. */
                        toggle('hideLastWatched', tr('settings.hide_last_watched', 'Hide my last watched when offline'), tr('settings.hide_last_watched_desc', 'Friends won\'t see what you watched most recently when you\'re offline'), prefs.hideLastWatched === true || prefs.HideLastWatched === true) +
                    '</div>' +
                '</div>';
        }

        var spoilerRowHtml = forceSpoiler
            ? '<div class="ab-setting-row">' +
                '<div class="ab-toggle-info">' +
                    '<div class="ab-toggle-label">' + tr('settings.spoiler_mode', 'Spoiler mode') + '</div>' +
                    '<div class="ab-toggle-desc">' + tr('settings.enforced_admin', 'Enforced by admin.') + '</div>' +
                '</div>' +
              '</div>'
            : toggle('spoilerMode', tr('settings.spoiler_mode', 'Spoiler mode'), tr('settings.spoiler_mode_desc', 'Hide locked badge descriptions to avoid spoilers'), prefs.spoilerMode === true || prefs.SpoilerMode === true);

        var extremeSpoilerRowHtml = forceExtremeSpoiler
            ? '<div class="ab-setting-row">' +
                '<div class="ab-toggle-info">' +
                    '<div class="ab-toggle-label">' + tr('settings.extreme_spoiler_mode', 'Extreme spoiler mode') + '</div>' +
                    '<div class="ab-toggle-desc">' + tr('settings.enforced_admin', 'Enforced by admin.') + '</div>' +
                '</div>' +
              '</div>'
            : toggle('extremeSpoilerMode', tr('settings.extreme_spoiler_mode', 'Extreme spoiler mode'), tr('settings.extreme_spoiler_mode_desc', 'Completely hide locked badges (not just descriptions)'), prefs.extremeSpoilerMode === true || prefs.ExtremeSpoilerMode === true);

        var navigationSectionHtml =
            '<div class="ab-settings-section">' +
                '<div class="ab-eyebrow">' + tr('settings.navigation_integrations', 'Navigation integrations') + '</div>' +
                '<div class="ab-muted" style="font-size:0.85em; margin-bottom:0.65em;">' + tr('settings.navigation_integrations_desc', 'Choose where Achievements appears for your account. Server administrators control which integrations are available.') + '</div>' +
                '<div class="ab-settings-grid">' +
                    toggle('showCustomTabsEntry', tr('settings.show_custom_tabs_entry', 'Show Custom Tabs entry'), tr('settings.show_custom_tabs_entry_desc', 'Show Achievements in Jellyfin\'s Home tab bar when the Custom Tabs integration is enabled'), prefs.showCustomTabsEntry !== false && prefs.ShowCustomTabsEntry !== false) +
                    toggle('showPluginPagesEntry', tr('settings.show_plugin_pages_entry', 'Show Plugin Pages entry'), tr('settings.show_plugin_pages_entry_desc', 'Show Achievements in the Plugin Pages navigation when that integration is enabled'), prefs.showPluginPagesEntry !== false && prefs.ShowPluginPagesEntry !== false) +
                    toggle('showUserMenuShortcut', tr('settings.show_user_menu_shortcut', 'Show header shortcut'), tr('settings.show_user_menu_shortcut_desc', 'Show the Achievements trophy beside your user/profile control'), prefs.showUserMenuShortcut !== false && prefs.ShowUserMenuShortcut !== false) +
                '</div>' +
            '</div>';

        var html =
            '<div class="ab-settings-section">' +
                '<div class="ab-eyebrow">' + tr('settings.toast_sound_section', 'Toast & Sound') + '</div>' +
                '<div class="ab-settings-grid">' +
                    toggle('enableUnlockToasts', tr('settings.enable_toasts', 'Enable unlock toasts'), tr('settings.enable_toasts_desc', 'Show a notification when you unlock a badge'), prefs.enableUnlockToasts !== false && prefs.EnableUnlockToasts !== false) +
                    toggle('enableSound', tr('settings.enable_sound', 'Enable toast sound'), tr('settings.enable_sound_desc', 'Play a sound effect with notifications'), prefs.enableSound !== false && prefs.EnableSound !== false) +
                    toggle('enableConfetti', tr('settings.confetti', 'Enable confetti'), tr('settings.confetti_desc', 'Particle burst effects on rare+ unlocks'), prefs.enableConfetti !== false && prefs.EnableConfetti !== false) +
                    toggle('enableMilestoneToasts', tr('settings.enable_milestone_toasts', 'Enable milestone toasts'), tr('settings.enable_milestone_toasts_desc', 'Celebrate 25/50/75/100% completion'), prefs.enableMilestoneToasts !== false && prefs.EnableMilestoneToasts !== false) +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.toast_grouping', 'Unlock toast style') + '</div><div class="ab-toggle-desc">' + tr('settings.toast_grouping_desc', 'Group unlock bursts into one notification or play every achievement separately') + '</div></div>' +
                        '<select class="ab-select" data-settings-select="unlockToastGrouping">' +
                            '<option value="grouped"' + (toastGrouping === 'grouped' ? ' selected' : '') + '>' + tr('settings.toast_grouped', 'Grouped summary') + '</option>' +
                            '<option value="individual"' + (toastGrouping === 'individual' ? ' selected' : '') + '>' + tr('settings.toast_individual', 'Individual animations') + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.toast_position', 'Toast position') + '</div><div class="ab-toggle-desc">' + tr('settings.toast_position_desc', 'Where unlock notifications appear on your screen') + '</div></div>' +
                        '<select class="ab-select" data-settings-select="toastPosition">' +
                            '<option value="top-right"' + (toastPos === 'top-right' ? ' selected' : '') + '>' + tr('settings.toast_pos_top_right', 'Top-right (default)') + '</option>' +
                            '<option value="top-left"' + (toastPos === 'top-left' ? ' selected' : '') + '>' + tr('settings.toast_pos_top_left', 'Top-left') + '</option>' +
                            '<option value="bottom-right"' + (toastPos === 'bottom-right' ? ' selected' : '') + '>' + tr('settings.toast_pos_bottom_right', 'Bottom-right') + '</option>' +
                            '<option value="bottom-left"' + (toastPos === 'bottom-left' ? ' selected' : '') + '>' + tr('settings.toast_pos_bottom_left', 'Bottom-left') + '</option>' +
                            '<option value="bottom-center"' + (toastPos === 'bottom-center' ? ' selected' : '') + '>' + tr('settings.toast_pos_bottom_center', 'Bottom-center (original)') + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.toast_device_scope', 'Toast device scope') + '</div><div class="ab-toggle-desc">' + tr('settings.toast_device_scope_desc', 'Show unlocks on every signed-in device or only the device that earned them') + '</div></div>' +
                        '<select class="ab-select" data-settings-select="unlockToastDeviceScope">' +
                            '<option value="all-devices"' + (toastDeviceScope === 'all-devices' ? ' selected' : '') + '>' + tr('settings.toast_all_devices', 'All signed-in devices') + '</option>' +
                            '<option value="originating-device"' + (toastDeviceScope === 'originating-device' ? ' selected' : '') + '>' + tr('settings.toast_originating_device', 'Unlocking device only') + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.minimum_rarity', 'Minimum toast rarity') + '</div><div class="ab-toggle-desc">' + tr('settings.minimum_rarity_desc', 'Only show toasts for badges at or above this rarity') + '</div></div>' +
                        '<select class="ab-select" data-settings-select="minimumToastRarity">' +
                            '<option value="all"' + (minRarity === 'all' ? ' selected' : '') + '>' + tr('settings.rarity_all', 'All') + '</option>' +
                            '<option value="rare"' + (minRarity === 'rare' ? ' selected' : '') + '>' + tr('settings.rarity_rare_plus', 'Rare+') + '</option>' +
                            '<option value="epic"' + (minRarity === 'epic' ? ' selected' : '') + '>' + tr('settings.rarity_epic_plus', 'Epic+') + '</option>' +
                            '<option value="legendary"' + (minRarity === 'legendary' ? ' selected' : '') + '>' + tr('settings.rarity_legendary_plus', 'Legendary+') + '</option>' +
                        '</select>' +
                    '</div>' +
                    toggle('muteToastsDuringPlayback', tr('settings.mute_toasts_playback', 'Mute toasts while watching'), tr('settings.mute_toasts_playback_desc', 'Hide achievement unlock popups while a movie or episode is playing'), prefs.muteToastsDuringPlayback === true || prefs.MuteToastsDuringPlayback === true) +
                    toggle('muteToastSoundDuringPlayback', tr('settings.mute_sound_playback', 'Mute sound while watching'), tr('settings.mute_sound_playback_desc', 'Suppress the unlock sound while a movie or episode is playing (visual still shows if toasts are enabled)'), prefs.muteToastSoundDuringPlayback !== false && prefs.MuteToastSoundDuringPlayback !== false) +
                '</div>' +
            '</div>' +
            privacySectionHtml +
            navigationSectionHtml +
            '<div class="ab-settings-section">' +
                '<div class="ab-eyebrow">' + tr('settings.display_features', 'Display & Features') + '</div>' +
                '<div class="ab-settings-grid">' +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.language', 'Language') + '</div><div class="ab-toggle-desc">' + tr('settings.language_desc', 'UI language for the achievements page') + '</div></div>' +
                        '<select class="ab-select" data-settings-select="language" id="abSaLanguageSelect">' +
                            '<option value="default"' + (prefLang === 'default' ? ' selected' : '') + '>' + tr('settings.language_default', 'Default (admin)') + '</option>' +
                            '<option value="en"' + (prefLang === 'en' ? ' selected' : '') + '>' + tr('settings.language_en', 'English') + '</option>' +
                            '<option value="fr"' + (prefLang === 'fr' ? ' selected' : '') + '>' + tr('settings.language_fr', 'Français') + '</option>' +
                            '<option value="es"' + (prefLang === 'es' ? ' selected' : '') + '>' + tr('settings.language_es', 'Español') + '</option>' +
                            '<option value="de"' + (prefLang === 'de' ? ' selected' : '') + '>' + tr('settings.language_de', 'Deutsch') + '</option>' +
                            '<option value="it"' + (prefLang === 'it' ? ' selected' : '') + '>' + tr('settings.language_it', 'Italiano') + '</option>' +
                            '<option value="pt"' + (prefLang === 'pt' ? ' selected' : '') + '>' + tr('settings.language_pt', 'Português') + '</option>' +
                            '<option value="zh"' + (prefLang === 'zh' ? ' selected' : '') + '>' + tr('settings.language_zh', '中文') + '</option>' +
                            '<option value="ja"' + (prefLang === 'ja' ? ' selected' : '') + '>' + tr('settings.language_ja', '日本語') + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.theme', 'Achievement page theme') + '</div><div class="ab-toggle-desc">' + tr('settings.theme_desc', 'Visual theme for this page') + '</div></div>' +
                        '<select class="ab-select" data-settings-select="achievementPageTheme" id="abSaThemeSelect">' +
                            '<option value="default"' + (pageTheme === 'default' ? ' selected' : '') + '>' + tr('settings.theme_default', 'Default') + '</option>' +
                            '<option value="dark"' + (pageTheme === 'dark' ? ' selected' : '') + '>' + tr('settings.theme_dark', 'Dark') + '</option>' +
                            '<option value="light"' + (pageTheme === 'light' ? ' selected' : '') + '>' + tr('settings.theme_light', 'Light') + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.profile_card_style', 'Shareable card style') + '</div><div class="ab-toggle-desc">' + tr('settings.profile_card_style_desc', 'How your shareable profile card looks when someone opens it') + '</div></div>' +
                        '<select class="ab-select" data-settings-select="profileCardStyle">' +
                            '<option value=""' + (prefCardStyle === '' || prefCardStyle === 'console' ? ' selected' : '') + '>' + tr('settings.card_style_console', 'Classic') + '</option>' +
                            '<option value="metro"' + (prefCardStyle === 'metro' ? ' selected' : '') + '>' + tr('settings.card_style_metro', 'Xbox 360 — Metro') + '</option>' +
                            '<option value="blades"' + (prefCardStyle === 'blades' ? ' selected' : '') + '>' + tr('settings.card_style_blades', 'Xbox 360 — Blades') + '</option>' +
                        '</select>' +
                    '</div>' +
                    spoilerRowHtml +
                    extremeSpoilerRowHtml +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.equipped_slots', 'Equipped badge slots') + '</div><div class="ab-toggle-desc">' + tr('settings.equipped_slots_desc', 'Number of badges in your showcase (1-10)') + '</div></div>' +
                        '<input type="number" class="ab-input" data-settings-number="equippedBadgeSlots" min="1" max="10" value="' + slots + '" style="width:70px;text-align:center;">' +
                    '</div>' +
                    // Corner picker for the global friends button (v1.7.11+).
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.friends_corner', 'Friends button position') + '</div><div class="ab-toggle-desc">' + tr('settings.friends_corner_desc', 'Which corner the floating friends button lives in') + '</div></div>' +
                        '<select class="ab-select" data-settings-select="friendsButtonCorner">' +
                            '<option value="bottom-left"' + (prefCorner === 'bottom-left' ? ' selected' : '') + '>' + tr('settings.corner_bottom_left', 'Bottom-left') + '</option>' +
                            '<option value="bottom-right"' + (prefCorner === 'bottom-right' ? ' selected' : '') + '>' + tr('settings.corner_bottom_right', 'Bottom-right') + '</option>' +
                            '<option value="top-left"' + (prefCorner === 'top-left' ? ' selected' : '') + '>' + tr('settings.corner_top_left', 'Top-left') + '</option>' +
                            '<option value="top-right"' + (prefCorner === 'top-right' ? ' selected' : '') + '>' + tr('settings.corner_top_right', 'Top-right') + '</option>' +
                        '</select>' +
                    '</div>' +
                    toggle('autoEquipNewUnlocks', tr('settings.auto_equip', 'Auto-equip new unlocks'), tr('settings.auto_equip_desc', 'Automatically equip newly unlocked badges'), prefs.autoEquipNewUnlocks === true || prefs.AutoEquipNewUnlocks === true) +
                    toggle('enablePushNotifications', tr('settings.push_notifications', 'Push notifications'), tr('settings.push_notifications_desc', 'Receive push notifications for achievements'), prefs.enablePushNotifications === true || prefs.EnablePushNotifications === true) +
                    toggle('messageNotifications', tr('settings.msg_notifications', 'Message notifications'), tr('settings.msg_notifications_desc', 'Show a toast + browser notification when a friend messages you'), prefs.messageNotifications !== false && prefs.MessageNotifications !== false) +
                    toggle('messageNotificationSound', tr('settings.msg_sound', 'Message sound'), tr('settings.msg_sound_desc', 'Play a subtle chime when a message arrives'), prefs.messageNotificationSound !== false && prefs.MessageNotificationSound !== false) +
                    toggle('muteMessageNotificationsDuringPlayback', tr('settings.mute_during_playback', 'Mute during playback'), tr('settings.mute_during_playback_desc', 'Suppress message notifications while watching something'), prefs.muteMessageNotificationsDuringPlayback === true || prefs.MuteMessageNotificationsDuringPlayback === true) +
                    ((pc.ForceHideEquippedShowcase || pc.forceHideEquippedShowcase)
                        ? '<div class="ab-setting-row"><div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.show_equipped_showcase', 'Show equipped showcase') + '</div><div class="ab-toggle-desc">' + tr('settings.showcase_admin_off', 'Hidden by admin.') + '</div></div></div>'
                        : toggle('showEquippedShowcase', tr('settings.show_equipped_showcase', 'Show equipped showcase'), tr('settings.show_equipped_showcase_desc', 'Show the equipped-badge strip in the sidebar, header dots, and equipped slots on this page'), prefs.showEquippedShowcase !== false && prefs.ShowEquippedShowcase !== false)) +
                '</div>' +
            '</div>';

        box.innerHTML = html;

        // Wire auto-save on any change
        box.querySelectorAll('input[data-settings-key]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                saveSettingsPrefs(box);
                // If the user flipped the showcase toggle, reflect it
                // immediately without waiting for a full page reload.
                if (cb.getAttribute('data-settings-key') === 'showEquippedShowcase') {
                    applyShowcasePreference({ ShowEquippedShowcase: cb.checked });
                }
            });
        });
        box.querySelectorAll('select[data-settings-select]').forEach(function (sel) {
            sel.addEventListener('change', function () {
                var savePromise = saveSettingsPrefs(box) || Promise.resolve();
                if (sel.getAttribute('data-settings-select') === 'achievementPageTheme') {
                    applyPageTheme(sel.value);
                }
                if (sel.getAttribute('data-settings-select') === 'friendsButtonCorner') {
                    // Broadcast to sidebar.js so the floating button moves
                    // immediately without waiting for the periodic poll.
                    try {
                        window.dispatchEvent(new CustomEvent('ab:friends-corner-changed', { detail: { corner: sel.value } }));
                    } catch (e) {}
                }
                if (sel.getAttribute('data-settings-select') === 'toastPosition') {
                    // Tell enhance.js to move the toast container immediately.
                    try {
                        window.dispatchEvent(new CustomEvent('ab:notification-preferences-changed', { detail: { toastPosition: sel.value } }));
                    } catch (e) {}
                }
                if (sel.getAttribute('data-settings-select') === 'language') {
                    // Resolve the chosen language now (honor "default" -> admin).
                    var chosen = sel.value;
                    var pc = publicConfigGlobal || {};
                    var adminLang = (pc.DefaultLanguage || pc.defaultLanguage || 'en').toString().toLowerCase();
                    var eff = (!chosen || chosen === 'default') ? adminLang : chosen;
                    // Keep the local prefs in sync with the user's choice.
                    prefs.Language = chosen;
                    prefs.language = chosen;
                    // Mirror to localStorage so the admin page picks up the
                    // same language on its next load without waiting for
                    // the server round-trip.
                    try { if (window.localStorage) localStorage.setItem('achievementBadgesLang', eff); } catch (e) {}

                    // Load the translation bundle in parallel with save.
                    // Don't block the re-render on savePromise — we already
                    // know what the user chose, and a server error on save
                    // should NOT cause the dropdown to revert to default in
                    // the UI. savePromise still runs in the background and
                    // any failure is best-effort logged in saveSettingsPrefs.
                    loadTranslations(eff).then(function () {
                        applyStaticTranslations();
                        // Re-render with the LOCAL prefs so the dropdown
                        // always shows the user's chosen language — never
                        // bounce back to Default because of a racy fetch.
                        try { renderSettingsPanel(prefs); } catch (e) {}
                        // v2.0.x: Loadout content is built from string
                        // templates with tr() calls baked in at render time;
                        // it doesn't refresh from applyStaticTranslations
                        // because the strings are inside child elements that
                        // the DOM walker skips. Force a re-fetch+re-render
                        // so the new language sticks on Power-ups/Shop/Cos.
                        try { if (typeof loadLoadout === 'function' && userId) loadLoadout(); } catch (e) {}
                        try { syncRevampSectionLabel(); } catch (e) {}
                        // Also hard-pin the select's value after render
                        // as belt-and-braces: even if another async code
                        // path re-rendered the panel with stale data, the
                        // user's choice wins.
                        var reSel = document.getElementById('abSaLanguageSelect');
                        if (reSel && reSel.value !== chosen) {
                            for (var i = 0; i < reSel.options.length; i++) {
                                if (reSel.options[i].value === chosen) { reSel.selectedIndex = i; break; }
                            }
                        }
                    }).catch(function () {
                        // Translation load failed — still keep the dropdown
                        // on the user's pick.
                        try { renderSettingsPanel(prefs); } catch (e) {}
                    });

                    // Once the save lands, silently refresh badge titles /
                    // categories etc. so BadgeLocalizer picks the new lang.
                    // We do NOT re-render the settings panel here — that's
                    // already done above with the correct chosen value.
                    savePromise.then(function () {
                        try { if (typeof loadAll === 'function') loadAll(); } catch (e) {}
                    });
                }
            });
        });
        box.querySelectorAll('input[data-settings-number]').forEach(function (inp) {
            inp.addEventListener('change', function () { saveSettingsPrefs(box); });
        });
    }

    function toPascalCase(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function saveSettingsPrefs(box) {
        // Returns a promise so callers that depend on the save having
        // landed server-side (e.g. the language picker, which wants to
        // re-fetch server-localised badges) can await it.
        return fetchJson('Plugins/AchievementBadges/users/' + userId + '/preferences').then(function (existing) {
            var payload = existing || {};
            box.querySelectorAll('input[data-settings-key]').forEach(function (cb) {
                var key = cb.getAttribute('data-settings-key');
                if (key === 'hideFromActivityFeed') {
                    // Remove both casing variants then set canonical PascalCase
                    delete payload['appearInActivityFeed'];
                    delete payload['AppearInActivityFeed'];
                    payload['AppearInActivityFeed'] = !cb.checked;
                } else {
                    // Remove old camelCase key from GET response, set both to be safe
                    delete payload[key];
                    payload[key] = cb.checked;
                    payload[toPascalCase(key)] = cb.checked;
                }
            });
            box.querySelectorAll('select[data-settings-select]').forEach(function (sel) {
                var key = sel.getAttribute('data-settings-select');
                delete payload[key];
                payload[key] = sel.value;
                payload[toPascalCase(key)] = sel.value;
            });
            box.querySelectorAll('input[data-settings-number]').forEach(function (inp) {
                var v = parseInt(inp.value, 10);
                if (!isNaN(v)) {
                    var min = parseInt(inp.min, 10) || 1;
                    var max = parseInt(inp.max, 10) || 10;
                    if (v < min) v = min;
                    if (v > max) v = max;
                    inp.value = v;
                    var key = inp.getAttribute('data-settings-number');
                    delete payload[key];
                    payload[key] = v;
                    payload[toPascalCase(key)] = v;
                }
            });
            return fetchJson('Plugins/AchievementBadges/users/' + userId + '/preferences', 'POST', payload).then(function (res) {
                // Tell the sidebar's messaging module to re-read prefs next poll.
                try { if (window.__abInvalidateMsgPrefs) window.__abInvalidateMsgPrefs(); } catch (e) {}
                try { window.dispatchEvent(new CustomEvent('ab:notification-preferences-changed')); } catch (e) {}
                try { window.dispatchEvent(new CustomEvent('ab:navigation-preferences-changed')); } catch (e) {}
                return res;
            });
        }).catch(function () { });
    }

    function renderPinnedRow(badges) {
        var wrap = el('abSaPinnedWrap');
        var row = el('abSaPinnedRow');
        if (!wrap || !row) return;

        var pinned = (badges || []).filter(function (b) { return pinnedIdsGlobal[b.Id] && !b.Unlocked; });
        if (!pinned.length) { wrap.style.display = 'none'; return; }

        wrap.style.display = 'block';
        row.innerHTML = pinned.map(function (b) {
            var cur = b.CurrentValue || 0, tar = b.TargetValue || 0;
            var pct = tar > 0 ? Math.round(100 * cur / tar) : 0;
            var eta = badgeEtaMap[b.Id];
            var etaText = eta && eta.DaysRemaining != null ? '\u00b7 ' + tr('common.eta', 'ETA ~') + eta.DaysRemaining + tr('common.day_suffix', 'd') : '';
            return '<div class="ab-goal-card ' + rarityClass(b.Rarity) + '-border" data-badge="' + b.Id + '">' +
                '<div class="ab-goal-label ' + rarityClass(b.Rarity) + '">' + (b.Rarity || '') + '</div>' +
                '<div class="ab-goal-text">' + escapeHtml(b.Title || '') + '</div>' +
                '<div class="ab-goal-meta">' + cur + ' / ' + tar + ' (' + pct + '%) ' + etaText + '</div>' +
                '<div style="height:4px; border-radius:2px; background:rgba(255,255,255,0.08); margin-top:0.5em; overflow:hidden;">' +
                    '<div style="height:100%; width:' + pct + '%; background:linear-gradient(90deg,#667eea,#764ba2);"></div>' +
                '</div>' +
            '</div>';
        }).join('');
        row.querySelectorAll('.ab-goal-card').forEach(function (card) {
            var badgeId = card.getAttribute('data-badge');
            if (badgeId) {
                card.addEventListener('click', function () {
                    var badge = allBadges.find(function (b) { return b.Id === badgeId; });
                    if (badge) openChaseModal(badge);
                });
            }
        });
    }

    function doPin(badgeId, pinned) {
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/pin/' + badgeId, 'POST', { Pinned: pinned })
            .then(function (res) {
                pinnedIdsGlobal = {};
                (res && res.Pinned || []).forEach(function (id) { pinnedIdsGlobal[id] = true; });
                applyFilter();
            })
            .catch(function () { });
    }

    function doEquipTitle(badgeId) {
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/title', 'POST', { BadgeId: badgeId })
            .then(function (res) {
                equippedTitleId = (res && res.EquippedTitleBadgeId) || null;
                loadAll();
            })
            .catch(function () { });
    }

    function openChaseModal(badge) {
        var backdrop = document.createElement('div');
        backdrop.className = 'ab-modal-backdrop';
        backdrop.innerHTML =
            '<div class="ab-modal">' +
                '<button type="button" class="ab-modal-close">\u00d7</button>' +
                '<h3 style="margin:0 0 0.25em;">' + escapeHtml(badge.Title) + '</h3>' +
                '<div class="ab-muted" style="font-size:0.85em; margin-bottom:1em;">' + escapeHtml(badge.Description || '') + '</div>' +
                '<div style="margin-bottom:1em; padding:0.6em 0.85em; border-radius:8px; background:rgba(102,126,234,0.1); border:1px solid rgba(102,126,234,0.3);">' +
                    '<div class="ab-muted" style="font-size:0.78em;">' + tr('modal.progress', 'PROGRESS') + '</div>' +
                    '<div style="font-weight:700; font-size:1.1em;">' + (badge.CurrentValue || 0) + ' / ' + (badge.TargetValue || 0) + '</div>' +
                '</div>' +
                '<div class="ab-muted" style="font-size:0.78em; margin-bottom:0.5em;">' + tr('modal.suggested_items', 'SUGGESTED ITEMS TO WATCH') + '</div>' +
                '<div id="abSaChaseList">' + tr('common.loading', 'Loading...') + '</div>' +
            '</div>';
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) { backdrop.remove(); }
        });
        backdrop.querySelector('.ab-modal-close').addEventListener('click', function () { backdrop.remove(); });
        root.appendChild(backdrop);

        fetchJson('Plugins/AchievementBadges/users/' + userId + '/chase/' + badge.Id + '?limit=10').then(function (res) {
            var listBox = backdrop.querySelector('#abSaChaseList');
            if (!listBox) return;
            var items = res && res.Items;
            if (!items || !items.length) {
                listBox.innerHTML = '<div class="ab-muted">' + tr('modal.no_items', 'No items found. This badge may need a metric we can\'t recommend for.') + '</div>';
                return;
            }
            listBox.innerHTML = items.map(function (it) {
                return '<div class="ab-modal-item"><div class="ab-modal-item-name">' + escapeHtml(it.Name || '') + '</div><div class="ab-modal-item-meta">' + (it.Type || '') + (it.Year ? ' · ' + it.Year : '') + (it.RunTimeMinutes ? ' · ' + it.RunTimeMinutes + ' ' + tr('common.min', 'min') : '') + '</div></div>';
            }).join('');
        }).catch(function () {
            var listBox = backdrop.querySelector('#abSaChaseList');
            if (listBox) listBox.innerHTML = '<div class="ab-muted">' + tr('modal.load_failed', 'Failed to load.') + '</div>';
        });
    }

    function applyFeatureFlags(cfg) {
        publicConfigGlobal = cfg || {};
        var privacy = cfg.ForcePrivacyMode || cfg.forcePrivacyMode || false;

        // Individual kill switches. Leaderboard/Compare/Prestige are fully hidden under privacy.
        // Quests and Activity stay visible but scope to the current user only.
        var lbOff = privacy || cfg.LeaderboardEnabled === false || cfg.leaderboardEnabled === false;
        var compareOff = privacy || cfg.CompareEnabled === false || cfg.compareEnabled === false;
        var activityOff = cfg.ActivityFeedEnabled === false || cfg.activityFeedEnabled === false;
        var questsOff = cfg.QuestsEnabled === false || cfg.questsEnabled === false;
        var prestigeOff = privacy || cfg.PrestigeEnabled === false || cfg.prestigeEnabled === false;

        // Hide/show tab buttons
        var tabMap = {
            abSaTabLb: lbOff,
            abSaTabCompare: compareOff,
            abSaTabActivity: activityOff,
            abSaTabQuests: questsOff
        };
        var hiddenTabs = {};
        for (var tabId in tabMap) {
            var tabEl = el(tabId);
            if (tabEl) {
                tabEl.style.display = tabMap[tabId] ? 'none' : '';
            }
            if (tabMap[tabId]) hiddenTabs[tabId] = true;
        }

        // If current active tab is now hidden, switch to My Badges
        var activeTab = root ? root.querySelector('.ab-tab.active') : null;
        if (activeTab && activeTab.id && hiddenTabs[activeTab.id]) {
            setTab('badges');
        }

        // Hide server stats section on the Stats tab when ForcePrivacyMode is on
        var serverStatsEl = el('abSaServerStats');
        if (serverStatsEl) {
            // Hide both the heading and the content div
            serverStatsEl.style.display = privacy ? 'none' : '';
            // Also hide the h3 heading before it
            if (serverStatsEl.previousElementSibling && serverStatsEl.previousElementSibling.tagName === 'H3') {
                serverStatsEl.previousElementSibling.style.display = privacy ? 'none' : '';
            }
        }

        // Hide prestige leaderboard section when prestige is disabled or privacy mode
        var prestigeLbEl = el('abSaPrestigeLb');
        if (prestigeLbEl) {
            prestigeLbEl.style.display = prestigeOff ? 'none' : '';
            if (prestigeLbEl.previousElementSibling && prestigeLbEl.previousElementSibling.tagName === 'H3') {
                prestigeLbEl.previousElementSibling.style.display = prestigeOff ? 'none' : '';
            }
        }

        // Hide the activity user filter dropdown when privacy mode is on, and force
        // the feed to the current user only. Also rename the heading to "Your activity".
        var activityUserFilter = el('abSaActivityUserFilter');
        if (activityUserFilter && privacy) {
            activityUserFilter.style.display = 'none';
        }
        var activityHeading = el('abSaActivityHeading');
        if (activityHeading) {
            activityHeading.textContent = privacy ? tr('activity.your_activity', 'Your activity') : tr('activity.server_feed', 'Server activity feed');
        }
        if (privacy && userId) {
            activityFilter = userId;
        }

        // Admin force-override for the equipped-badge showcase UI on this page.
        // Per-user preference is applied separately (below, once prefsData is
        // loaded). When the admin has force-hidden, we hide regardless.
        if (cfg.ForceHideEquippedShowcase || cfg.forceHideEquippedShowcase) {
            var wrap1 = el('abSaShowcaseWrap'); if (wrap1) wrap1.style.display = 'none';
            var wrap2 = el('abSaEquippedWrap'); if (wrap2) wrap2.style.display = 'none';
        }
    }

    // Apply per-user showcase preference (called from loadAll once prefs load).
    function applyShowcasePreference(prefs) {
        var pc = publicConfigGlobal || {};
        if (pc.ForceHideEquippedShowcase || pc.forceHideEquippedShowcase) return; // admin wins
        var show = prefs ? (prefs.ShowEquippedShowcase !== false) : true;
        var wrap1 = el('abSaShowcaseWrap'); if (wrap1) wrap1.style.display = show ? '' : 'none';
        var wrap2 = el('abSaEquippedWrap'); if (wrap2) wrap2.style.display = show ? '' : 'none';
        // Broadcast so sidebar.js can live-update its sidebar pills / header
        // dots without waiting for the next hard refresh.
        try {
            window.dispatchEvent(new CustomEvent('ab:showcase-pref-changed', { detail: { show: show } }));
        } catch (e) {}
    }

    function loadAll() {
        if (!userId) { showError(tr('error.no_user_short', 'Could not detect user.')); return Promise.resolve(); }
        var eqIds = {};
        // fire login ping (safe even if it fails)
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/login-ping', 'POST').catch(function () {});
        // v2.0: pull current cosmetic equip state so the equipped Badge Frame
        // class + custom Rank Title are available by the time renderEquipped
        // and the rank-label code path run below. Best-effort — if it fails
        // the page still renders with the auto rank name and default frame.
        loadV2Cosmetics().then(function () { try { reapplyV2Visuals(); } catch (e) {} });

        // Fetch server-wide rarity stats in parallel. Not gated on the main
        // Promise.all — if it fails or is slow the rest of the UI still
        // renders, rarityPctMap just stays empty and badge cards omit the
        // rarity chip.
        fetchJson('Plugins/AchievementBadges/badges/rarity-stats').then(function (map) {
            if (map && typeof map === 'object') {
                rarityPctMap = map;
                // Re-apply the current filter so already-rendered cards pick
                // up the rarity chip on the next filter pass (cheap).
                try { applyFilter(); } catch (e) {}
            }
        }).catch(function () {});

        // Resolve effective language: user preference wins ("default" means
        // fall back to admin-configured DefaultLanguage from public-config).
        // We kick this off early but don't block other requests on it.
        Promise.all([
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/preferences').catch(function () { return null; }),
            fetchJson('Plugins/AchievementBadges/public-config').catch(function () { return null; })
        ]).then(function (parts) {
            var p = parts[0] || {};
            var cfg = parts[1] || {};
            var userLang = (p.Language || p.language || 'default').toString().toLowerCase();
            var adminLang = (cfg.DefaultLanguage || cfg.defaultLanguage || 'en').toString().toLowerCase();
            var effective = (userLang === 'default' || !userLang) ? adminLang : userLang;
            return loadTranslations(effective).then(function () {
                applyStaticTranslations();
                try { syncRevampSectionLabel(); } catch (e) {}
            });
        }).catch(function () {});

        // Fetch and show welcome message if configured, and apply feature-flag tab hiding
        fetchJson('Plugins/AchievementBadges/public-config').then(function (cfg) {
            var banner = el('abSaWelcomeBanner');
            if (banner && cfg && cfg.WelcomeMessage) {
                banner.textContent = cfg.WelcomeMessage;
                banner.style.display = 'block';
            } else if (banner && cfg && cfg.welcomeMessage) {
                banner.textContent = cfg.welcomeMessage;
                banner.style.display = 'block';
            } else if (banner) {
                banner.style.display = 'none';
            }
            if (cfg) applyFeatureFlags(cfg);
        }).catch(function () {});

        return Promise.all([
            // Every fetch now has its own .catch so a single 401/429/500 on
            // one endpoint can never leave the UI stuck on "Loading..."
            // (previously a rate-limit on /users/{id} would reject the whole
            // Promise.all and the hero subtitle / stats / equipped sections
            // would never render).
            fetchJson('Plugins/AchievementBadges/users/' + userId).catch(function () { return []; }),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/summary').catch(function () { return null; }),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/equipped').catch(function () { return []; }),
            fetchJson('Plugins/AchievementBadges/leaderboard?limit=10').catch(function () { return []; }),
            fetchJson('Plugins/AchievementBadges/server/stats').catch(function () { return null; }),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/rank').catch(function () { return null; }),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/title').catch(function () { return null; }),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/bank').catch(function () { return null; }),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/badge-eta').catch(function () { return null; }),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/streak-calendar?weeks=53').catch(function () { return null; }),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/preferences').catch(function () { return null; })
        ]).then(function (results) {
            var badges = results[0], summary = results[1], equipped = results[2], lb = results[3], stats = results[4], rank = results[5];
            var titleData = results[6], bankData = results[7], etaData = results[8], streakData = results[9], prefsData = results[10];

            badgeEtaMap = {};
            if (etaData && etaData.Etas) {
                etaData.Etas.forEach(function (e) { badgeEtaMap[e.BadgeId] = e; });
            }

            // Hero streak chip
            var heroStreakEl = el('abSaHeroStreak');
            if (heroStreakEl && streakData && streakData.CurrentStreak > 0) {
                heroStreakEl.style.display = 'inline-flex';
                heroStreakEl.innerHTML = '\ud83d\udd25 ' + streakData.CurrentStreak + ' ' + tr('achievements.day_streak', 'day streak');
            } else if (heroStreakEl) {
                heroStreakEl.style.display = 'none';
            }

            // Title display under hero name
            equippedTitleId = null;
            if (titleData && titleData.Title) {
                equippedTitleId = badges.find(function (b) { return b.Title === titleData.Title; })
                    ? badges.find(function (b) { return b.Title === titleData.Title; }).Id : null;
                var titleEl = el('abSaTitleDisplay');
                if (titleEl) {
                    titleEl.style.display = 'block';
                    titleEl.innerHTML = '<span class="material-icons" style="font-size:0.9em;vertical-align:middle;">military_tech</span> ' + escapeHtml(titleData.Title);
                    titleEl.className = 'ab-title-display ' + rarityClass(titleData.Rarity);
                }
            } else {
                var titleEl2 = el('abSaTitleDisplay');
                if (titleEl2) titleEl2.style.display = 'none';
            }

            // Pinned badges
            pinnedIdsGlobal = {};
            if (bankData && bankData.PinnedBadgeIds) {
                bankData.PinnedBadgeIds.forEach(function (id) { pinnedIdsGlobal[id] = true; });
            }
            renderPinnedRow(badges);

            var sub = el('abSaSub');
            if (sub) sub.textContent = tr('achievements.completion', 'Completion') + ': ' + ((summary && summary.Percentage != null) ? summary.Percentage : 0) + '% \u2022 ' + tr('achievements.score', 'Score') + ': ' + (summary ? (summary.Score || 0) : 0);
            var u = el('abSaUnlocked'); if (u) u.textContent = summary ? summary.Unlocked : 0;
            var t = el('abSaTotal'); if (t) t.textContent = summary ? summary.Total : 0;
            var p = el('abSaPct'); if (p) p.textContent = (summary && typeof summary.Percentage === 'number' ? summary.Percentage.toFixed(1) : '0') + '%';
            var sc = el('abSaScore'); if (sc) sc.textContent = summary ? (summary.Score || 0) : 0;

            /* v1.8.52: drive the Revamp hero arc + count-up KPIs.
               Only effective when Revamp is active (the arc is display:none in
               Classic and the count-up is purely cosmetic). */
            try { updateHeroArc(summary); } catch (e) {}
            try { countUpStandaloneStats(); } catch (e) {}

            if (rank && rank.Tier) {
                applyThemeForTier(rank.Tier.Name);
                var lbl = el('abSaRankLabel');
                if (lbl) {
                    // v2.0: equipped Rank Title cosmetic overrides the
                    // auto-generated tier name. Renders as a clean inline pill
                    // with a star icon prefix and a gold gradient — feels like
                    // an earned title without taking 3 lines of vertical space.
                    var color = rank.Tier.Color || '#a3b5f7';
                    // Translate the auto rank tier name via the existing
                    // rank.* keys ("rank.connoisseur", etc). Falls back to
                    // the English name from the server if no translation.
                    var tierLabel = tr('rank.' + (rank.Tier.Name || '').toLowerCase(), rank.Tier.Name);
                    lbl.dataset.abTier = tierLabel || '';
                    if (v2EquippedTitleName) {
                        lbl.innerHTML =
                            '<span style="display:inline-flex; align-items:center; gap:0.4em;">' +
                                '<span style="color:#fcd34d; font-size:0.85em;">&#9733;</span>' +
                                '<span style="font-family:\'Cinzel\',\'Trajan Pro\',Georgia,serif; font-style:italic; font-weight:700; letter-spacing:0.03em; background:linear-gradient(135deg,#fcd34d 0%,#f59e0b 50%,#fde68a 100%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;">' + escapeHtml(v2EquippedTitleName) + '</span>' +
                                '<span class="ab-muted" style="font-size:0.65em; font-weight:500; opacity:0.55; margin-left:0.1em;">&middot; ' + escapeHtml(tierLabel) + '</span>' +
                            '</span>';
                        lbl.style.color = '';
                    } else {
                        lbl.textContent = tierLabel;
                        lbl.style.color = color;
                    }
                }
                var fill = el('abSaRankBarFill');
                if (fill) {
                    fill.style.width = (rank.ProgressToNext || 0) + '%';
                    fill.style.background = (rank.Tier.Color || '#667eea');
                }
                var pct = el('abSaRankBarPct');
                if (pct) {
                    if (rank.NextTier) {
                        var nextTierLabel = tr('rank.' + (rank.NextTier.Name || '').toLowerCase(), rank.NextTier.Name);
                        pct.textContent = rank.Score + ' / ' + rank.NextTier.MinScore + ' ' + tr('achievements.to_next', 'to') + ' ' + nextTierLabel;
                    } else {
                        pct.textContent = tr('achievements.max_rank', 'Max rank');
                    }
                }
            }

            var cardLink = el('abSaProfileCardLink');
            if (cardLink) cardLink.href = buildUrl('Plugins/AchievementBadges/users/' + userId + '/profile-card');

            allBadges = badges || [];

            // Populate category dropdown (only once)
            var catSel = el('abSaCategoryFilter');
            if (catSel && catSel.options.length <= 1) {
                var cats = {};
                allBadges.forEach(function (b) { if (b.Category) cats[b.Category] = true; });
                Object.keys(cats).sort().forEach(function (c) {
                    var opt = document.createElement('option');
                    // Keep the filter value as the canonical English category
                    // name (that's what the server sends back on each badge),
                    // but show the localised label to the user.
                    opt.value = c; opt.textContent = trCategory(c);
                    catSel.appendChild(opt);
                });
            }

            renderShowcase(equipped);
            renderEquipped(equipped);
            if (equipped) equipped.forEach(function (b) { eqIds[b.Id] = true; });
            equippedIdsGlobal = eqIds;
            applyFilter();
            applyAchievementRouteTarget();

            var lbBox = el('abSaLb');
            if (lbBox) {
                if (!lb || !lb.length) { lbBox.innerHTML = '<div class="ab-muted">' + tr('lb.no_data', 'No data yet.') + '</div>'; }
                else {
                    lbBox.innerHTML = lb.map(function (e, i) {
                        return '<div class="ab-lb-row"><div><strong>#' + (i + 1) + '</strong> \u2022 ' + escapeHtml(e.UserName || e.UserId) + renderEquippedDots(e.Equipped, 18) + '</div><div>' + (e.Score || 0) + ' ' + tr('badge.pts_label', 'pts') + ' \u2022 ' + e.Unlocked + ' ' + tr('lb.unlocked_suffix', 'unlocked') + '</div></div>';
                    }).join('');
                }
            }

            // Apply saved theme preference on every loadAll (fixes theme not persisting)
            if (prefsData) {
                var savedTheme = prefsData.achievementPageTheme || prefsData.AchievementPageTheme || 'default';
                applyPageTheme(savedTheme);
            }

            // Apply the per-user "show equipped showcase" preference (admin
            // force-hide has already been applied in applyFeatureFlags).
            applyShowcasePreference(prefsData);

            var stBox = el('abSaServerStats');
            if (stBox && stats) {
                stBox.innerHTML =
                    '<div class="ab-server-grid">' +
                        '<div class="ab-server-card"><div class="ab-server-icon">👥</div><div class="ab-server-num">' + (stats.TotalUsers || 0) + '</div><div class="ab-server-label">' + tr('stats.server.users', 'Users') + '</div></div>' +
                        '<div class="ab-server-card"><div class="ab-server-icon">🏆</div><div class="ab-server-num">' + (stats.TotalBadgesUnlocked || 0) + '</div><div class="ab-server-label">' + tr('stats.server.badges_unlocked', 'Badges unlocked') + '</div></div>' +
                        '<div class="ab-server-card"><div class="ab-server-icon">📽️</div><div class="ab-server-num">' + (stats.TotalItemsWatched || 0) + '</div><div class="ab-server-label">' + tr('stats.server.items_watched', 'Items watched') + '</div></div>' +
                        '<div class="ab-server-card"><div class="ab-server-icon">🎬</div><div class="ab-server-num">' + (stats.TotalMoviesWatched || 0) + '</div><div class="ab-server-label">' + tr('stats.server.movies', 'Movies') + '</div></div>' +
                        '<div class="ab-server-card"><div class="ab-server-icon">📺</div><div class="ab-server-num">' + (stats.TotalSeriesCompleted || 0) + '</div><div class="ab-server-label">' + tr('stats.server.series_completed', 'Series completed') + '</div></div>' +
                        '<div class="ab-server-card ab-server-wide"><div class="ab-server-icon">⭐</div><div class="ab-server-num" style="font-size:1.2em;">' + escapeHtml(stats.MostCommonBadge || tr('stats.server.none', 'None')) + '</div><div class="ab-server-label">' + tr('stats.server.most_common_badge', 'Most common badge') + '</div></div>' +
                    '</div>';
            }
        }).catch(function (err) {
            showError(tr('error.load_failed', 'Failed to load achievements.') + ' ' + (err && err.message ? err.message : String(err)));
        });
    }

    function doEquip(badgeId) {
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/equipped/' + badgeId, 'POST').then(function () { return loadAll(); }).catch(function (e) { showError(tr('error.equip_failed', 'Failed to equip.') + ' ' + e.message); });
    }

    function doUnequip(badgeId) {
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/equipped/' + badgeId, 'DELETE').then(function () { return loadAll(); }).catch(function (e) { showError(tr('error.unequip_failed', 'Failed to unequip.') + ' ' + e.message); });
    }

    /* v1.8.47: Classic/Revamp wiring for the standalone main page.
       Reads / writes the same `ab-style-pref` localStorage key as the admin
       page so a single toggle decision propagates everywhere.
       When `revamp` is active we inject styles-revamp.css into <head> and
       mark the root with `data-ab-style="revamp"`; in `classic` we strip
       both. The button label + aria-pressed reflect current state. */
    var STYLE_PREF_KEY = 'ab-style-pref';
    var REVAMP_LINK_ID = 'abSaRevampCss';
    // v1.9.0: version-only cache bust (see index.html for full rationale).
    var REVAMP_CSS_BUST = 'v=1.9.2';
    /* [issue #43] The admin's DefaultUiStyle / ForceDefaultUiStyle come from
       public-config, which is a fetch, but sidebar.js has to pick a style
       synchronously on every page load or the page flashes the wrong one.
       So the two values are mirrored into localStorage whenever public-config
       lands, and both scripts read the mirror. A change by the admin reaches a
       given browser on its next load, which is the same freshness the language
       default already has. */
    var ADMIN_STYLE_KEY = 'ab-style-admin-default';
    var ADMIN_FORCE_KEY = 'ab-style-admin-forced';
    function getAdminStyleDefault() {
        try { return localStorage.getItem(ADMIN_STYLE_KEY) === 'revamp' ? 'revamp' : 'classic'; }
        catch (e) { return 'classic'; }
    }
    function isStyleForced() {
        try { return localStorage.getItem(ADMIN_FORCE_KEY) === '1'; }
        catch (e) { return false; }
    }
    function cacheAdminStyle(cfg) {
        if (!cfg) return;
        try {
            var d = (cfg.DefaultUiStyle || cfg.defaultUiStyle) === 'revamp' ? 'revamp' : 'classic';
            var f = (cfg.ForceDefaultUiStyle || cfg.forceDefaultUiStyle) ? '1' : '0';
            localStorage.setItem(ADMIN_STYLE_KEY, d);
            localStorage.setItem(ADMIN_FORCE_KEY, f);
        } catch (e) { /* private mode etc. */ }
    }
    function getStylePref() {
        // Forced wins outright. The user's own choice is deliberately left in
        // place rather than overwritten, so it comes back if the admin turns
        // the lock off again.
        if (isStyleForced()) return getAdminStyleDefault();
        try {
            var own = localStorage.getItem(STYLE_PREF_KEY);
            if (own === 'revamp' || own === 'classic') return own;
        } catch (e) { return 'classic'; }
        return getAdminStyleDefault();
    }
    function setStylePref(p) {
        try { localStorage.setItem(STYLE_PREF_KEY, p); } catch (e) { /* private mode etc. */ }
    }
    function ensureRevampCss() {
        if (document.getElementById(REVAMP_LINK_ID)) return;
        var l = document.createElement('link');
        l.id = REVAMP_LINK_ID;
        l.rel = 'stylesheet';
        /* v1.8.48 fix: use buildUrl() so the URL resolves against the
           Jellyfin API root (e.g. https://server/Plugins/...) regardless
           of the current page route. The previous relative URL resolved
           against /web/index.html and 404'd silently. */
        l.href = buildUrl('Plugins/AchievementBadges/client-script/styles-revamp') + '?' + REVAMP_CSS_BUST;
        document.head.appendChild(l);
    }
    function removeRevampCss() {
        var l = document.getElementById(REVAMP_LINK_ID);
        if (l && l.parentNode) l.parentNode.removeChild(l);
    }
    /* v1.8.52: drive the Revamp hero arc.
       The SVG ships with stroke-dashoffset=circumference (empty ring) and a
       CSS variable --rv-arc-off carrying the eventual target. The CSS animation
       in styles-revamp.css interpolates from the SVG attribute (full) to the
       variable (target) over ~1.1s with cubic ease-out. */
    function updateHeroArc(summary) {
        if (!root) return;
        var pctVal = (summary && typeof summary.Percentage === 'number') ? summary.Percentage : 0;
        var fill = root.querySelector('.abSaHeroArcFill');
        if (fill) {
            var c = 540.35; // 2π × 86
            var off = c - (c * pctVal / 100);
            fill.style.setProperty('--rv-arc-off', off.toFixed(2));
            fill.setAttribute('stroke-dashoffset', off.toFixed(2));
        }
        var lbl = root.querySelector('#abSaHeroArcPct');
        if (lbl) lbl.textContent = pctVal.toFixed(1).replace(/\.0$/, '') + '%';
    }

    /* v1.8.52: count-up animator for the four stat numerals on the standalone
       page. Mirrors the admin v1.8.46 animator. easeOutCubic over 700ms;
       skipped on prefers-reduced-motion; cancels in-flight tweens via dataset. */
    function countUpStandaloneStats() {
        if (!root) return;
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var cells = [
            { id: 'abSaUnlocked', suffix: '' },
            { id: 'abSaTotal',    suffix: '' },
            { id: 'abSaPct',      suffix: '%' },
            { id: 'abSaScore',    suffix: '' }
        ];
        cells.forEach(function (cell) {
            var elNode = el(cell.id);
            if (!elNode) return;
            var raw = (elNode.textContent || '').replace(/%$/, '').trim();
            var target = parseFloat(raw);
            if (!isFinite(target)) return;
            var prev = elNode.dataset.abAnim;
            if (prev) cancelAnimationFrame(parseInt(prev, 10));
            if (reduce) { elNode.textContent = (Number.isInteger(target) ? String(target) : target.toFixed(1)) + cell.suffix; return; }
            var isInt = Number.isInteger(target);
            var dur = 700;
            var begin = null;
            function step(t) {
                if (begin === null) begin = t;
                var p = Math.min(1, (t - begin) / dur);
                var eased = 1 - Math.pow(1 - p, 3);
                var v = target * eased;
                elNode.textContent = (isInt ? String(Math.round(v)) : v.toFixed(1)) + cell.suffix;
                if (p < 1) {
                    elNode.dataset.abAnim = String(requestAnimationFrame(step));
                } else {
                    elNode.textContent = (isInt ? String(target) : target.toFixed(1)) + cell.suffix;
                    delete elNode.dataset.abAnim;
                }
            }
            elNode.textContent = '0' + cell.suffix;
            elNode.dataset.abAnim = String(requestAnimationFrame(step));
        });
    }

    function applyStylePref(pref) {
        if (!root) return;
        if (pref === 'revamp') {
            root.setAttribute('data-ab-style', 'revamp');
            ensureRevampCss();
        } else {
            root.removeAttribute('data-ab-style');
            removeRevampCss();
        }
        /* v1.8.54: also propagate the pref to <body> so global widgets
           mounted outside the standalone root (the Friends drawer in
           sidebar.js, the floating toggle button, etc.) can scope their
           own Revamp styles via body[data-ab-style="revamp"]. */
        try {
            if (pref === 'revamp') {
                document.body.setAttribute('data-ab-style', 'revamp');
            } else {
                document.body.removeAttribute('data-ab-style');
            }
        } catch (e) { /* document.body unavailable extremely early — ignore */ }
        var btn = el('abSaStyleToggleBtn');
        if (btn) {
            // [issue #43] With the admin lock on there is nothing to toggle,
            // so the control goes away rather than sitting there doing nothing.
            // Hidden, not disabled: a dead button invites clicking.
            btn.hidden = isStyleForced();
            // Update the data-i18n key so applyStaticTranslations picks up
            // the correct one on next pass; also set textContent immediately
            // so the user sees the change without waiting for a translations
            // reload.
            var key = pref === 'revamp' ? 'ui.toggle.revamp' : 'ui.toggle.classic';
            btn.setAttribute('data-i18n', key);
            btn.textContent = tr(key, pref === 'revamp' ? 'UI: Revamp' : 'UI: Classic');
            btn.setAttribute('aria-pressed', pref === 'revamp' ? 'true' : 'false');
        }
    }

    function getPublicConfig() {
        if (publicConfigPromise) return publicConfigPromise;
        publicConfigPromise = fetchJson('Plugins/AchievementBadges/public-config').then(function (cfg) {
            publicConfigGlobal = cfg || {};
            // [issue #43] Refresh the mirror sidebar.js reads synchronously.
            try { cacheAdminStyle(publicConfigGlobal); } catch (e) {}
            try { applyStylePref(getStylePref()); } catch (e) {}
            return publicConfigGlobal;
        }).catch(function () {
            publicConfigPromise = null;
            return publicConfigGlobal || {};
        });
        return publicConfigPromise;
    }

    function navigationPreferenceEnabled(prefs, pascalName, camelName) {
        prefs = prefs || {};
        return prefs[pascalName] !== false && prefs[camelName] !== false;
    }

    function getNavigationPreferences(forceRefresh) {
        if (forceRefresh) {
            navigationPreferencesPromise = null;
            navigationPreferencesUserId = '';
        }
        if (navigationPreferencesPromise) return navigationPreferencesPromise;
        navigationPreferencesPromise = getCurrentUserId().then(function (id) {
            if (!id) return {};
            if (!forceRefresh && navigationPreferencesUserId === id && navigationPreferencesGlobal) {
                return navigationPreferencesGlobal;
            }
            return fetchJson('Plugins/AchievementBadges/users/' + id + '/preferences').then(function (prefs) {
                navigationPreferencesUserId = id;
                navigationPreferencesGlobal = prefs || {};
                return navigationPreferencesGlobal;
            });
        }).catch(function () {
            return navigationPreferencesGlobal || {};
        }).then(function (prefs) {
            return prefs || {};
        });
        return navigationPreferencesPromise;
    }

    function isNativeUserSettingsRoute() {
        return (window.location.hash || '').toLowerCase().indexOf('/mypreferencesmenu') !== -1;
    }

    function findNativeUserSettingsHost() {
        var page = document.getElementById('myPreferencesMenuPage');
        if (!page || !page.isConnected || page.offsetParent === null) return null;
        var content = page.querySelector('.readOnlyContent');
        if (!content) return null;
        return {
            content: content,
            insertAfter: content.querySelector('.verticalSection')
        };
    }

    function setNativeNavigationSettingsStatus(message, isError) {
        var status = document.getElementById('abNavigationPreferencesStatus');
        if (!status) return;
        status.textContent = message || '';
        status.style.color = isError ? '#ff8a80' : 'var(--primary-accent-color, #00a4dc)';
    }

    function saveNativeNavigationPreference(input) {
        if (!input) return;
        var camelName = input.getAttribute('data-ab-navigation-preference') || '';
        if (!camelName) return;
        var pascalName = toPascalCase(camelName);
        var requestedValue = input.checked;
        var previousValue = !requestedValue;
        input.disabled = true;
        setNativeNavigationSettingsStatus('', false);

        getCurrentUserId().then(function (id) {
            if (!id) throw new Error('No current user');
            return fetchJson('Plugins/AchievementBadges/users/' + id + '/preferences').then(function (existing) {
                var payload = existing || {};
                delete payload[camelName];
                delete payload[pascalName];
                payload[pascalName] = requestedValue;
                return fetchJson('Plugins/AchievementBadges/users/' + id + '/preferences', 'POST', payload).then(function () {
                    navigationPreferencesUserId = id;
                    navigationPreferencesGlobal = payload;
                    navigationPreferencesPromise = Promise.resolve(payload);
                    try { window.dispatchEvent(new CustomEvent('ab:navigation-preferences-changed')); } catch (e) {}
                    setNativeNavigationSettingsStatus(tr('settings.saved', 'Settings saved.'), false);
                });
            });
        }).catch(function () {
            input.checked = previousValue;
            setNativeNavigationSettingsStatus(tr('settings.save_failed', 'Failed to save settings.'), true);
        }).then(function () {
            input.disabled = false;
        });
    }

    function renderNativeNavigationSettings(host, prefs) {
        if (!host || !host.content || !isNativeUserSettingsRoute()) return;
        var existing = document.getElementById('abNavigationPreferencesUserSettings');
        if (existing) return;

        var section = document.createElement('div');
        section.id = 'abNavigationPreferencesUserSettings';
        section.className = 'verticalSection verticalSection-extrabottompadding';
        section.setAttribute('data-achievement-badges-owned', 'navigation-settings');
        section.innerHTML =
            '<style>' +
                '#abNavigationPreferencesUserSettings .ab-native-nav-description{margin:.25em .25em 1em;opacity:.72;line-height:1.45;}' +
                '#abNavigationPreferencesUserSettings .ab-native-nav-row{display:flex;align-items:center;gap:1em;padding:.85em .5em;cursor:pointer;}' +
                '#abNavigationPreferencesUserSettings .ab-native-nav-copy{flex:1;min-width:0;}' +
                '#abNavigationPreferencesUserSettings .ab-native-nav-title{font-size:1em;line-height:1.35;}' +
                '#abNavigationPreferencesUserSettings .ab-native-nav-detail{font-size:.86em;line-height:1.4;opacity:.65;margin-top:.15em;}' +
                '#abNavigationPreferencesUserSettings .ab-native-nav-checkbox{width:1.35em;height:1.35em;flex:0 0 auto;accent-color:var(--primary-accent-color,#00a4dc);cursor:pointer;}' +
                '#abNavigationPreferencesStatus{min-height:1.4em;margin:.5em .25em 0;font-size:.86em;}' +
            '</style>' +
            '<h2 class="sectionTitle headerUsername" style="padding-left:.25em;">' + escapeHtml(tr('achievements.title', 'Achievements')) + '</h2>' +
            '<div class="ab-native-nav-description">' + escapeHtml(tr('settings.navigation_integrations_desc', 'Choose where Achievements appears for your account. Server administrators control which integrations are available.')) + '</div>' +
            nativeNavigationPreferenceRow('showCustomTabsEntry', tr('settings.show_custom_tabs_entry', 'Show Custom Tabs entry'), tr('settings.show_custom_tabs_entry_desc', 'Show Achievements in Jellyfin\'s Home tab bar when the Custom Tabs integration is enabled'), navigationPreferenceEnabled(prefs, 'ShowCustomTabsEntry', 'showCustomTabsEntry')) +
            nativeNavigationPreferenceRow('showPluginPagesEntry', tr('settings.show_plugin_pages_entry', 'Show Plugin Pages entry'), tr('settings.show_plugin_pages_entry_desc', 'Show Achievements in the Plugin Pages navigation when that integration is enabled'), navigationPreferenceEnabled(prefs, 'ShowPluginPagesEntry', 'showPluginPagesEntry')) +
            nativeNavigationPreferenceRow('showUserMenuShortcut', tr('settings.show_user_menu_shortcut', 'Show header shortcut'), tr('settings.show_user_menu_shortcut_desc', 'Show the Achievements trophy beside your user/profile control'), navigationPreferenceEnabled(prefs, 'ShowUserMenuShortcut', 'showUserMenuShortcut')) +
            '<div id="abNavigationPreferencesStatus" role="status" aria-live="polite"></div>';

        if (host.insertAfter && host.insertAfter.parentNode === host.content) {
            host.content.insertBefore(section, host.insertAfter.nextSibling);
        } else {
            host.content.appendChild(section);
        }
        section.querySelectorAll('input[data-ab-navigation-preference]').forEach(function (input) {
            input.addEventListener('change', function () { saveNativeNavigationPreference(input); });
        });
    }

    function nativeNavigationPreferenceRow(key, label, description, checked) {
        return '<label class="listItem-border ab-native-nav-row">' +
            '<span class="material-icons listItemIcon listItemIcon-transparent" aria-hidden="true">emoji_events</span>' +
            '<span class="ab-native-nav-copy"><span class="ab-native-nav-title">' + escapeHtml(label) + '</span>' +
            '<span class="ab-native-nav-detail" style="display:block;">' + escapeHtml(description) + '</span></span>' +
            '<input class="ab-native-nav-checkbox" type="checkbox" data-ab-navigation-preference="' + key + '"' + (checked ? ' checked' : '') + '>' +
            '</label>';
    }

    function syncNativeNavigationSettings() {
        if (!isNativeUserSettingsRoute()) return;
        if (document.getElementById('abNavigationPreferencesUserSettings')) return;
        var host = findNativeUserSettingsHost();
        if (!host || nativeNavigationSettingsMountPromise) return;

        nativeNavigationSettingsMountPromise = Promise.all([getPublicConfig(), getNavigationPreferences(false)]).then(function (values) {
            var cfg = values[0] || {};
            var prefs = values[1] || {};
            var chosen = (prefs.Language || prefs.language || 'default').toString().toLowerCase();
            var adminLanguage = (cfg.DefaultLanguage || cfg.defaultLanguage || 'en').toString().toLowerCase();
            var effectiveLanguage = !chosen || chosen === 'default' ? adminLanguage : chosen;
            return loadTranslations(effectiveLanguage).catch(function () { return {}; }).then(function () {
                renderNativeNavigationSettings(findNativeUserSettingsHost(), prefs);
            });
        }).catch(function () {
            renderNativeNavigationSettings(findNativeUserSettingsHost(), navigationPreferencesGlobal || {});
        }).then(function () {
            nativeNavigationSettingsMountPromise = null;
        }, function () {
            nativeNavigationSettingsMountPromise = null;
        });
    }

    function setOwnedElementVisible(node, visible) {
        if (!node) return;
        if (visible) {
            if (node.getAttribute('data-ab-navigation-hidden') === 'true') {
                var previousDisplay = node.getAttribute('data-ab-navigation-display') || '';
                var previousPriority = node.getAttribute('data-ab-navigation-display-priority') || '';
                if (previousDisplay) node.style.setProperty('display', previousDisplay, previousPriority);
                else node.style.removeProperty('display');
                node.removeAttribute('hidden');
                node.removeAttribute('aria-hidden');
                node.removeAttribute('data-ab-navigation-hidden');
                node.removeAttribute('data-ab-navigation-display');
                node.removeAttribute('data-ab-navigation-display-priority');
            }
        } else {
            if (node.getAttribute('data-ab-navigation-hidden') !== 'true') {
                node.setAttribute('data-ab-navigation-display', node.style.getPropertyValue('display') || '');
                node.setAttribute('data-ab-navigation-display-priority', node.style.getPropertyPriority('display') || '');
            }
            node.style.setProperty('display', 'none', 'important');
            node.setAttribute('hidden', 'hidden');
            node.setAttribute('aria-hidden', 'true');
            node.setAttribute('data-ab-navigation-hidden', 'true');
        }
    }

    function returnToStockHome() {
        var homeButton = document.querySelector('.emby-tabs-slider .emby-tab-button[data-index="0"], .emby-tabs-slider button[data-index="0"]');
        if (homeButton && typeof homeButton.click === 'function') {
            homeButton.click();
        }
    }

    function applyCustomTabsVisibility(cfg, prefs) {
        var adminEnabled = cfg.EnableCustomTabsIntegration === true || cfg.enableCustomTabsIntegration === true;
        var userEnabled = navigationPreferenceEnabled(prefs, 'ShowCustomTabsEntry', 'showCustomTabsEntry');
        var visible = adminEnabled && userEnabled;
        var markers = document.querySelectorAll('[data-achievement-badges-host="custom-tabs"]');
        for (var i = 0; i < markers.length; i++) {
            var panel = markers[i].closest ? markers[i].closest('[id^="customTab_"]') : markers[i].parentNode;
            if (!panel || !/^customTab_\d+$/.test(panel.id || '')) continue;
            var index = panel.id.substring('customTab_'.length);
            var button = document.getElementById('customTabButton_' + index);
            if (!visible && root && panel.contains(root) && root.style.display !== 'none') returnToStockHome();
            setOwnedElementVisible(button, visible);
            setOwnedElementVisible(panel, visible);
        }
    }

    function applyPluginPagesVisibility(cfg, prefs) {
        var adminEnabled = cfg.EnablePluginPagesIntegration === true || cfg.enablePluginPagesIntegration === true;
        var userEnabled = navigationPreferenceEnabled(prefs, 'ShowPluginPagesEntry', 'showPluginPagesEntry');
        var visible = adminEnabled && userEnabled;
        var links = document.querySelectorAll('a[data-itemid="achievement-badges"], a[href*="pageUrl=/Plugins/AchievementBadges/embedded-page"]');
        for (var i = 0; i < links.length; i++) setOwnedElementVisible(links[i], visible);
    }

    function applyNavigationIntegrationVisibility(cfg, prefs) {
        cfg = cfg || {};
        prefs = prefs || {};
        applyCustomTabsVisibility(cfg, prefs);
        applyPluginPagesVisibility(cfg, prefs);
        injectUserMenuShortcut(cfg, prefs);
    }

    function findIntegrationHost() {
        var hosts = document.querySelectorAll('[data-achievement-badges-host]');
        for (var i = 0; i < hosts.length; i++) {
            if (hosts[i].isConnected && hosts[i].offsetParent !== null) return hosts[i];
        }
        return null;
    }

    function integrationEnabled(host, cfg, prefs) {
        if (!host) return false;
        var kind = (host.getAttribute('data-achievement-badges-host') || '').toLowerCase();
        if (kind === 'custom-tabs') {
            return (cfg.EnableCustomTabsIntegration === true || cfg.enableCustomTabsIntegration === true) &&
                navigationPreferenceEnabled(prefs, 'ShowCustomTabsEntry', 'showCustomTabsEntry');
        }
        if (kind === 'plugin-pages') {
            return (cfg.EnablePluginPagesIntegration === true || cfg.enablePluginPagesIntegration === true) &&
                navigationPreferenceEnabled(prefs, 'ShowPluginPagesEntry', 'showPluginPagesEntry');
        }
        return false;
    }

    function injectUserMenuShortcut(cfg, prefs) {
        var existing = document.getElementById('abUserMenuShortcut');
        var enabled = (cfg.EnableUserMenuShortcut === true || cfg.enableUserMenuShortcut === true) &&
            navigationPreferenceEnabled(prefs, 'ShowUserMenuShortcut', 'showUserMenuShortcut');
        if (!enabled) {
            if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
            return;
        }
        if (existing) return;
        var header = document.querySelector('.headerRight, .headerRightElements, .headerRightContent');
        if (!header) return;
        var link = document.createElement('a');
        link.id = 'abUserMenuShortcut';
        link.className = 'paper-icon-button-light';
        link.href = '#/achievements';
        link.title = tr('achievements.title', 'Achievements');
        link.setAttribute('aria-label', tr('achievements.title', 'Achievements'));
        link.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:3em;height:3em;color:inherit;text-decoration:none;';
        link.innerHTML = '<span class="material-icons" aria-hidden="true">emoji_events</span>';
        var userButton = header.querySelector('.headerUserButton, .btnUserMenu, [data-action="user"]');
        header.insertBefore(link, userButton || null);
    }

    function mountRoute(host) {
        injectStyles();
        var target = host || document.body;
        root = document.getElementById(ROOT_ID);
        if (!root) {
            root = createRoot(!!host);
        } else {
            root = createRoot(!!host);
        }
        if (root.parentNode !== target) target.appendChild(root);
        activeHost = host || null;
        root.style.display = 'block';

        /* v1.8.47: apply the persisted Classic/Revamp preference + wire toggle. */
        applyStylePref(getStylePref());
        var styleBtn = el('abSaStyleToggleBtn');
        if (styleBtn) {
            styleBtn.addEventListener('click', function () {
                // [issue #43] Hiding the button is presentation; this is the
                // actual guard. The handler is wired before public-config has
                // necessarily landed, and a hidden element is still reachable.
                if (isStyleForced()) { applyStylePref(getStylePref()); return; }
                var next = getStylePref() === 'revamp' ? 'classic' : 'revamp';
                setStylePref(next);
                applyStylePref(next);
            });
        }

        el('abSaTabBadges').addEventListener('click', function () { setTab('badges'); });
        el('abSaTabQuests').addEventListener('click', function () { setTab('quests'); });
        el('abSaTabRecap').addEventListener('click', function () { setTab('recap'); });
        el('abSaTabLb').addEventListener('click', function () { setTab('lb'); });
        el('abSaTabCompare').addEventListener('click', function () { setTab('compare'); });
        el('abSaTabActivity').addEventListener('click', function () { setTab('activity'); });
        el('abSaTabWrapped').addEventListener('click', function () { setTab('wrapped'); });
        el('abSaTabStats').addEventListener('click', function () { setTab('stats'); loadStats(); });
        el('abSaTabLoadout').addEventListener('click', function () { setTab('loadout'); });
        el('abSaTabSettings').addEventListener('click', function () { setTab('settings'); });
        setTab('badges');

        // Friends button + drawer now lives in sidebar.js so it's global
        // (visible on every Jellyfin page, not just the achievements tab).

        var search = el('abSaSearch');
        if (search) search.addEventListener('input', function () {
            currentSearch = search.value || '';
            applyFilter();
        });
        var filter = el('abSaFilter');
        if (filter) filter.addEventListener('change', function () {
            currentFilter = filter.value || 'all';
            applyFilter();
        });
        var sortEl = el('abSaSort');
        if (sortEl) sortEl.addEventListener('change', function () {
            currentSort = sortEl.value || 'default';
            applyFilter();
        });
        var catEl = el('abSaCategoryFilter');
        if (catEl) catEl.addEventListener('change', function () {
            currentCategory = catEl.value || '';
            applyFilter();
        });

        // Reduced motion toggle (persists in localStorage, read by enhance.js)
        try {
            var rmKey = 'ab-reduced-motion';
            var rmEl = document.createElement('label');
            rmEl.style.cssText = 'display:flex; align-items:center; gap:0.5em; padding:0.5em 0.85em; border-radius:8px; background:rgba(255,255,255,0.04); font-size:0.85em; cursor:pointer; margin-left:auto;';
            rmEl.innerHTML = '<input type="checkbox"' + (localStorage.getItem(rmKey) === 'true' ? ' checked' : '') + '> ' + tr('filter.reduced_motion', 'Reduced motion');
            var cb = rmEl.querySelector('input');
            cb.addEventListener('change', function () { localStorage.setItem(rmKey, cb.checked ? 'true' : 'false'); });
            var filterRow = root.querySelector('.ab-filter-row');
            if (filterRow) filterRow.appendChild(rmEl);
        } catch (e) { }

        var recapBtns = root.querySelectorAll('#abSaPanelRecap button[data-period]');
        recapBtns.forEach(function (btn) {
            btn.addEventListener('click', function () { loadRecap(btn.getAttribute('data-period')); });
        });

        var lbBtns = root.querySelectorAll('#abSaPanelLb button[data-lb]');
        lbBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                lbBtns.forEach(function (x) { x.classList.remove('active'); });
                btn.classList.add('active');
                loadCategoryLb(btn.getAttribute('data-lb'));
            });
        });

        getCurrentUserId().then(function (id) {
            userId = id;
            if (!id) { showError(tr('error.no_user', 'Could not detect your user account. Please log in.')); return; }
            return loadAll();
        }).then(function () {
            // v2.0 one-time welcome hint pointing at the new Loadout tab.
            // Idempotent: shows once per browser via localStorage flag,
            // dismissable or auto-clears after 30s.
            try { showV2WelcomeHint(); } catch (e) { /* swallow */ }
        });
    }

    function showV2WelcomeHint() {
        if (!root) return;
        try { if (localStorage.getItem('ab-v2-tour-seen') === '1') return; } catch (e) { return; }
        // Don't double-show if already mounted
        if (document.getElementById('abSaV2Welcome')) return;

        var toast = document.createElement('div');
        toast.id = 'abSaV2Welcome';
        toast.innerHTML =
            '<button type="button" class="ab-v2-welcome-close" id="abSaV2DismissWelcome" aria-label="Dismiss">&times;</button>' +
            '<div class="ab-v2-welcome-row">' +
                '<div class="ab-v2-welcome-icon">🎮</div>' +
                '<div class="ab-v2-welcome-body">' +
                    '<div class="ab-v2-welcome-eyebrow">' + tr('v2.welcome.eyebrow', 'NEW IN v2.0') + '</div>' +
                    '<div class="ab-v2-welcome-title">' + tr('v2.welcome.title', 'Choose Your Loadout') + '</div>' +
                    '<div class="ab-v2-welcome-desc">' + tr('v2.welcome.desc', 'Earn score by watching, spend it in the Shop on power-ups, themes, avatars + more. Open the Loadout tab to start.') + '</div>' +
                    '<button type="button" class="ab-v2-welcome-cta" id="abSaV2OpenLoadout">' + tr('v2.welcome.cta', 'Open Loadout') + '</button>' +
                '</div>' +
            '</div>';
        root.appendChild(toast);

        function dismiss() {
            try { localStorage.setItem('ab-v2-tour-seen', '1'); } catch (e) {}
            toast.classList.add('ab-v2-welcome-out');
            setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 250);
        }
        var dismissBtn = document.getElementById('abSaV2DismissWelcome');
        if (dismissBtn) dismissBtn.addEventListener('click', dismiss);
        var ctaBtn = document.getElementById('abSaV2OpenLoadout');
        if (ctaBtn) ctaBtn.addEventListener('click', function () {
            try { setTab('loadout'); } catch (e) {}
            dismiss();
        });
        // Auto-clear after 30s so it doesn't sit forever
        setTimeout(function () { if (toast.parentNode) dismiss(); }, 30000);
    }

    function unmountRoute() {
        var r = document.getElementById(ROOT_ID);
        if (r) r.style.display = 'none';
        activeHost = null;
    }

    function isAchievementsRoute() {
        var hash = window.location.hash || '';
        return hash.indexOf(ROUTE_MATCH) !== -1;
    }

    function routeAlreadyMounted(host) {
        var mountedRoot = document.getElementById(ROOT_ID);
        var target = host || document.body;
        return !!mountedRoot && mountedRoot.style.display !== 'none' &&
            mountedRoot.parentNode === target && activeHost === (host || null);
    }

    function onRouteChange() {
        syncNativeNavigationSettings();
        if (isAchievementsRoute()) {
            if (routeAlreadyMounted(null)) {
                applyAchievementRouteTarget();
                return;
            }
            mountRoute();
            return;
        }
        var host = findIntegrationHost();
        if (!host) { unmountRoute(); return; }
        Promise.all([getPublicConfig(), getNavigationPreferences(false)]).then(function (values) {
            var cfg = values[0] || {};
            var prefs = values[1] || {};
            applyNavigationIntegrationVisibility(cfg, prefs);
            if (isAchievementsRoute()) {
                if (!routeAlreadyMounted(null)) mountRoute();
                return;
            }
            var currentHost = findIntegrationHost();
            if (currentHost && integrationEnabled(currentHost, cfg, prefs)) {
                if (!routeAlreadyMounted(currentHost)) mountRoute(currentHost);
            }
            else unmountRoute();
        });
    }

    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);

    // v2.0 defensive: some host themes / SPA shells can hide our overlay
    // (or fail to fire hashchange when they swap routes), leaving Jellyfin's
    // "Page not found" view visible while the URL still contains /achievements.
    // Re-check periodically and force-mount when we should be on-route but
    // aren't. Cheap (every 1.5s, only does work if the route state mismatches).
    setInterval(function () {
        try {
            var r = document.getElementById(ROOT_ID);
            if (isAchievementsRoute()) {
                if (!r || r.style.display === 'none' || r.parentNode !== document.body) onRouteChange();
            } else {
                var host = findIntegrationHost();
                var shouldMount = host && integrationEnabled(host, publicConfigGlobal || {}, navigationPreferencesGlobal || {});
                if (shouldMount && (!r || r.style.display === 'none' || r.parentNode !== host || activeHost !== host)) onRouteChange();
                if (!shouldMount && r && r.style.display !== 'none') unmountRoute();
            }
            applyNavigationIntegrationVisibility(publicConfigGlobal || {}, navigationPreferencesGlobal || {});
            syncNativeNavigationSettings();
        } catch (e) { /* swallow — recovery is best-effort */ }
    }, 1500);

    window.addEventListener('ab:navigation-preferences-changed', function () {
        getNavigationPreferences(true).then(function (prefs) {
            applyNavigationIntegrationVisibility(publicConfigGlobal || {}, prefs || {});
            onRouteChange();
        });
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onRouteChange);
    } else {
        onRouteChange();
    }
    Promise.all([getPublicConfig(), getNavigationPreferences(false)]).then(function (values) {
        applyNavigationIntegrationVisibility(values[0] || {}, values[1] || {});
        syncNativeNavigationSettings();
        onRouteChange();
    });
})();
