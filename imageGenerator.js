const OpenAI = require("openai");

// Sécurité : n’écris jamais ta clé directement ici ! Utilise le .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateImageFromPrompt(prompt) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    return response.data[0].url;
  } catch (error) {
    console.error("❌ Erreur lors de la génération d’image :", error);
    throw error;
  }
}

module.exports = { generateImageFromPrompt };
