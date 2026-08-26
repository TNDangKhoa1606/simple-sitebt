const { createReadStream } = require('node:fs');
const { stat } = require('node:fs/promises');
const { createServer } = require('node:http');
const { extname, join, normalize } = require('node:path');

const port = Number(process.env.PORT ?? 3001);
const publicDirectory = join(__dirname, 'public');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const requestedFile = pathname === '/' ? 'index.html' : pathname.slice(1);
  const safePath = normalize(requestedFile).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = join(publicDirectory, safePath);

  try {
    const file = await stat(filePath);
    if (!file.isFile()) {
      throw new Error('Not a file');
    }

    response.writeHead(200, {
      'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Frontend listening on port ${port}`);
});
