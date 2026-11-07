import { escapeHtml, safeJsonLd } from "../assets/js/lib/escape.js";

const ORIGIN = "https://jonldavis-coder.github.io/flying-kitchen";

const NAV = [
  ["index.html", "Hub", "home"],
  ["map/", "Route map", "map"],
  ["search/", "Search", "search"],
  ["books/", "Books", "books"],
  ["shop/", "Shop", "shop"],
  ["about/", "About", "about"]
];

export function page({
  title,
  description,
  current = "",
  extraHead = "",
  main,
  pageName = "static",
  jsonLd = null,
  canonical = "",
  robots = "",
  issue = "Flying Kitchen"
}) {
  const nav = NAV.map(([href, label, id]) => {
    const currentAttr = id === current ? ' aria-current="page"' : "";
    return `<a href="${href}"${currentAttr}>${escapeHtml(label)}</a>`;
  }).join("\n          ");
  const url = canonical || `${ORIGIN}/`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="/flying-kitchen/">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#022d5a">
  <link rel="icon" href="favicon.ico" sizes="any">
  <link rel="icon" href="assets/images/favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="assets/images/apple-touch.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,680&amp;family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&amp;display=swap">
  <link rel="stylesheet" href="assets/css/styles.css">
  ${robots ? `<meta name="robots" content="${escapeHtml(robots)}">` : ""}
  <link rel="canonical" href="${escapeHtml(url)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:image" content="${ORIGIN}/assets/images/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ORIGIN}/assets/images/og.jpg">
  ${jsonLd ? `<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>` : ""}
  ${extraHead}
</head>
<body data-page="${escapeHtml(pageName)}" data-print="full">
  <a class="skip-link" href="#content">Skip to content</a>
  <div class="frame">
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="index.html">
          <img class="brand-logo" src="assets/images/logo.jpg" alt="Flying Kitchen" width="800" height="800">
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
        <nav id="site-nav" aria-label="Primary">
          ${nav}
        </nav>
        <div id="auth-slot"></div>
      </div>
      <p class="issue-line">${escapeHtml(issue)}</p>
    </header>
    <p id="demo-banner" class="demo-banner" role="status" hidden></p>
    <noscript>
      <p class="demo-banner">JavaScript is off. You can still read the hub. Search filtering, the route map, and community notes need JavaScript.</p>
    </noscript>
    <main id="content" tabindex="-1">
      ${main}
    </main>
    <footer class="site-footer">
      <div class="wrap">
        <nav aria-label="Footer">
          <a href="shop/">Shop</a>
          <a href="books/">Books</a>
          <a href="sauces/">Flying Sauces</a>
          <a href="pancakes/">Flying Pancakes</a>
          <a href="bbq/">Flying BBQ</a>
          <a href="settled/">Who settled the flavor</a>
          <a href="sources/">Sources</a>
          <a href="credits/">Photo credits</a>
          <a href="about/">About</a>
          <a href="guidelines/">Community guidelines</a>
          <a href="affiliate/">Affiliate disclosure</a>
          <a href="privacy/">Privacy</a>
          <a href="terms/">Terms</a>
          <a href="submit.html">Suggest a pick</a>
          <a href="login.html">Sign in</a>
        </nav>
        <p id="mode-note"></p>
        <p>Recipes stay on their own Flying sites. This hub quotes those sites and links to them. It does not invent dishes, customers, or reviews. Shop prices are placeholders. Goods are planned for print-on-demand or private-label sourcing, and the buy buttons say coming soon.</p>
      </div>
    </footer>
  </div>
  <script src="config.js"></script>
  <script src="ads-config.js"></script>
  <script src="shop-config.js"></script>
  <script type="module" src="assets/js/boot.js"></script>
</body>
</html>
`;
}

export function adSlot(name) {
  return `<aside class="ad-slot" data-ad-slot="${escapeHtml(name)}" hidden></aside>`;
}
