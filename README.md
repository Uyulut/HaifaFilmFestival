# פסטיבל הסרטים הבינלאומי בחיפה ה־42

Single-page concept site for the 42nd Haifa International Film Festival — a
course project for מיתוג לתרבות. RTL Hebrew, designed at 1440px wide.

The page is one hero plus one accordion with three states (סרטים / מפה / צרו קשר).
Everything is live HTML text and separately exported assets — no flattened design
frames. Layout is sized in `cqw` container units off `.festival`, so it scales
with the viewport width.

## Structure

| File | What it is |
| --- | --- |
| `index.html` | The whole page: hero, movies, map, contact |
| `style.css` | All layout/type, sized in `cqw` |
| `main.js` | Accordion, hero parallax, movie switching, map venues |
| `fonts/` | Index (display) + Ploni (text) |
| `assets/`, `img/`, `new assets/` | Hero layers, maps, icons, sponsors |

## Running locally

Any static server from this folder, e.g.:

```
npx http-server -p 8124 -c-1
```

Then open `http://localhost:8124`. Opening `index.html` via `file://` will not
work properly — the YouTube trailer embeds need an http origin.

## Notes for future edits

The trailer iframe sizing in `style.css` is deliberate and easy to break. The
films are **scope** (wider than 16:9), so YouTube letterboxes them inside its
16:9 player. Two rules must hold together or black bands appear under the video:

1. The iframe stays exactly 16:9 — height is always derived as `width * 9/16`.
2. Its width is driven by each film's own ratio (`--trailer-ratio`, set per film
   from `MOVIES[x].sourceRatio` in `main.js`), so the letterboxed picture is
   still tall enough to fill the frame.

Measured source ratios: ernest 1.778, babylonia 1.793, armand 1.85, bang 2.006,
buddha 2.344. If a trailer is re-uploaded, re-measure from its thumbnail
(`i.ytimg.com/vi/<id>/maxresdefault.jpg`): symmetric top/bottom black bars mean
the reading is real.

## Fonts

`fonts/` contains licensed commercial typefaces (Index, Ploni), included here
only to render this student project. They are not offered for redistribution or
reuse — please license them from their foundries.
