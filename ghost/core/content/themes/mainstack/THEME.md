# Mainstack theme

Ghost 5 theme shell for the Mainstack blog. The homepage opens with an H1, subtext, featured posts, latest posts, then Announcements and Case Studies. A post is a single article. Article table of contents, newsletter, and related posts are stubbed in partials for later tickets.

## Homepage

The H1 and subtext are written in `index.hbs`. They do not follow the Ghost site title or description (those still feed the document head and the footer).

- H1: The Mainstack Blog
- Subtext: Guides, Conversations with Creators, Tools, Templates and everything else in between to help you monetize your knowledge.

`partials/featured.hbs` loads published posts with `{{#get "posts" filter="featured:true"}}` (the same set as the `#featured` filter). The section is left out when no post is featured. It shows at most six, newest published first.

Each card is the feature image, then the title, author, and date. That text is not painted on top of the image, and the card has no excerpt. One column under 720px, two columns from there, three from 1020px. A single featured post spans the row. Two featured posts share it.

### Feature a post

No theme edit and no zip upload. In Ghost Admin:

1. Open **Posts** and edit the post.
2. Open post settings (the gear icon in the editor).
3. Turn on **Feature this post**.
4. Update or publish the post.

Reload the homepage and the post is in Featured. Turn the toggle off to remove it.

## Latest posts

On the homepage the next section is an H2, `Latest`, then the channel post list (`posts_per_page` is 12). Cards use one grid: one column under 720px, two columns from there, three from 1020px. Each card stretches to the row height and the author and date sit on the bottom edge, so the gap between rows stays even when titles and excerpts wrap to different lengths.

Under 720px the excerpt is hidden. The title, author, and date stay.

`/page/2/` and later keep that list and drop the homepage-only blocks (hero, featured, and the two category sections).

## Announcements and case studies

These two blocks use the same cards as Latest. They are not a carousel. Each heading is a link to the tag archive.

The slugs are migrated Ghost tags. There is no `announcements` tag on the site.

- Announcements → `/tag/company-announcements/` (tag name: Company Announcements)
- Case Studies → `/tag/case-studies/`

Each block loads up to six posts, newest published first, and is left out when that tag has no published posts. The full list is the tag page (`tag.hbs`): the tag name as the H1, the tag description when it has one, then the same card grid. Further posts use the theme pager (Newer posts / Older posts). A tag with a single page does not show a pager.

`partials/home-categories.hbs` is where those two slugs are set.

## Navigation

`default.hbs` loads two sticky bars from `partials/header.hbs`.

The top bar is the Mainstack product chrome (dark). The wordmark goes to https://mainstack.com. Login and Get started carry `utm_source=MainstackBlog&utm_medium=Menu&utm_campaign=BlogHeader`.

- Login: `https://mainstack.com/login?utm_source=MainstackBlog&utm_medium=Menu&utm_campaign=BlogHeader`
- Get started: `https://accounts.mainstack.com/signup?utm_source=MainstackBlog&utm_medium=Menu&utm_campaign=BlogHeader`

`https://mainstack.com/signup` returns 404. The signup button uses the live auth host, which keeps the UTM query string.

The blog bar sits under the product bar and stays visible with it (`--ms-sticky-nav-offset` is both heights, and `scroll-padding-top` uses that so anchors clear the bars). Blog Home points at `{{@site.url}}`. The other links are tag archives:

- Tools and Templates → `/tag/tools-and-templates/` (tag not created yet)
- Case Studies → `/tag/case-studies/` (migrated tag; also the homepage section)
- Comparisons → `/tag/comparisons/` (tag not created yet)
- Videos → `/tag/videos/` (tag not created yet)

Mainstack University has no public section (`/university` 404s), so that item links to https://mainstack.com until a real URL exists. Desktop shows the links inline. The hamburger is mobile only (under 800px). Search is the Ghost `{{search}}` button, which `{{ghost_head}}` wires up. There is no dark-mode toggle in this theme.

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
