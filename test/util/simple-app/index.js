import http from 'http'

const PORT = Number(process.env.ATEK_ASSIGNED_PORT)
http.createServer((req, res) => {
  res.writeHead(200).end('Hello, world!')
}).listen(PORT, e => {
  console.log(`simple-app HTTP webserver running at: http://localhost:${PORT}/`);
})