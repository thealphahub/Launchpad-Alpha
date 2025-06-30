const { escapeHtml } = require('./utils');

function generateStyledHtml({ name, ticker, imageUrl, description, slug }) {
  const safeName = escapeHtml(name);
  const safeTicker = escapeHtml(ticker);
  const safeDescription = escapeHtml(description);
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta property="og:title" content="${safeName} ($${safeTicker}) - Alpha Launchpad" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:description" content="${safeDescription}" />
    <title>${safeName} ($${safeTicker})</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(to right, #0f2027, #203a43, #2c5364);
        color: white;
        text-align: center;
        padding: 30px;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #1e1e2f;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      }
      img {
        width: 100%;
        max-width: 400px;
        border-radius: 10px;
        margin: 20px 0;
      }
      h1 {
        font-size: 28px;
        color: #00ffff;
      }
      p {
        font-size: 16px;
        margin-bottom: 10px;
      }
      .footer {
        margin-top: 20px;
        font-weight: bold;
        color: #b0e0ff;
      }
      .share {
        margin-top: 20px;
      }
      .share a {
        background: #00acee;
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 10px;
      }
      .site-link {
        background: #00ffae !important;
        color: black !important;
      }
      #connect-btn {
        padding:10px 20px;
        font-size:16px;
        background:#00ffff;
        border:none;
        border-radius:6px;
        cursor:pointer;
        margin-top: 20px;
      }
      #claim-status {
        margin-top:10px;
        color:#00ffae;
      }
      /* Style pour le chat */
      #chat {
        margin-top: 40px;
        background: #232346;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.20);
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
      }
      #chat h3 {
        margin-top: 0;
        color: #00ffff;
      }
      #chat-messages {
        background: #19193b;
        padding: 10px;
        border-radius: 8px;
        min-height: 60px;
        margin-bottom: 12px;
        text-align: left;
        font-size: 15px;
        max-height: 180px;
        overflow-y: auto;
        list-style: none;
      }
      #chat-messages li {
        margin-bottom: 6px;
        word-break: break-word;
      }
      #chat-nick-section input {
        padding:8px;
        width:60%;
      }
      #chat-nick-section button {
        padding:8px 10px;
        margin-left:8px;
        background:#00ffff;
        border:none;
        border-radius:5px;
      }
      #chat-input {
        padding: 8px;
        width: 70%;
        margin-right: 10px;
      }
      #chat button.send-btn {
        padding:8px 15px;
        background: #00ffff;
        border: none;
        border-radius: 5px;
        margin-left: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${safeName} ($${safeTicker})</h1>
      <img src="${imageUrl}" alt="${safeName}" />
      <p>${safeDescription}</p>
      <div class="footer">Powered by The Alpha Hub</div>
      <div class="share">
        <a href="https://twitter.com/intent/tweet?text=Check%20out%20$${ticker}%20launched%20on%20Alpha%20Hub!%20http://localhost:3001/beta/${slug}.html" target="_blank">🚀 Share on X</a>
        <a class="site-link" href="/public/${slug}/index.html" target="_blank">🌐 View Project Site</a>
      </div>
      <!-- 🔐 Claim Project Section -->
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
        li.textContent = \`\${user}: \${text}\`;
        list.appendChild(li);
        list.scrollTop = list.scrollHeight;
      });
    </script>
  </body>
  </html>
  `;
}

module.exports = { generateStyledHtml };
