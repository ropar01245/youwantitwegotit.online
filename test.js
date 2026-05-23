const handler = require('./client/api/products.js');
const req = { query: {} };
const res = { setHeader: () => {}, status: (c) => ({ json: (d) => console.log('success', c, d.length), end: () => {} }) };
handler(req, res).catch(console.error);
