# Mainstack theme

Ghost 5 theme shell for the Mainstack blog. Homepage is a post list. A post is a single article. Featured posts, the two sticky navs, article table of contents, newsletter, and related posts are stubbed in partials for later tickets.

Theme directory: `ghost/core/content/themes/mainstack`.

`package.json` sets `author.email` to `hello@mainstack.com` because gscan requires it. Ghost does not render that address.

## Build the zip

From the theme directory:

```bash
python3 zip-theme.py
```

`make zip` runs the same script. Output is `dist/mainstack.zip`.

The archive root is the theme root. `package.json` sits next to `index.hbs`, not inside a `mainstack/` folder. `THEME.md`, the zip script, and the Makefile are left out of the archive.

## Upload and activate

On the live site, [https://ghost-production-6e46.up.railway.app](https://ghost-production-6e46.up.railway.app):

1. Open Ghost Admin at `/ghost/`.
2. Go to **Settings → Design**.
3. Upload `dist/mainstack.zip`.
4. Activate **mainstack**.

The zip filename is the theme name Ghost installs. Upload `mainstack.zip`, not `casper.zip` or `source.zip` (those names are reserved and Ghost rejects them). Uploading `mainstack.zip` again replaces the installed copy. If mainstack is already active, Ghost reloads it.

## Admin API

Same two steps, for a staff token with theme permissions. Ghost 5 expects `Accept-Version: v5.0`.

```bash
# Upload. The multipart field name is file.
curl -X POST \
  -H "Authorization: Ghost $GHOST_ADMIN_TOKEN" \
  -H "Accept-Version: v5.0" \
  -F "file=@dist/mainstack.zip" \
  https://ghost-production-6e46.up.railway.app/ghost/api/admin/themes/upload/

# Activate.
curl -X PUT \
  -H "Authorization: Ghost $GHOST_ADMIN_TOKEN" \
  -H "Accept-Version: v5.0" \
  https://ghost-production-6e46.up.railway.app/ghost/api/admin/themes/mainstack/activate/
```

## Where the theme actually runs

Railway production runs the official image `ghost:5-alpine`. It does not build this fork. A content volume is mounted at `/var/lib/ghost/content`, and uploaded themes are stored at `/var/lib/ghost/content/themes/` on that volume. They stay there across image redeploys.

Committing this folder does not change the live site. Activate it with the zip upload above.

This fork's production Dockerfile only packs the Casper and Source submodules (`content/themes/casper` and `content/themes/source` in `ghost/core/package.json` `files`). `mainstack` is tracked in git and is not part of that image. Shipping it inside a custom image would be a separate change, and the current Railway service would still ignore it until the service stops using `ghost:5-alpine`.
