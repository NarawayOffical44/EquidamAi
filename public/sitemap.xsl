<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="s">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Evaldam AI Sitemap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root {
            color-scheme: light;
            --ink: #111827;
            --muted: #5f6b7a;
            --line: #dce3ea;
            --brand: #008f8a;
            --bg: #f6f8fa;
          }

          * { box-sizing: border-box; }

          body {
            margin: 0;
            background: var(--bg);
            color: var(--ink);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            line-height: 1.5;
          }

          header, main {
            width: min(1120px, calc(100% - 32px));
            margin: 0 auto;
          }

          header {
            padding: 40px 0 24px;
          }

          .eyebrow {
            margin: 0 0 8px;
            color: var(--brand);
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;
            font-size: clamp(32px, 5vw, 52px);
            line-height: 1;
            letter-spacing: 0;
          }

          .home-link {
            display: inline-flex;
            margin-top: 14px;
            color: var(--muted);
            font-weight: 700;
            text-decoration: none;
          }

          .home-link:hover { color: var(--brand); }

          .summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 14px;
            color: var(--muted);
            font-size: 14px;
          }

          .summary strong {
            color: var(--ink);
            font-size: 20px;
          }

          .table-wrap {
            overflow-x: auto;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: #fff;
          }

          table {
            width: 100%;
            min-width: 780px;
            border-collapse: collapse;
          }

          th, td {
            padding: 13px 16px;
            border-bottom: 1px solid var(--line);
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #fbfcfd;
            color: var(--muted);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .06em;
            text-transform: uppercase;
          }

          tr:last-child td { border-bottom: 0; }

          td {
            color: var(--muted);
            font-size: 14px;
          }

          td:first-child {
            width: 58%;
          }

          a {
            color: var(--brand);
            font-weight: 700;
            overflow-wrap: anywhere;
            text-decoration: none;
          }

          a:hover { text-decoration: underline; }

          .priority {
            color: var(--ink);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
            font-weight: 800;
          }
        </style>
      </head>
      <body>
        <header>
          <p class="eyebrow">Sitemap</p>
          <h1>Evaldam AI</h1>
          <a class="home-link" href="https://equidamai.com">https://equidamai.com</a>
        </header>
        <main>
          <div class="summary">
            <span><strong><xsl:value-of select="count(s:urlset/s:url)" /></strong> public URLs listed for search engines</span>
            <span>Home page priority: <strong>1.0</strong></span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Last modified</th>
                  <th>Frequency</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="s:urlset/s:url">
                  <tr>
                    <td>
                      <a>
                        <xsl:attribute name="href"><xsl:value-of select="s:loc" /></xsl:attribute>
                        <xsl:value-of select="s:loc" />
                      </a>
                    </td>
                    <td><xsl:value-of select="s:lastmod" /></td>
                    <td><xsl:value-of select="s:changefreq" /></td>
                    <td class="priority"><xsl:value-of select="s:priority" /></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
