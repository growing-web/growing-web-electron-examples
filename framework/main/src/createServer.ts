import { createServer } from 'http'
import fs from 'fs'
import path from 'path'
import { getPort } from 'get-port-please'

export async function createAppServer() {
  const port = await getPort({ random: !__DEV__ })

  const server = createServer((req, res) => {
    let filePath = path.join(__dirname, '../../../apps', req.url!)
    route(req, res, filePath)
  })
  server.listen(port)
  console.log(`Server Run: http://localhost:${port}`)
  return {
    port: port,
  }
}

function route(req, res, _filePath) {
  const ext = path.extname(_filePath)
  const filePath = !ext ? `${_filePath}.html` : _filePath
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.statusCode = 404
      res.setHeader('content-type', 'text/plain')
      res.end(`${filePath} is not a file`)
      return
    }
    if (stats.isFile()) {
      const ext = path.extname(filePath)
      let miniType = 'text/html'
      if (ext === '.js') {
        miniType = 'application/javascript'
      }
      res.statusCode = 200
      res.setHeader('content-type', `${miniType}; charset=utf-8`)
      res.setHeader('Cache-Control', `public, max-age=0`)
      const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
      res.end(content)
    }
  })
}
