/**
 * Resolves a public asset path relative to the Vite base URL.
 * Use this for all references to files in /public (images, favicon, etc.)
 * so paths work correctly on GitHub Pages (base: "/AgriAI/").
 *
 * Example: assetPath("/images/logo.png") → "/AgriAI/images/logo.png"
 */
const BASE = import.meta.env.BASE_URL;           // "/" in dev, "/AgriAI/" in prod

export default function assetPath(path) {
  // Remove leading slash from path to avoid double slashes
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${BASE}${clean}`;
}
