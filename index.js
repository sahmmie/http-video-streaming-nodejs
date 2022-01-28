const express = require('express');
const app = express();
const fs = require('fs');
const NetworkSpeed = require('network-speed'); // ES5
const testNetworkSpeed = new NetworkSpeed();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/video/:id', async function (req, res) {
  try {
    const range = req.headers.range || '0';
    if (!range) {
      res.status(400).send('Requires Range header');
    }
// TODO: intended to to a network speed check to determine the chunk size to use
    const speed = await getNetworkDownloadSpeed();
    console.log(speed);

    const videoPath = __dirname + '/public/' + req.params.id;
    const videoSize = fs.statSync(videoPath).size;

    const CHUNK_SIZE = 10 ** 6; // 1MB
    console.log(CHUNK_SIZE);
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
  } catch (error) {
    console.log('====================================');
    console.log(error);
    console.log('====================================');
  }
});

async function getNetworkDownloadSpeed() {
  const baseUrl = 'https://eu.httpbin.org/stream-bytes/500000';
  const fileSizeInBytes = 500000;
  const speed = await testNetworkSpeed.checkDownloadSpeed(
    baseUrl,
    fileSizeInBytes,
  );
 return speed;
}

app.listen(8000, function () {
  console.log('Listening on port 8000!');
});
