const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { createMint } = require('@solana/spl-token');
require('dotenv').config();

const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');

function getServerKeypair() {
  const secret = process.env.SERVER_KEYPAIR;
  if (!secret) throw new Error('SERVER_KEYPAIR not set');
  const secretKey = JSON.parse(secret);
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function createToken() {
  const payer = getServerKeypair();
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    9
  );
  return mint.toBase58();
}

async function verifyFee(txSignature) {
  const tx = await connection.getParsedTransaction(txSignature, {
    commitment: 'confirmed'
  });
  if (!tx) return false;

  const expectedLamports = parseFloat(process.env.CREATION_FEE) * LAMPORTS_PER_SOL;
  const destination = process.env.FEE_DESTINATION;
  if (!destination) return false;

  for (const inst of tx.transaction.message.instructions) {
    if (inst.program === 'system' && inst.parsed && inst.parsed.type === 'transfer') {
      const info = inst.parsed.info;
      if (info.destination === destination && Number(info.lamports) === expectedLamports) {
        return true;
      }
    }
  }
  return false;
}

module.exports = { connection, createToken, verifyFee };
