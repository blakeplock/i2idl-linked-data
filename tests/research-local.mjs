
import { createServer } from 'node:http';
import handler from '../api/research.mjs';

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');

  if (url.pathname !== '/api/research') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  req.query = Object.fromEntries(url.searchParams);

  res.status = function (code) {
    this.statusCode = code;
    return this;
  };

  res.json = function (data) {
    this.end(JSON.stringify(data));
    return this;
  };

  await handler(req, res);
}).listen(3000, '127.0.0.1', () => {
  console.log('Research test server: http://localhost:3000');
});

