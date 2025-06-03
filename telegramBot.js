// 📦 Alpha Launchpad Telegram Bot 
const TelegramBot = require("node-telegram-bot-api");
const TOKEN = "7992326598:AAEIDDVVKWPD-WPrMVZx3lL6e71BQAyH3As";
const bot = new TelegramBot(TOKEN, { polling: true });

// 🔔 Répond aux messages manuels (debug/test)
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  console.log(`📨 Message from ${msg.from.first_name} 🚀: ${text}`);

  if (text === "/start") {
    bot.sendMessage(chatId, `👋 Hello ${msg.from.first_name} 🚀! Your message: "${text}"`);
  } else {
    bot.sendMessage(chatId, `👋 Hello ${msg.from.first_name} 🚀! Your message: "${text}"`);
  }
});

// ✅ Crée automatiquement un groupe Telegram pour un token
function createTokenGroup({ name, ticker, url }) {
  const groupName = `${name} ($${ticker}) Official Group`;

  // ⚠️ On ne peut pas créer un vrai groupe par API sans une interface manuelle (restriction Telegram)
  console.log("📢 Groupe à créer manuellement :", groupName);
  console.log("🔗 À ajouter dans la description :", url);

  // Tu peux automatiser avec un bot admin dans un groupe déjà créé
  // Exemple : envoyer un message dans un groupe prédéfini
  // bot.sendMessage("@nom_du_groupe", `🔥 ${name} ($${ticker}) just launched!\n👉 ${url}`);
}

module.exports = { createTokenGroup };
