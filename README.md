# Alpha Launchpad

This project hosts a small token launchpad built with Node.js and Express. It can generate images using OpenAI, mint Solana tokens and create basic web pages for each token.

## Environment Variables
Create a `.env` file based on the `.env.example` template. The following variables are used:

- `OPENAI_API_KEY` - API key for OpenAI used by `imageGenerator.js` to create token images.
- `TELEGRAM_BOT_TOKEN` - Token for the Telegram bot defined in `telegramBot.js`.
- `SERVER_PRIVATE_KEY` - Base58 encoded private key used to pay fees and mint new tokens in `solanaToken.js`.
- `SOLANA_CLUSTER` - Solana cluster endpoint (e.g. `devnet`, `testnet`, or `mainnet-beta`). Defaults to `devnet` if not set.

The application listens on port `3001` by default.

