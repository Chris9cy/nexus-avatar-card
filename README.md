# Nexus Avatar Card

A custom Lovelace card for Home Assistant that turns a `person` entity into a living presence avatar: it swaps artwork for home / away / night / driving states, shows a battery ring, detects driving via Life360 (or plain GPS speed) with an ETA countdown from a travel-time sensor (e.g. Waze), and shows how long someone's been at their current place.

Built for my own dashboard, but every entity is passed in via config — nothing is hardcoded, so it drops into any dashboard.

## Features

- **State artwork** — different image for home / away / night / driving, with a fallback chain down to the person entity's own `entity_picture`.
- **Driving detection** — reads a Life360 device tracker's `driving` attribute if you have one, or falls back to plain GPS speed (>2 m/s) from any `device_tracker`. Speed is only trusted if the reading is less than 10 minutes old, and an "arriving home" override kicks in the moment either tracker enters the home zone — this avoids the classic phantom-driving bug where a stationary iPhone stops updating and gets stuck reporting a stale speed.
- **Waze / travel-time ETA** — if you point it at a travel-time sensor (Waze Travel Time, Google Distance Matrix, etc.), it shows distance + minutes home, and a live clock-time ETA while driving.
- **Dwell time** — "there 20m" / "there 2h 5m" since arriving at the current place, if your location sensor exposes an `at_loc_since` timestamp (Life360's does).
- **Battery ring** — a conic-gradient ring around the avatar that fills with charge level and goes amber/red as it drains, from any battery sensor.
- **Tap-to-locate** — tap the caption to jump to a map view or open a link (e.g. a Life360/Google Maps deep link), tap the card itself for the entity's more-info dialog.
- **Zero dependencies** — single vanilla-JS file, Shadow DOM, no build step.

## Installation

### HACS (custom repository)

1. HACS → the `⋮` menu → **Custom repositories**.
2. Add this repo's URL, category **Dashboard**.
3. Install "Nexus Avatar Card", then add `nexus-avatar-card.js` as a dashboard resource (HACS usually does this automatically).

### Manual

1. Copy `nexus-avatar-card.js` into `<config>/www/nexus-avatar-card.js`.
2. Settings → Dashboards → Resources → **Add Resource**:
   - URL: `/local/nexus-avatar-card.js`
   - Type: JavaScript Module
3. Refresh your browser.

## Configuration

| Option | Required | Description |
|---|---|---|
| `entity` | ✅ | A `person.*` entity. Its state (`home` / `not_home` / zone name) drives the base logic. |
| `name` | | Display name. Defaults to the person entity's `friendly_name`. |
| `tracker` | | A `device_tracker.*` entity (e.g. the phone's own GPS tracker). Used for speed-based driving detection and as an extra "in the home zone" signal. |
| `life360` | | A Life360 `device_tracker.*` entity. Preferred source for driving detection (`driving` attribute) and speed, since it's more authoritative than raw GPS. |
| `location` | | A sensor whose state is a human-readable place name (e.g. reverse-geocoded address) and which may expose `at_loc_since` (dwell time) and/or `map_link`. |
| `travel` | | A travel-time sensor (state = minutes, `distance` attribute = km) — e.g. a [Waze Travel Time](https://github.com/eifinger/sensor.waze_travel_time) sensor pointed at home. |
| `battery` | | A battery-level sensor (0–100) for the charge ring. |
| `link` | | Explicit URL or dashboard path for tap-to-locate. Overrides `location`'s `map_link` attribute if both are set. |
| `images.home` | | Image URL shown when home (or arriving). |
| `images.away` | | Image URL shown when away. |
| `images.night` | | Image URL shown between 23:00–07:00, home, not driving. |
| `images.driving` | | Image URL shown while driving. Falls back to `images.away`. |

Every field except `entity` is optional — the card degrades gracefully (e.g. skip `travel` and you just don't get the ETA row; skip `images` entirely and it uses the person's `entity_picture`).

### Example

```yaml
type: custom:nexus-avatar-card
entity: person.jane_doe
name: Jane
tracker: device_tracker.janes_iphone
life360: device_tracker.life360_jane
location: sensor.jane_location
travel: sensor.waze_jane_to_home
battery: sensor.janes_iphone_battery_level
link: https://life360.com/circles/xxx
images:
  home: /local/people/jane-home.png
  away: /local/people/jane-away.png
  night: /local/people/jane-night.png
  driving: /local/people/jane-driving.png
```

Drop it in a grid/masonry view alongside your other presence cards — `getCardSize()` returns `3`.

## Making your own avatar images

The card just points `<img>` at whatever URL you give it, so any image host under `/local/` works. If you want a quick way to turn a phone photo into something you can drop straight into `www/` without a build pipeline, wrapping a base64 JPEG in a tiny SVG works well and keeps file sizes small:

```bash
sips -Z 256 -s format jpeg photo.jpg --out photo_256.jpg
b64=$(base64 -i photo_256.jpg)
cat > avatar.svg <<EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <image width="256" height="256" href="data:image/jpeg;base64,$b64"/>
</svg>
EOF
```

Then point `images.home` (etc.) at `/local/people/avatar.svg`.

## License

MIT — see [LICENSE](LICENSE).
