# Maximalism Collage Studio

An editorial collage generator built with React, TypeScript, Tailwind CSS, and an HTML5 Canvas high-DPI renderer. Upload any number of images (`1`, `2`, `4`, `6`, or `N`), pick from 5 layout templates, adjust image pan/zoom inside each frame, and export Cloudinary-ready 2K / 3.2K UHD / 4K collages completely client-side.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run lint
npm run build
```

## Deploy to Vercel (via GitHub)

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Maximalism Collage Studio"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Import the GitHub repository in **Vercel**:
   - **Framework Preset**: `Vite` (auto-detected via `vercel.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: None required (100% client-side rendering and export)
