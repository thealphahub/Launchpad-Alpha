# Launchpad-Alpha

This project powers a token launchpad and related utilities.

## Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Create a `.env` file and define the following environment variables:
   - `SERVER_PRIVATE_KEY` – base58 encoded secret key used by the server to pay transaction fees.
   - `SOLANA_RPC_URL` – RPC endpoint for Solana. Defaults to `https://rpc.helius.xyz/?api-key=YOUR_API_KEY` on `mainnet-beta`.
   - `OPENAI_API_KEY` – API key used to generate images.
   - `TELEGRAM_BOT_TOKEN` – token for the Telegram bot.
   - `API_BASE_URL` – (optional) base URL used by browser scripts when calling the server.

Run the server with:
```bash
npm start
```
