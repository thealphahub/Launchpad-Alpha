const { Connection, clusterApiUrl, Keypair } = require('@solana/web3.js');
const { createMint } = require('@solana/spl-token');
const bs58 = require('bs58');

function loadKeypair() {
  const secret = process.env.SERVER_PRIVATE_KEY;
  if (!secret) throw new Error('SERVER_PRIVATE_KEY not set');
  const secretBytes = bs58.decode(secret);
  return Keypair.fromSecretKey(secretBytes);
}

async function createSolanaToken(authority) {
  const connection = new Connection(clusterApiUrl(process.env.SOLANA_CLUSTER || 'devnet'), 'confirmed');
  const payer = loadKeypair();
  const mint = await createMint(connection, payer, authority, null, 9);
  return mint.toBase58();
}

module.exports = { createSolanaToken };
