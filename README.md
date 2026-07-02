# SessionStorage Bridge

A tiny browser extension (Manifest V3, Chrome/Edge) that copies a configurable
set of `sessionStorage` keys from one tab into another.

## Why

`sessionStorage` is scoped per origin. If one site (or environment) performs
login and writes tokens/user data to its own `sessionStorage`, a different
origin - e.g. a local dev server, a preview deploy, a different port - can't
read that data even though it's "the same session" conceptually. The usual
workaround is manually copying values through DevTools, one key at a time.
This extension automates that copy with two buttons.

It does not perform authentication, refresh tokens, or fabricate credentials.
It only moves whatever is already sitting in `sessionStorage` on a tab you
point it at.

## Install (unpacked)

Works the same way in Chrome and Edge (both Chromium, both support Manifest V3
unpacked extensions):

1. Clone this repo somewhere permanent (not a temp directory).
   ```bash
   git clone https://github.com/feliamunda/sessionstorage-bridge.git
   ```
2. Go to `chrome://extensions` (or `edge://extensions`).
3. Toggle **Developer mode** on (top-right corner).
4. Click **Load unpacked** and select the cloned folder.
5. Pin the extension to the toolbar for one-click access.

If the Developer mode toggle is missing or greyed out, your organization's
browser policy is blocking unpacked extensions - ask your admin, or use this
on a non-managed profile.

## Configure

The extension ships with **no default keys** - `defaults.js` is an empty
template:

```js
const DEFAULT_KEYS = [];
```

On first use, open the popup and type the sessionStorage key names you want
to bridge into the **Keys to bridge** field (comma-separated), then click
**Save keys**. This is stored in the extension's own storage
(`chrome.storage.local`) and persists across browser restarts - you only
need to do it once.

If you want the popup pre-filled out of the box (e.g. sharing this with a
team that always bridges the same keys), edit `defaults.js` before loading
the extension:

```js
const DEFAULT_KEYS = ['access_token', 'refresh_token', 'user_data'];
```

Saved keys (via the popup) always take precedence over `defaults.js` - the
file only matters before you've saved anything.

## Use

1. On the tab where you're already logged in, click the extension icon and
   hit **Export from this tab**.
2. Switch to the target tab, click the extension icon, hit **Import into
   this tab**. It reloads automatically with the copied values in place.

## Notes

- If the source token is short-lived, expect to repeat Export/Import when it
  expires - this tool does not refresh anything, it only copies whatever is
  currently in `sessionStorage` at the moment you click Export.
- Everything (configured keys and last-exported values) is held in the
  extension's own local storage on your machine - nothing is sent to any
  server.
- Permissions: `scripting` + `activeTab` to read/write `sessionStorage` on
  the tab you're actively using, `storage` to persist your key list and the
  last export between popup opens, `host_permissions: <all_urls>` because
  the extension needs to run on whatever two origins you're bridging, not a
  fixed set.

## License

MIT - see [LICENSE](LICENSE).
