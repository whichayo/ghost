# mainstack-sa theme

Ghost 5 theme for the Mainstack blog, styled from the **SA design system** (Degular + light canvas). Same layout features as `mainstack` (dual sticky navs, homepage featured/latest/CTA/categories, article TOC + newsletter + YMAL). Theme version is `0.1.3`.

Installs as a **separate** theme named `mainstack-sa`. It does not replace `mainstack` until someone activates it in Ghost Admin → Design → Themes.

## License — Degular

Font files in `assets/fonts/` are **Degular** / **Degular Display** (Pangram Pangram). They are Mainstack’s licensed SA typeface, already used in the Super Admin dashboard (`whichayo/mainstack-sa-dashboard`). **Do not redistribute** these files outside Mainstack products. Confirm commercial license coverage before any public zip share beyond Railway Ghost / Mainstack repos.

Weights shipped:

| File | Family | Weight |
| --- | --- | --- |
| `Degular-Medium.woff2` | Degular | 500 |
| `Degular-Semibold.woff2` | Degular | 600 |
| `Degular-Bold.woff2` | Degular | 700 |
| `DegularDisplay-Semibold.woff2` | Degular Display | 600 |
| `DegularDisplay-Bold.woff2` | Degular Display | 700 |

There is **no Regular 400**. Body text defaults to Medium 500.

## Design system (hard rules)

Source: SA `DESIGN.md` + `globals.css`, tokens from Jony Ive’s theme pack.

- Light only: canvas `#F7F8FA`, surface `#FFFFFF`, ink `#111111`, muted `#6B7280`, hairline `#EEEEEE`
- Links: orange `#FF6A00`, underline on hover only
- Primary CTAs: **black pill**, white label (~44–48px) — **never orange buttons**
- Cards: 12px radius, 1px hairline, **no shadows**
- Display face for page H1 and article H2/H3; Degular Semibold for nav and card titles
- Max site width 1120px; article measure 720px
- No Inter/Georgia as brand face; no gradients, glow, or glass

## Typography settings panel

Weights and sizes in Ghost Admin (no theme edit):

1. **Settings → Design & branding → Customize**
2. Open the **Site-wide** tab (after activating this theme)
3. Change a setting, **Save**, reload the blog

| Admin label | Key | Options | Default |
| --- | --- | --- | --- |
| Heading font weight | `heading_font_weight` | Display Semibold 600, Display Bold 700 | Display Bold 700 |
| Body font weight | `body_font_weight` | Medium 500, Semibold 600, Bold 700 | Medium 500 |
| Nav and button font weight | `nav_and_button_font_weight` | Medium 500, Semibold 600, Bold 700 | Semibold 600 |
| Display h1 size | `display_h1_size` | 40 / 48 / 52 / 60px | 52px |
| Section h2 size | `section_h2_size` | 20 / 22 / 24 / 28 / 32px | 22px |
| Body font size | `body_font_size` | 15 / 17 / 18px | 17px |
| Heading letter spacing | `heading_letter_spacing` | Tight (−0.03em), Normal (0) | Tight |

Leave Brand → Typography on **Theme default** so Ghost does not replace Degular.

## Footer

`partials/site-footer.hbs` mirrors the [mainstack.com](https://mainstack.com/) marketing footer (dark brand chrome): company / products / support columns, socials (IG, X, LinkedIn, Facebook), WhatsApp + support email, four office addresses, © line, Techstars, and legal disclaimers. Destination URLs are the live mainstack.com / help.mainstack.co targets.

## Homepage / article

Same structure as `mainstack` 0.5.x: H1 + subtext, featured, latest, product CTA (banner wash + black pill), Announcements / Case Studies, optional Videos toggle, article TOC + newsletter + socials + YMAL.

## Build / upload

```bash
python3 zip-theme.py   # → dist/mainstack-sa.zip (package.json at zip root)
```

Ghost names the installed theme from the zip filename (`mainstack-sa`).
