# mainstack-hybrid theme

Ghost 5 theme for the Mainstack blog. Same SA layout/colors as `mainstack-sa` 0.1.3 (dual sticky navs, Tools/Templates split, homepage sections, article TOC card + cover max-height, newsletter, YMAL, mainstack.com footer), with **mixed type**:

- **Headings:** Degular Display (Semibold + Bold)
- **Body / nav / meta:** Basel Grotesk (Light / Regular / Medium / Bold)

Theme version is `0.1.1`. Installs as a **separate** theme named `mainstack-hybrid`. It does not replace `mainstack-sa` or `mainstack` until someone activates it.

## License — fonts

### Degular Display

Files in `assets/fonts/DegularDisplay-*.woff2` are **Degular Display** (Pangram Pangram). Mainstack’s licensed SA typeface (also in Super Admin). **Do not redistribute** outside Mainstack products. Confirm commercial license coverage before any public zip share beyond Railway Ghost / Mainstack repos.

| File | Family | Weight |
| --- | --- | --- |
| `DegularDisplay-Semibold.woff2` | Degular Display | 600 |
| `DegularDisplay-Bold.woff2` | Degular Display | 700 |

### Basel Grotesk (Trial)

Files in `assets/fonts/BaselGrotesk-*.woff2` come from `/workspace/alif-basel-grotesk.zip` and are marked **Trial**. Suitable for internal Railway preview only. **Replace with licensed Basel Grotesk cuts** before any public redistribute or production brand lock-in.

| File | Family | Weight |
| --- | --- | --- |
| `BaselGrotesk-Light.woff2` | Basel Grotesk | 300 |
| `BaselGrotesk-Regular.woff2` | Basel Grotesk | 400 |
| `BaselGrotesk-Medium.woff2` | Basel Grotesk | 500 |
| `BaselGrotesk-Bold.woff2` | Basel Grotesk | 700 |

Body defaults to Regular 400. Nav/buttons default to Medium 500. There is no Semibold 600 in this Basel set.

## Design system (hard rules)

Same as `mainstack-sa`:

- Light only: canvas `#F7F8FA`, surface `#FFFFFF`, ink `#111111`, muted `#6B7280`, hairline `#EEEEEE`
- Links: orange `#FF6A00`, underline on hover only
- Primary CTAs: **black pill**, white label — **never orange buttons**
- Cards: 12px radius, 1px hairline, **no shadows**
- Display face for page H1 and article H2/H3; Basel for body, nav, meta, card UI
- Max site width 1120px; article measure 720px
- No Inter/Georgia as brand face; no gradients, glow, or glass

## Typography settings panel

1. **Settings → Design & branding → Customize**
2. Open the **Site-wide** tab (after activating this theme)
3. Change a setting, **Save**, reload the blog

| Admin label | Key | Options | Default |
| --- | --- | --- | --- |
| Heading font weight | `heading_font_weight` | Display Semibold 600, Display Bold 700 | Display Bold 700 |
| Body font weight | `body_font_weight` | Light 300, Regular 400, Medium 500, Bold 700 | Regular 400 |
| Nav and button font weight | `nav_and_button_font_weight` | Regular 400, Medium 500, Bold 700 | Medium 500 |
| Display h1 size | `display_h1_size` | 40 / 48 / 52 / 60px | 52px |
| Section h2 size | `section_h2_size` | 20 / 22 / 24 / 28 / 32px | 22px |
| Body font size | `body_font_size` | 15 / 17 / 18px | 17px |
| Heading letter spacing | `heading_letter_spacing` | Tight (−0.03em), Normal (0) | Tight |

Leave Brand → Typography on **Theme default** so Ghost does not replace these faces.

## Footer / nav / article

Same as `mainstack-sa` 0.1.3: mainstack.com footer, Tools → `/tag/free-tools/`, Templates → `/tag/free-templates/`, article cover max-height ~500px desktop / ~290px mobile, padded TOC card.

## Build / upload

```bash
python3 zip-theme.py   # → dist/mainstack-hybrid.zip (package.json at zip root)
```

Ghost names the installed theme from the zip filename (`mainstack-hybrid`). Upload only; activate separately when ready.
