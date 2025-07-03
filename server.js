require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

const { generateImageFromPrompt } = require("./imageGenerator");
const { generateTokenWebsite } = require("./generateTokenWebsite");
const { createTokenGroup } = require("./telegramBot");
const nacl = require("tweetnacl");
const { PublicKey } = require("@solana/web3.js");
const { createSolanaToken } = require("./solanaToken");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());
app.use(express.json());
app.use("/beta", express.static("beta"));
app.use("/public", express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Pour les images uploadées

// --- PAGE Launchpad (liste des tokens)
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
      <h1>🚀 Launchpad Memecoins</h1>
      <div class="grid">
        ${gallery}
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

// --- Génération du HTML d'un token
function generateStyledHtml({ name, ticker, imageUrl, description, slug }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta property="og:title" content="${name} ($${ticker}) - Alpha Launchpad" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:description" content="${description}" />
    <title>${name} ($${ticker})</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
      body {
        margin: 0; padding: 0;
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(to right, #0f2027, #203a43, #2c5364);
        color: white; text-align: center; padding: 30px;
      }
      .container { max-width: 600px; margin: auto; background: #1e1e2f; padding: 30px; border-radius: 15px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);}
      img { width: 100%; max-width: 400px; border-radius: 10px; margin: 20px 0;}
      h1 { font-size: 28px; color: #00ffff;}
      p { font-size: 16px; margin-bottom: 10px;}
      .footer { margin-top: 20px; font-weight: bold; color: #b0e0ff;}
      .share { margin-top: 20px;}
      .share a { background: #00acee; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 10px;}
      .site-link { background: #00ffae !important; color: black !important;}
      #connect-btn { padding:10px 20px; font-size:16px; background:#00ffff; border:none; border-radius:6px; cursor:pointer; margin-top: 20px;}
      #claim-status { margin-top:10px; color:#00ffae;}
      #chat { margin-top: 40px; background: #232346; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.20); max-width: 500px; margin-left: auto; margin-right: auto;}
      #chat h3 { margin-top: 0; color: #00ffff;}
      #chat-messages { background: #19193b; padding: 10px; border-radius: 8px; min-height: 60px; margin-bottom: 12px; text-align: left; font-size: 15px; max-height: 180px; overflow-y: auto; list-style: none;}
      #chat-messages li { margin-bottom: 6px; word-break: break-word;}
      #chat-nick-section input { padding:8px; width:60%;}
      #chat-nick-section button { padding:8px 10px; margin-left:8px; background:#00ffff; border:none; border-radius:5px;}
      #chat-input { padding: 8px; width: 70%; margin-right: 10px;}
      #chat button.send-btn { padding:8px 15px; background: #00ffff; border: none; border-radius: 5px; margin-left: 10px;}
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${name} ($${ticker})</h1>
      <img src="${imageUrl}" alt="${name}" />
      <p>${description}</p>
      <div class="footer">Powered by The Alpha Hub</div>
      <div class="share">
        <a href="https://twitter.com/intent/tweet?text=Check%20out%20$${ticker}%20launched%20on%20Alpha%20Hub!%20http://localhost:3001/beta/${slug}.html" target="_blank">🚀 Share on X</a>
        <a class="site-link" href="/public/${slug}/index.html" target="_blank">🌐 View Project Site</a>
      </div>
      <div id="claim-section">
        <button id="connect-btn">🔐 Claim This Project</button>
        <p id="claim-status"></p>
      </div>
    </div>
    <div id="chat">
      <h3>💬 Community Chat</h3>
      <div id="chat-nick-section">
        <input id="pseudo-input" placeholder="Your nickname..." />
        <button onclick="setPseudo()">Set</button>
        <span id="current-pseudo" style="margin-left:10px;color:#00ffae;"></span>
      </div>
      <ul id="chat-messages"></ul>
      <input id="chat-input" placeholder="Your message..." />
      <button class="send-btn" onclick="sendMessage()">Send</button>
    </div>
    <script>
      // JS claim et chat ici (inchangé, tu peux garder ton code existant)
    </script>
  </body>
  </html>
  `;
}

// ---- ROUTE /launch améliorée ----
app.post("/launch", upload.single('imageFile'), async (req, res) => {
  const { name, ticker, imagePrompt, description, imageMode } = req.body;
  let imageUrl = '';
  try {
    if (imageMode === "ia" || (!imageMode && imagePrompt)) {
      imageUrl = await generateImageFromPrompt(imagePrompt || name);
    } else if (imageMode === "upload" && req.file) {
      imageUrl = `/uploads/${req.file.filename}`; // Stockage local en dev
    } else {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

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

    const url = `https://launchpad.thealphahub.fun/beta/${slug}.html`;
    createTokenGroup({ name, ticker, url });

    res.json({ success: true, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "An error occurred while creating the project." });
  }
});

// ---- ROUTE /claim inchangée ----
app.post("/claim", async (req, res) => {
  const { slug, wallet, message, signature } = req.body;
  if (!slug || !wallet || !signature || !message) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }
  try {
    const pubkey = new PublicKey(wallet);
    const msg = new TextEncoder().encode(message);
    const sig = Uint8Array.from(signature);
    if (!nacl.sign.detached.verify(msg, sig, pubkey.toBytes())) {
      return res.status(400).json({ success: false, message: "Signature invalid" });
    }
    const tokenAddress = await createSolanaToken(pubkey);
    return res.json({ success: true, token: tokenAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Token creation failed" });
  }
});

// ---- ROUTE /explore inchangée ----
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
        body { background: transparent; color: white; font-family: sans-serif; text-align: center; padding: 20px;}
        h1 { color: #00ffff;}
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 40px;}
        .card { background: #1c1c1e; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);}
        .card img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px;}
        .card h3 { margin: 10px 0; color: #00ffff;}
        .card a { display: inline-block; margin-top: 10px; padding: 8px 15px; background: #00ffff; color: black; text-decoration: none; border-radius: 5px;}
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

// ---- Chat socket.io (inchangé) ----
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
    console.log(
      "✅ Alpha Launchpad server + chat running at http://localhost:3001"
    );
  });
}

module.exports = app;
