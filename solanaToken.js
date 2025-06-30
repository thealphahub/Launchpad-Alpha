const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
const { Connection, Keypair, clusterApiUrl } = require("@solana/web3.js");

/**
 * Create a new SPL token mint and send an initial supply to the authority.
 * @param {Object} options - Options for mint creation.
 * @param {Connection} options.connection - Solana connection.
 * @param {Keypair} options.payer - Payer for the transactions.
 * @param {Keypair} options.authority - Mint authority that will receive tokens.
 * @param {number} [options.decimals=9] - Number of decimals of the mint.
 * @param {bigint|number} [options.initialSupply=1000000] - Initial amount to mint (before decimals).
 * @returns {Promise<{mintAddress: string, tokenAccount: string}>}
 */
async function createSolanaToken({ connection, payer, authority, decimals = 9, initialSupply = 1_000_000 }) {
  // Create the mint
  const mint = await createMint(
    connection,
    payer,
    authority.publicKey,
    null,
    decimals
  );

  // Create or fetch the associated token account for the authority
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    authority.publicKey
  );

  // Mint initial supply to this account
  const amount = BigInt(initialSupply) * BigInt(10 ** decimals);
  await mintTo(connection, payer, mint, ata.address, authority, amount);

  return { mintAddress: mint.toBase58(), tokenAccount: ata.address.toBase58() };
}

module.exports = { createSolanaToken };
