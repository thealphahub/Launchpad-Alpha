const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'tokens.db');
const db = new sqlite3.Database(dbPath);

// Initialize table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    ticker TEXT,
    slug TEXT UNIQUE,
    imageUrl TEXT,
    description TEXT,
    mintAddress TEXT,
    owner TEXT
  )`);
});

function createToken({ name, ticker, slug, imageUrl, description, mintAddress }) {
  return new Promise((resolve, reject) => {
    const stmt = `INSERT INTO tokens (name, ticker, slug, imageUrl, description, mintAddress) VALUES (?,?,?,?,?,?)`;
    db.run(stmt, [name, ticker, slug, imageUrl, description, mintAddress || null], function(err){
      if(err) return reject(err);
      resolve(this.lastID);
    });
  });
}

function getTokenBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM tokens WHERE slug = ?`, [slug], (err, row) => {
      if(err) return reject(err);
      resolve(row);
    });
  });
}

function claimToken(slug, owner) {
  return new Promise((resolve, reject) => {
    const stmt = `UPDATE tokens SET owner = ? WHERE slug = ?`;
    db.run(stmt, [owner, slug], function(err){
      if(err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  createToken,
  getTokenBySlug,
  claimToken,
};
