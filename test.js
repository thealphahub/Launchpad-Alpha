const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { generateTokenWebsite } = require('./generateTokenWebsite');
const { generateStyledHtml } = require('./styledHtml');

const token = {
  name: "<script>alert('x')</script>",
  ticker: "HACK",
  imageUrl: "test.png",
  description: "desc <b>bold</b>",
  slug: "hack"
};

const tokensPath = path.join(__dirname, 'tokens.json');
const original = fs.existsSync(tokensPath) ? fs.readFileSync(tokensPath, 'utf8') : '[]';

fs.writeFileSync(tokensPath, JSON.stringify([token], null, 2));

const html1 = generateStyledHtml(token);
assert(html1.includes('&lt;script&gt;'));
assert(!html1.includes("<script>alert('x')</script>"));

const dir = path.join(__dirname, 'public', 'hack');
if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

generateTokenWebsite(token);
const html2 = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
assert(html2.includes('&lt;script&gt;'));
assert(!html2.includes("<script>alert('x')</script>"));

const stored = JSON.parse(fs.readFileSync(tokensPath, 'utf8'))[0];
assert.strictEqual(stored.name, "<script>alert('x')</script>");

fs.writeFileSync(tokensPath, original);
console.log('All tests passed');
