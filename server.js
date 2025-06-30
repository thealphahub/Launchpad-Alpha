require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const { generateImageFromPrompt } = require("./imageGenerator");
const { generateTokenWebsite } = require("./generateTokenWebsite");
const { createTokenGroup } = require("./telegramBot");
const { generateStyledHtml } = require("./styledHtml");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());
app.use(express.json());
app.use("/beta", express.static("beta")); // Sert les pages générées
app.use("/public", express.static("public")); // Sert les mini-sites générés

// Route pour afficher la page launchpad avec la liste des tokens
app.get("/launchpad", (req, res) => {
  const betaDir = path.join(__dirname, "beta");
  const files = fs.readdirSync(betaDir).filter(file => file.endsWith(".html"));

  let gallery = "";

  for (const file of files) {
    const content = fs.readFileSync(path.join(betaDir, file), "utf8");

    const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
    const imgMatch = content.match(/<img src=\"(.*?)\"/);
    const descMatch = content.match(/<p>(.*?)<\/p>/);

    const title = titleMatch ? titleMatch[1] : "Unknown";
    const img = imgMatch ? imgMatch[1] : "";
    const desc = descMatch ? descMatch[1] : "";
    const link = `/beta/${file}`;

    gallery += `
      <div class="card">
        <img src="${img}" alt="${title}" />
        <h3>${title}</h3>
        <p>${desc}</p>
        <a href="${link}" target="_blank">👀 View</a>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Launchpad - Alpha Hub</title>
      <style>
        body { background: transparent; color: white; font-family: sans-serif; text-align: center; padding: 20px; }
        h1 { color: #00ffff; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 40px; }
        .card { background: #1c1c1e; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
        .card img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; }
        .card h3 { margin: 10px 0; color: #00ffff; }
        .card a { display: inline-block; margin-top: 10px; padding: 8px 15px; background: #00ffff; color: black; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1></h1>
      <div class="grid">
        ${gallery}
      </div>
    </body>
    </html>
  `;

  res.send(html);
});


app.post("/launch", async (req, res) => {
  const { name, ticker, imagePrompt, description } = req.body;

  try {
    const imageUrl = await generateImageFromPrompt(imagePrompt || name);
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const htmlContent = generateStyledHtml({
      name,
      ticker,
      imageUrl,
      description: description || "A new memecoin launched from Alpha Hub 🚀",
      slug,
    });

    const filePath = path.join("beta", `${slug}.html`);
    fs.writeFileSync(filePath, htmlContent);

    generateTokenWebsite({ name, ticker, imageUrl, description, slug });

    const tokensPath = path.join(__dirname, 'tokens.json');
    let tokens = [];
    if (fs.existsSync(tokensPath)) {
      tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
    }
    tokens.push({ name, ticker, imageUrl, description, slug });
    fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));

    const url = `https://launchpad.thealphahub.fun/beta/${slug}.html`;
    createTokenGroup({ name, ticker, url });

    res.json({ success: true, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "An error occurred while creating the project." });
  }
});

app.get("/explore", (req, res) => {
  const betaDir = path.join(__dirname, "beta");
  const files = fs.readdirSync(betaDir).filter(file => file.endsWith(".html"));

  let gallery = "";

  for (const file of files) {
    const content = fs.readFileSync(path.join(betaDir, file), "utf8");

    const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
    const imgMatch = content.match(/<img src=\"(.*?)\"/);
    const descMatch = content.match(/<p>(.*?)<\/p>/);

    const title = titleMatch ? titleMatch[1] : "Unknown";
    const img = imgMatch ? imgMatch[1] : "";
    const desc = descMatch ? descMatch[1] : "";
    const link = `/beta/${file}`;

    gallery += `
      <div class="card">
        <img src="${img}" alt="${title}" />
        <h3>${title}</h3>
        <p>${desc}</p>
        <a href="${link}" target="_blank">👀 View</a>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Explore Memecoins - Alpha Hub</title>
      <style>
        body {
          background: transparent;
          color: white;
          font-family: sans-serif;
          text-align: center;
          padding: 20px;
        }
        h1 {
          color: #00ffff;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 40px;
        }
        .card {
          background: #1c1c1e;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .card img {
          width: 100%;
          max-height: 200px;
          object-fit: cover;
          border-radius: 8px;
        }
        .card h3 {
          margin: 10px 0;
          color: #00ffff;
        }
        .card a {
          display: inline-block;
          margin-top: 10px;
          padding: 8px 15px;
          background: #00ffff;
          color: black;
          text-decoration: none;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <h1>🧃 Explore Memecoins launched via Alpha Hub</h1>
      <div class="grid">
        ${gallery}
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

io.on("connection", (socket) => {
  console.log("🟢 New user connected to chat");

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`👥 User joined room: ${room}`);
  });

  socket.on("message", ({ room, user, text }) => {
    io.to(room).emit("message", { user, text });
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected");
  });
});

if (require.main === module) {
  server.listen(3001, () => {
    console.log("✅ Alpha Launchpad server + chat running at http://localhost:3001");
  });
}
