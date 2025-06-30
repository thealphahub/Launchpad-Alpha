const fs = require('fs');
const { Connection, Keypair, clusterApiUrl } = require('@solana/web3.js');
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} = require('@solana/spl-token');

require('dotenv').config();

async function mintToken({ decimals = 9, initialSupply = 0 } = {}) {
  const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
  const keypairPath = process.env.SOLANA_KEYPAIR_PATH;

  if (!keypairPath) {
    throw new Error('SOLANA_KEYPAIR_PATH env var is required');
  }

  const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const connection = new Connection(rpcUrl, 'confirmed');

  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    decimals
  );

  if (initialSupply > 0) {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );

    await mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer.publicKey,
      initialSupply
    );
  }

  return mint.toBase58();
}

module.exports = { mintToken };
