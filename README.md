# Anthony Flores — Selected Work

Static portfolio website featuring an interactive thumbnail archive, collapsible project index, image and video lightboxes, and a typographic About page.

## Run locally

No installation or build step is required. Serve the `dist` directory:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000.

## Edit

- `dist/index.html`: navigation, About content and footer.
- `dist/styles.css`: layout, responsive styles and typography.
- `dist/app.js`: index interactions and lightbox controls.
- `dist/wireframe-projects.json`: project names, captions, image paths and framing.
- `dist/assets/`: artwork, thumbnail images and branding.
- `dist/fonts/`: locally served Alte Haas Grotesk fonts.

Use the left and right arrow keys to browse the lightbox; Escape closes it. Contact opens an email to Anthony. The Snap film uses Google Drive's embedded player and requires the original video's sharing permissions to permit playback.

## Hosting

Publish `dist` on a static host. There is no build command. A custom domain can be configured with the chosen hosting provider.

© Anthony Flores 2026. Portfolio artwork and supplied assets remain the property of their respective owners.
