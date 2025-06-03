// generateTokenWebsite.js
const fs = require("fs");
const path = require("path");

function generateTokenWebsite({ name, ticker, imageUrl, description, slug }) {
  const folderPath = path.join("public", slug);
  if (!fs.existsSync("public")) fs.mkdirSync("public");
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${name} - ${ticker}</title>
    <style>
      body { font-family: sans-serif; background: #111; color: white; text-align: center; padding: 40px; }
      .card { background: #222; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto; }
      img { width: 100%; border-radius: 10px; margin-bottom: 20px; }
      h1 { color: #00ffff; }
      .buttons a { margin: 10px; display: inline-block; background: #00ffff; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${name} ($${ticker})</h1>
      <img src="${imageUrl}" alt="${name}" />
      <p>${description}</p>
      <div class="buttons">
        <a href="#">💬 Join Telegram</a>
        <a href="#">🔎 View on Solscan</a>
        <a href="#">💸 Buy on Solana</a>
      </div>
    </div>
  </body>
  </html>
  `;

  fs.writeFileSync(path.join(folderPath, "index.html"), htmlContent);
  return `/public/${slug}/index.html`;
}

module.exports = { generateTokenWebsite };
