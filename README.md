# XR Showcase (TV-friendly Web Slideshow)

A standalone, single-page web slideshow to **visually demo VR/AR/MR** for education, skills training, wellness/fitness, and more.

- **No build step** — open `index.html` or host on GitHub Pages  
- **Slides as HTML fragments** in `/slides` (loaded via a simple manifest)  
- **TV-ready typography** — each slide is designed to fit one viewport  
- **Icon top bar** — Prev/Next, Fullscreen, Hide/Show bar, optional Auto-advance

---

## ✨ Features

- **Slide engine**: vertical deck with snap scrolling + keyboard nav  
- **One-viewport slides**: text/media scale to fit (responsive on TV screens)  
- **Split slides**: each slide lives in its own HTML file (easy to edit/reorder)  
- **Manifest loader**: control order via `slides/slides.json`  
- **Icon controls**: Prev / Next / Fullscreen / Hide-Show bar / (optional) Auto-advance  
- **Media-friendly**: images, GIFs, `<video>` (MP4/WEBM), external links  
- **Works offline** once assets are local

---

## 📁 Project structure

```
.
├─ index.html                  # Entry (Tailwind via CDN + your CSS/JS)
├─ assets/
│  ├─ css/
│  │  └─ styles.css           # Layout, TV typography, helpers
│  └─ js/
│     └─ app.js               # Slide loader, nav, progress, (optional) auto-advance
├─ slides/
│  ├─ slides.json             # Manifest: ordered list of slide HTML files
│  ├─ 00-intro.html
│  ├─ 10-platforms-tldr.html  # Standalone VR • PCVR • AR (Glasses/Phone/Other)
│  ├─ 20-gaming-health-research.html
│  └─ ... more slides ...
├─ images/
│  ├─ hardware/               # quest3.jpg, pcvr-headset.jpg, ar-glasses.jpg, ...
│  ├─ phone-ar/
│  └─ gaming/
└─ videos/
   ├─ gaming-broll.webm
   └─ gaming-broll.mp4
```

---

## 🚀 Quick start (local)

You *can* double-click `index.html`, but browsers may block autoplay/video. A tiny static server is safer.

**Node**
```bash
npx serve .
# or
npx http-server -p 8080 .
```

**Python 3**
```bash
python -m http.server 8080
```

Open: `http://localhost:8080`

---

## 🌐 Deploy (GitHub Pages)

1. Push to `main` (or `gh-pages`) branch.  
2. Repo → **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main` → `/ (root)`
3. Wait for the green check.  
4. **Paths matter** on Pages:
   - Use consistent relative paths like `images/...` (avoid uppercase/name mismatches)
   - Pages won’t serve `.mkv`; use **`.mp4` or `.webm`**

---

## 🧩 Slides: add / remove / reorder

1. Create a slide file in `/slides`, e.g. `30-wellness.html`.  
2. Add it to `/slides/slides.json` in the desired order:

```json
{
  "slides": [
    "slides/00-intro.html",
    "slides/10-platforms-tldr.html",
    "slides/20-gaming-health-research.html",
    "slides/30-wellness.html"
  ]
}
```

Slides load in this order at runtime—no build step.

---

## 🎛️ Controls

- **Next / Prev**: Arrow keys, **Space** (next), **PageUp/PageDown**  
- **Home / End**: jump to first / last slide  
- **Fullscreen**: `F` or the Fullscreen icon  
- **Hide/Show top bar**: bar icon (a floating “Show Bar” button appears when hidden)  
- **Auto-advance**: optional; off by default (toggle in the UI if enabled in `app.js`)

> Don’t want auto-advance at all? Remove/disable that block in `app.js`.

---

## 🖼️ Media guidelines

### Images
- Place under `images/...`  
- For `aspect-video` containers, prefer **16:9** landscape images  
- Suggested sizes: **1920×1080** (TV) or **1280×720** (lighter)

Example:
```html
<div class="aspect-video rounded-xl overflow-hidden border border-white/10">
  <img src="images/hardware/quest3.jpg"
       alt="Standalone VR"
       class="absolute inset-0 w-full h-full object-cover"/>
</div>
```

### Video
- Use **`.webm`** (VP9/AV1) and/or **`.mp4`** (H.264). Avoid `.mkv` on the web.
- Keep b-roll short (10–20s), **muted**, **looped**, **playsinline**.

Example:
```html
<div class="aspect-video rounded-xl overflow-hidden border border-white/10">
  <video class="absolute inset-0 w-full h-full object-cover"
         autoplay muted loop playsinline preload="metadata"
         poster="images/gaming/gaming-hero.jpg">
    <source src="videos/gaming-broll.webm" type="video/webm"/>
    <source src="videos/gaming-broll.mp4"  type="video/mp4"/>
  </video>
</div>
```

---

## 🎨 Theming & typography

- Brand colors (edit in `assets/css/styles.css`):
  ```css
  :root { --brand:#0A1F3D; --accent:#00C4A2; }
  ```
- TV typography: the CSS scales `rem` on larger displays and bumps heading/body sizes inside slides for readability.
- Slides are designed to fit one viewport; prefer concise bullets + `aspect-video` media.

---

## 🧠 Notable slides (examples)

- `10-platforms-tldr.html` — Platforms TL;DR (**Standalone VR • PCVR • AR** Glasses/Phone/Other)  
- `20-gaming-health-research.html` — “Gaming is good for you” with a **sources bar** across the bottom

> Mix two-column hero layouts with 3-card grids so the deck doesn’t feel repetitive.

---

## ♿ Accessibility tips

- Add descriptive `alt` text for images  
- Keep high contrast (theme already favors it)  
- Avoid flashing content; b-roll is muted and gentle motion

---

## 🪛 Troubleshooting

- **Video won’t autoplay** → ensure `muted` + `playsinline`  
- **404 on GitHub Pages** → check path **and case**; Pages is case-sensitive  
- **`.mkv` won’t play** → convert to `.mp4`/`.webm`  
- **Slide overflows** → trim bullets or split into another slide; keep media within `aspect-video` wrappers

---

## 🙌 Credits

- Tailwind (CDN) for utility classes  
- (Optional later) [`<model-viewer>`](https://modelviewer.dev/) for interactive 3D on hardware pages

---

### Dev tip

Edit one slide at a time by pointing the deck at a small manifest:

```html
<!-- In index.html -->
<main id="deck" class="deck" data-manifest="slides/dev-only.json"></main>
```

```json
// slides/dev-only.json
{ "slides": [ "slides/20-gaming-health-research.html" ] }
```
