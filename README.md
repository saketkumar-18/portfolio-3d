# Saket Kumar — 3D Motion Portfolio

A cinematic, scroll-driven 3D portfolio built with **Three.js + vanilla JS**. Inspired by Sébastien Lempens-style scroll journeys: a low-poly sunset world with a road, glowing arch portals, neon-banded pagoda towers, and a final sunrise — with content milestones appearing as you travel.

![Journey preview](refs/journey_sheet.jpg)

## ✨ Features
- **Scroll-driven 3D camera** along a Catmull-Rom spline through a stylized world (10 waypoints, 10 viewport-heights of travel)
- **12 content panels** (hero, about, skills, 7 projects, education, contact) synced to journey progress — zero dead zones
- **Cinematic sunset palette** — coral/pink fog, hemisphere + directional lighting, floating particles
- **Glassmorphic UI** — frosted panels, minimal nav, START loader screen
- **Graceful degradation** — full no-WebGL fallback (panels become a normal scrolling page)
- **Zero build step** — pure HTML/CSS/JS, runs on any static host

## 🚀 Run locally
```bash
cd portfolio-3d
python -m http.server 8765
# open http://localhost:8765
```

## 📦 Deploy (GitHub Pages)
```bash
git init
git add .
git commit -m "3D motion portfolio"
git branch -M main
git remote add origin https://github.com/saketkumar-18/portfolio-3d.git
git push -u origin main
# then: repo Settings → Pages → Deploy from branch → main → root
```
Live at `https://saketkumar-18.github.io/portfolio-3d/` in ~1 min.

Also works on Netlify (drag-and-drop the folder) or Vercel.

## 🗂 Structure
```
portfolio-3d/
├── index.html      # panels + loader + nav
├── css/style.css   # sunset palette, glassmorphism, fallback
├── js/main.js      # Three.js world, camera spline, panel sync
├── assets/profile.jpg
└── refs/           # reference video frames + journey captures
```

## 🎛 Tuning knobs (in `js/main.js`)
| What | Where |
|---|---|
| Journey length | `SCROLL_VH` (default 10) |
| Camera path | `waypoints[]` |
| Scroll smoothing | easing factor `0.09` in `tick()` |
| Fog/sky colors | `scene.fog`, hemisphere light args |

## 🧪 Debug hook
`window.__portfolio.getProgress()` returns journey progress (0–1) — handy for automated tests.

---
Built for Saket Kumar · B.Sc. Data Science & AI, IIT Guwahati
