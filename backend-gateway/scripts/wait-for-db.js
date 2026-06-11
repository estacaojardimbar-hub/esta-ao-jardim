const net = require('net');

const host = process.env.DB_HOST || 'db';
const port = Number(process.env.DB_PORT || '5432');
const timeoutMs = 120000;
const intervalMs = 1500;

function waitForDatabase() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const socket = net.createConnection({ host, port }, () => {
        socket.end();
        resolve();
      });

      socket.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for database at ${host}:${port}`));
          return;
        }
        setTimeout(tryConnect, intervalMs);
      });
    };

    tryConnect();
  });
}

waitForDatabase()
  .then(() => {
    console.log(`Database is available at ${host}:${port}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
