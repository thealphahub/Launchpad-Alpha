const { Connection, clusterApiUrl, Keypair, PublicKey } = require('@solana/web3.js');
const { createMint } = require('@solana/spl-token');
const bs58 = require('bs58');

function loadKeypair() {
  const secret = process.env.SERVER_PRIVATE_KEY;
  if (!secret) throw new Error('SERVER_PRIVATE_KEY not set');
  const secretBytes = bs58.decode(secret);
  return Keypair.fromSecretKey(secretBytes);
}

async function createSolanaToken(authority) {
  const rpcUrl =
    process.env.SOLANA_RPC_URL || 'https://rpc.helius.xyz/?api-key=YOUR_API_KEY';
  const connection = new Connection(rpcUrl, 'confirmed');
  const payer = loadKeypair();
  const mint = await createMint(connection, payer, authority, null, 9);
  return mint.toBase58();
}

module.exports = { createSolanaToken };
