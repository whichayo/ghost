# Mainstack theme

Ghost 5 theme shell for the Mainstack blog. The homepage opens with an H1, subtext, featured posts, latest posts, a product-signup CTA, then Announcements and Case Studies. Videos and Webinars is built and hidden. A post has a sticky table of contents, a newsletter with horizontal socials, and You May Also Like. Theme version is `0.5.0`.

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

On the homepage the next section is an H2, `Latest`, then the channel post list (`posts_per_page` is 12). Cards use one grid: one column under 720px, two columns from there, three from 1020px. Feature images are cropped to 16:9, so a tall source file does not stretch its row. Each card stretches to the row height and the author and date sit on the bottom edge, so the gap between rows stays even when titles and excerpts wrap to different lengths.

Under 720px the excerpt is hidden. The title, author, and date stay.

`/page/2/` and later keep that list and drop the homepage-only blocks (hero, featured, CTA, videos, and the two category sections).

## Announcements and case studies

These two blocks use the same cards as Latest. They are not a carousel. Each heading is a link to the tag archive.

The slugs are migrated Ghost tags. There is no `announcements` tag on the site.

- Announcements → `/tag/company-announcements/` (tag name: Company Announcements)
- Case Studies → `/tag/case-studies/`

Each block loads up to six posts, newest published first, and is left out when that tag has no published posts. The full list is the tag page (`tag.hbs`): the tag name as the H1, the tag description when it has one, then the same card grid. Further posts use the theme pager (Newer posts / Older posts). A tag with a single page does not show a pager.

`partials/home-categories.hbs` is where those two slugs are set.

## Homepage CTA

`partials/home-cta.hbs` is a product-signup block after Latest. The button goes to `https://accounts.mainstack.com/signup` with `utm_source=MainstackBlog&utm_medium=Homepage&utm_campaign=BlogCTA`. `https://mainstack.com/signup` returns 404, so this uses the same auth host as the header.

## Videos and webinars

`partials/home-videos.hbs` uses the same cards as Latest (image, title, excerpt, author, date). It queries the public tag `videos` and links the heading to `/tag/videos/`.

The section is off by default. `package.json` `config.custom.show_videos` is a boolean whose default is `false`, so the homepage does not render it. To show it later, no theme edit is required:

1. Create the public tag **videos** if it does not exist, and tag the posts that should appear.
2. In Ghost Admin, open **Settings → Design**.
3. Turn on **Show videos and webinars**.
4. Reload the homepage.

Leave the toggle off until YouTube longform is ready. Uploading a new zip does not by itself turn the section on.

## Article

`post.hbs` keeps the title, author, and date above the cover. Nothing is painted on the image, and the cover does not include search. Comments are not rendered. Drop caps are reset in `screen.css` (including a `.drop-cap` span). There is no previous/next row and no second share row at the bottom.

`assets/js/article.js` builds the table of contents from `h2` and `h3` in the post body and adds an id when a heading does not have one. The list stays hidden when there are fewer than two headings. From 1100px the list sticks on the left and the newsletter rail sticks on the right, both below the two nav bars. Narrower viewports show the list as a scrollable block above the article, then the body, then the newsletter and socials.

## Newsletter and socials

The rail is `partials/newsletter.hbs` plus `partials/socials.hbs`. The form is `data-members-form="subscribe"`, which Ghost Portal (from `{{ghost_head}}`) submits. Free signup has to be allowed under Ghost Admin membership settings or the form cannot complete.

Socials sit on one horizontal row under that form: Facebook, X, Instagram, and Copy link. Facebook and X use `@site.facebook` and `@site.twitter` (live values `themainstack` and `@themainstack`). Instagram is `https://www.instagram.com/themainstack/` because Ghost has no Instagram setting. Copy link writes the current URL. These are the only share actions on the article.

## You May Also Like

`partials/related-posts.hbs` loads up to three other posts with the same primary tag, newest published first. The heading is `You May Also Like`. The block is omitted when the post has no primary tag or no other published post uses it. Previous/Next post links are not in the template.

## SEO

`default.hbs` prints `<title>{{meta_title}}</title>`. `{{ghost_head}}` does not print the document title. It does print the meta description, canonical URL, Open Graph tags, Twitter tags, and Article JSON-LD (publisher Organization, author, headline, dates, image). Do not add a second copy of those tags.

Canonicals follow the Ghost site URL. On Railway that is `https://ghost-production-6e46.up.railway.app/...`. This theme does not point canonicals at `mainstack.com/blog`. That cutover is a separate change.

Google site verification is not hardcoded. It is injected by Ghost from **Settings → Code injection** (`google-site-verification` in the head). `{{ghost_head}}` prints that injection. Removing `{{ghost_head}}` would drop verification, canonicals, and schema together.

Sitemap check, against the Railway site:

- `GET /sitemap.xml` returns 200 and lists the child sitemaps.
- `GET /sitemap-posts.xml` returns 200 and lists post URLs on the Railway host.
- `GET /sitemap-tags.xml` returns 200 and lists tag URLs, including `/tag/case-studies/` and `/tag/company-announcements/`.

Some migrated posts store a short custom meta title. `og:title` and the document title both use that field, while the visible H1 is the full post title. Example: the H1 "Everything You Need to Know About Mainstack as a New Creator" has meta title "Mainstack: The All-In-One Platform to Sell & Get P". Edit **Post settings → Meta data** to replace a truncated title. The theme does not override a title an editor saved.

## QA checklist

Run this after the `0.5.0` zip is activated on Railway. Desktop is about 1280px wide. Mobile is about 390px wide.

Homepage, desktop and mobile:

- [ ] Product bar and blog bar both stay sticky while scrolling. The mobile blog menu still opens under 800px.
- [ ] H1 is "The Mainstack Blog", with the guides subtext under it.
- [ ] Featured, when a post is featured, shows the image then the title, author, and date.
- [ ] Latest is an H2. Cards in a row share a height. Gaps between cards match. Mobile cards show title, author, and date, and hide the excerpt.
- [ ] Get started CTA is visible and opens `accounts.mainstack.com/signup` with `utm_campaign=BlogCTA`.
- [ ] Videos and Webinars is not on the page while **Show videos and webinars** is off.
- [ ] Announcements links to `/tag/company-announcements/`. Case Studies links to `/tag/case-studies/`. Each tag page lists posts and does not show "Page 1 of 1".

Article, desktop and mobile:

- [ ] Title and author/date are above the cover, not on it. No search control sits on the cover.
- [ ] On this page lists H2/H3 links and sticks on the left from 1100px. On a phone it sits above the body and scrolls inside its box.
- [ ] Subscribe is present. On a wide screen it sticks on the right. Facebook, X, Instagram, and Copy link sit on one row under it. There is no second share row at the bottom.
- [ ] No comment thread and no drop cap on the first paragraph.
- [ ] You May Also Like shows related cards. Previous and Next are absent.
- [ ] View source has one `<title>`, a meta description, `og:title`, `og:description`, a canonical on the Railway host, Article JSON-LD, and the Google site verification meta.
- [ ] `/sitemap.xml` returns 200.

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
