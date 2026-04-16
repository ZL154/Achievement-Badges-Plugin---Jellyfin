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
            // textContent would nuke them. Most dynamic panels (abSaLb,
            // abSaActivity, abSaSettingsContent, etc.) start with a "Loading..."
            // placeholder marked data-i18n="common.loading" but get populated
            // with HTML later. Without this guard, every subsequent language
            // change resets them BACK to "Loading..." and wipes the real UI.
            if (node.children && node.children.length > 0) return;
            var k = node.getAttribute('data-i18n');
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
        s.textContent = '#' + ROOT_ID + '{position:fixed;inset:0;z-index:999999;overflow-y:auto;padding:2em;background:var(--theme-body-background,#181818);color:#fff;font-family:inherit;color-scheme:dark;}' +
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
            '#' + ROOT_ID + ' .ab-heat{display:grid;grid-auto-rows:1fr;grid-template-rows:repeat(7,1fr);grid-auto-flow:column;gap:3px;width:100%;}' +
            '#' + ROOT_ID + ' .ab-heat-cell{aspect-ratio:1;border-radius:3px;transition:transform 0.1s;}' +
            '#' + ROOT_ID + ' .ab-heat-cell:hover{transform:scale(1.3);z-index:2;position:relative;}' +
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
            '#' + ROOT_ID + ' .ab-panel-card{padding:1.1em;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);}' +
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
        document.head.appendChild(s);
    }

    var userId = '';
    var root = null;

    function el(id) { return root ? root.querySelector('#' + id) : null; }

    function createRoot() {
        var r = document.getElementById(ROOT_ID);
        if (r) { r.innerHTML = ''; } else { r = document.createElement('div'); r.id = ROOT_ID; }
        r.innerHTML =
            '<div class="ab-wrap">' +
                '<div id="abSaWelcomeBanner" class="ab-welcome-banner" style="display:none;"></div>' +
                '<div class="ab-topbar">' +
                    '<h2 style="margin:0;" data-i18n="achievements.title">Achievements</h2>' +
                    '<a class="ab-back" href="/web/index.html#!/home">\u2190 <span data-i18n="achievements.back_home">Back Home</span></a>' +
                '</div>' +
                '<div class="ab-hero">' +
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
                        '<h3 style="margin:0 0 0.5em;" data-i18n="quests.daily">Daily quest</h3>' +
                        '<div class="ab-muted" style="font-size:0.85em; margin-bottom:0.75em;" data-i18n="quests.daily_desc">Resets at midnight. Everyone shares the same daily challenge.</div>' +
                        '<div id="abSaDailyQuest" data-i18n="common.loading">Loading...</div>' +
                        '<h3 style="margin:1.5em 0 0.5em;" data-i18n="quests.weekly">Weekly quest</h3>' +
                        '<div class="ab-muted" style="font-size:0.85em; margin-bottom:0.75em;" data-i18n="quests.weekly_desc">Resets every Monday. Bigger reward, harder target.</div>' +
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
        var panels = { badges: 'abSaPanelBadges', quests: 'abSaPanelQuests', recap: 'abSaPanelRecap', lb: 'abSaPanelLb', compare: 'abSaPanelCompare', activity: 'abSaPanelActivity', wrapped: 'abSaPanelWrapped', stats: 'abSaPanelStats', settings: 'abSaPanelSettings' };
        var tabs = { badges: 'abSaTabBadges', quests: 'abSaTabQuests', recap: 'abSaTabRecap', lb: 'abSaTabLb', compare: 'abSaTabCompare', activity: 'abSaTabActivity', wrapped: 'abSaTabWrapped', stats: 'abSaTabStats', settings: 'abSaTabSettings' };
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

    function renderQuestCards(list, containerId) {
        var box = el(containerId);
        if (!box) return;
        if (!list || !list.length) { box.innerHTML = '<div class="ab-muted">' + tr('quests.none_available', 'No quests available.') + '</div>'; return; }

        box.innerHTML = list.map(function (q) {
            var pct = q.Target ? Math.round(100 * (q.Current || 0) / q.Target) : 0;
            var borderColor = q.Completed ? '#4caf50' : 'rgba(255,255,255,0.1)';
            var glow = q.Completed ? 'box-shadow:0 0 20px rgba(76,175,80,0.15);' : '';
            // Translate quest title/description via the per-quest translation key.
            var title = tr('quest.' + q.Id + '.title', q.Title);
            var desc = tr('quest.' + q.Id + '.desc', q.Description || '');
            return '<div style="padding:0.95em 1.1em; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid ' + borderColor + ';' + glow + ' margin-bottom:0.75em;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; gap:0.5em;">' +
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

    function loadQuests() {
        if (!userId) return;
        fetchJson('Plugins/AchievementBadges/users/' + userId + '/quests').then(function (res) {
            renderQuestCards(res && res.Daily, 'abSaDailyQuest');
            renderQuestCards(res && res.Weekly, 'abSaWeeklyQuest');
        }).catch(function () {
            var d = el('abSaDailyQuest'); if (d) d.innerHTML = '<div class="ab-muted">' + tr('quests.load_failed', 'Failed to load quests.') + '</div>';
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
    var badgeEtaMap = {};
    var publicConfigGlobal = {};
    var currentSearch = '';
    var currentFilter = 'all';
    var currentCategory = '';
    var currentSort = 'default';
    var currentPrestige = 0;

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
        var weeks = Math.ceil(days.length / 7);
        var watchedCount = data.ActiveDays || days.filter(function (d) { return d.W; }).length;
        var current = data.CurrentStreak || 0;
        var best = data.BestStreak || 0;

        var cellsHtml = days.map(function (d) {
            var cls = d.W ? 'ab-streak-cell ab-streak-cell-on' : 'ab-streak-cell';
            return '<div class="' + cls + '" title="' + d.D + (d.W ? ' · ' + tr('streak.watched', 'watched') : '') + '"></div>';
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

        return streakHeader +
            '<div class="ab-streak-grid" style="grid-template-columns:repeat(' + weeks + ',1fr);">' + cellsHtml + '</div>' +
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

        // CSS grid approach: 7 rows, auto-flow by column. Each cell is aspect-ratio:1
        // so they stay perfectly square regardless of container width.
        var cols = Math.ceil(days / 7);
        var cellsHtml = cells.map(function (c) {
            var tooltip = c.key + ' · ' + c.count + ' ' + (c.count === 1 ? tr('common.item', 'item') : tr('common.items', 'items'));
            var emptyClass = c.count === 0 ? ' ab-heat-empty' : '';
            return '<div class="ab-heat-cell' + emptyClass + '" style="background:' + colorFor(c.count) + ';" title="' + tooltip + '"></div>';
        }).join('');
        return '<div class="ab-heat" style="grid-template-columns:repeat(' + cols + ',1fr);">' + cellsHtml + '</div>' +
            '<div class="ab-muted" style="font-size:0.75em; margin-top:0.5em;">' + tr('stats.heatmap.hint', 'Last {days} days · hover for details · max {max} items/day').replace('{days}', days).replace('{max}', max) + '</div>';
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
        badges.forEach(function (b) {
            var c = document.createElement('div'); c.className = 'ab-card'; c.setAttribute('data-badge-id', b.Id);
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
        var pageTheme = prefs.achievementPageTheme || prefs.AchievementPageTheme || 'default';
        var slots = prefs.equippedBadgeSlots || prefs.EquippedBadgeSlots || 5;
        var prefLang = (prefs.language || prefs.Language || 'default').toString().toLowerCase();

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

        var html =
            '<div class="ab-settings-section">' +
                '<div class="ab-eyebrow">' + tr('settings.toast_sound_section', 'Toast & Sound') + '</div>' +
                '<div class="ab-settings-grid">' +
                    toggle('enableUnlockToasts', tr('settings.enable_toasts', 'Enable unlock toasts'), tr('settings.enable_toasts_desc', 'Show a notification when you unlock a badge'), prefs.enableUnlockToasts !== false && prefs.EnableUnlockToasts !== false) +
                    toggle('enableSound', tr('settings.enable_sound', 'Enable toast sound'), tr('settings.enable_sound_desc', 'Play a sound effect with notifications'), prefs.enableSound !== false && prefs.EnableSound !== false) +
                    toggle('enableConfetti', tr('settings.confetti', 'Enable confetti'), tr('settings.confetti_desc', 'Particle burst effects on rare+ unlocks'), prefs.enableConfetti !== false && prefs.EnableConfetti !== false) +
                    toggle('enableMilestoneToasts', tr('settings.enable_milestone_toasts', 'Enable milestone toasts'), tr('settings.enable_milestone_toasts_desc', 'Celebrate 25/50/75/100% completion'), prefs.enableMilestoneToasts !== false && prefs.EnableMilestoneToasts !== false) +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.minimum_rarity', 'Minimum toast rarity') + '</div><div class="ab-toggle-desc">' + tr('settings.minimum_rarity_desc', 'Only show toasts for badges at or above this rarity') + '</div></div>' +
                        '<select class="ab-select" data-settings-select="minimumToastRarity">' +
                            '<option value="all"' + (minRarity === 'all' ? ' selected' : '') + '>' + tr('settings.rarity_all', 'All') + '</option>' +
                            '<option value="rare"' + (minRarity === 'rare' ? ' selected' : '') + '>' + tr('settings.rarity_rare_plus', 'Rare+') + '</option>' +
                            '<option value="epic"' + (minRarity === 'epic' ? ' selected' : '') + '>' + tr('settings.rarity_epic_plus', 'Epic+') + '</option>' +
                            '<option value="legendary"' + (minRarity === 'legendary' ? ' selected' : '') + '>' + tr('settings.rarity_legendary_plus', 'Legendary+') + '</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            privacySectionHtml +
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
                    spoilerRowHtml +
                    extremeSpoilerRowHtml +
                    '<div class="ab-setting-row">' +
                        '<div class="ab-toggle-info"><div class="ab-toggle-label">' + tr('settings.equipped_slots', 'Equipped badge slots') + '</div><div class="ab-toggle-desc">' + tr('settings.equipped_slots_desc', 'Number of badges in your showcase (1-10)') + '</div></div>' +
                        '<input type="number" class="ab-input" data-settings-number="equippedBadgeSlots" min="1" max="10" value="' + slots + '" style="width:70px;text-align:center;">' +
                    '</div>' +
                    toggle('autoEquipNewUnlocks', tr('settings.auto_equip', 'Auto-equip new unlocks'), tr('settings.auto_equip_desc', 'Automatically equip newly unlocked badges'), prefs.autoEquipNewUnlocks === true || prefs.AutoEquipNewUnlocks === true) +
                    toggle('enablePushNotifications', tr('settings.push_notifications', 'Push notifications'), tr('settings.push_notifications_desc', 'Receive push notifications for achievements'), prefs.enablePushNotifications === true || prefs.EnablePushNotifications === true) +
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
            return fetchJson('Plugins/AchievementBadges/users/' + userId + '/preferences', 'POST', payload);
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
            return loadTranslations(effective).then(function () { applyStaticTranslations(); });
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
            fetchJson('Plugins/AchievementBadges/users/' + userId),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/summary'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/equipped'),
            fetchJson('Plugins/AchievementBadges/leaderboard?limit=10'),
            fetchJson('Plugins/AchievementBadges/server/stats'),
            fetchJson('Plugins/AchievementBadges/users/' + userId + '/rank'),
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

            if (rank && rank.Tier) {
                applyThemeForTier(rank.Tier.Name);
                var lbl = el('abSaRankLabel');
                if (lbl) { lbl.textContent = rank.Tier.Name; lbl.style.color = rank.Tier.Color || ''; }
                var fill = el('abSaRankBarFill');
                if (fill) {
                    fill.style.width = (rank.ProgressToNext || 0) + '%';
                    fill.style.background = (rank.Tier.Color || '#667eea');
                }
                var pct = el('abSaRankBarPct');
                if (pct) {
                    if (rank.NextTier) {
                        pct.textContent = rank.Score + ' / ' + rank.NextTier.MinScore + ' ' + tr('achievements.to_next', 'to') + ' ' + rank.NextTier.Name;
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

    function mountRoute() {
        injectStyles();
        root = document.getElementById(ROOT_ID);
        if (!root) {
            root = createRoot();
            document.body.appendChild(root);
        } else {
            root = createRoot();
        }
        root.style.display = 'block';

        el('abSaTabBadges').addEventListener('click', function () { setTab('badges'); });
        el('abSaTabQuests').addEventListener('click', function () { setTab('quests'); });
        el('abSaTabRecap').addEventListener('click', function () { setTab('recap'); });
        el('abSaTabLb').addEventListener('click', function () { setTab('lb'); });
        el('abSaTabCompare').addEventListener('click', function () { setTab('compare'); });
        el('abSaTabActivity').addEventListener('click', function () { setTab('activity'); });
        el('abSaTabWrapped').addEventListener('click', function () { setTab('wrapped'); });
        el('abSaTabStats').addEventListener('click', function () { setTab('stats'); loadStats(); });
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
        });
    }

    function unmountRoute() {
        var r = document.getElementById(ROOT_ID);
        if (r) r.style.display = 'none';
    }

    function isAchievementsRoute() {
        var hash = window.location.hash || '';
        return hash.indexOf(ROUTE_MATCH) !== -1;
    }

    function onRouteChange() {
        if (isAchievementsRoute()) {
            mountRoute();
        } else {
            unmountRoute();
        }
    }

    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onRouteChange);
    } else {
        onRouteChange();
    }
})();
