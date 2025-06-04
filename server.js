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

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());
app.use(express.json());
app.use("/beta", express.static("beta")); // Sert les pages générées
app.use("/public", express.static("public")); // Sert les mini-sites générés

// REDIRECTION PRINCIPALE
app.get("/", (req, res) => {
  res.redirect("https://thealphahub.fun/launchpad");
});

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
      /* ... ton style ici ... */
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${name} ($${ticker})</h1>
      <img src="${imageUrl}" alt="${name}" />
      <p>${description}</p>
      <div class="footer">Launched with love 💙 from the Alpha Hub beta</div>
      <div class="share">
        <a href="https://twitter.com/intent/tweet?text=Check%20out%20$${ticker}%20launched%20on%20Alpha%20Hub!%20http://localhost:3001/beta/${slug}.html" target="_blank">🚀 Share on X</a>
        <a class="site-link" href="/public/${slug}/index.html" target="_blank">🌐 View Project Site</a>
      </div>
      <div id="claim-section">
        <button id="connect-btn">🔐 Claim This Project</button>
        <p id="claim-status"></p>
      </div>
    </div>

    <!-- 💬 Community Chat with nickname -->
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
      // Claim Project JS
      const slug = window.location.pathname.split("/").pop().replace(".html", "");
      const connectBtn = document.getElementById("connect-btn");
      const status = document.getElementById("claim-status");
      connectBtn.addEventListener("click", async () => {
        if (!window.solana || !window.solana.isPhantom) {
          alert("Phantom wallet not detected!");
          return;
        }
        try {
          const resp = await window.solana.connect();
          const pubkey = resp.publicKey.toString();
          const message = "Je suis le créateur du token " + slug + " - Alpha Hub";
          const encodedMessage = new TextEncoder().encode(message);
          const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
          const payload = {
            slug,
            wallet: pubkey,
            message,
            signature: Array.from(signedMessage.signature),
          };
          const res = await fetch("http://localhost:3001/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (json.success) {
            status.innerText = "✅ Project claimed successfully!";
            connectBtn.disabled = true;
          } else {
            status.innerText = "❌ Claim failed: " + json.message;
          }
        } catch (err) {
          console.error(err);
          status.innerText = "❌ Error during claim.";
        }
      });

      // Chat with pseudo
      const socket = io();
      socket.emit("joinRoom", slug);

      let pseudo = localStorage.getItem("alphaPseudo") || "";

      function setPseudo() {
        const input = document.getElementById("pseudo-input");
        const val = input.value.trim();
        if(val.length > 1) {
          pseudo = val;
          localStorage.setItem("alphaPseudo", pseudo);
          document.getElementById("current-pseudo").innerText = "(You: " + pseudo + ")";
          input.style.display = "none";
          document.querySelector("#chat-nick-section button").style.display = "none";
        }
      }

      window.onload = () => {
        if (pseudo) {
          document.getElementById("current-pseudo").innerText = "(You: " + pseudo + ")";
          document.getElementById("pseudo-input").style.display = "none";
          document.querySelector("#chat-nick-section button").style.display = "none";
        }
      }

      function sendMessage() {
        if(!pseudo) {
          alert("Please set your nickname first!");
          return;
        }
        const input = document.getElementById("chat-input");
        const text = input.value.trim();
        if (text) {
          socket.emit("message", { room: slug, user: pseudo, text });
          input.value = "";
        }
      }

      socket.on("message", ({ user, text }) => {
        const list = document.getElementById("chat-messages");
        const li = document.createElement("li");
        li.textContent = user + ": " + text; // <-- Pas d'accent grave ni de backticks côté serveur !
        list.appendChild(li);
        list.scrollTop = list.scrollHeight;
      });
    </script>
  </body>
  </html>
  `;
}

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

    const url = `http://localhost:3001/beta/${slug}.html`;
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
        /* ... ton style ici ... */
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

server.listen(3001, () => {
  console.log("✅ Alpha Launchpad server + chat running at http://localhost:3001");
});
