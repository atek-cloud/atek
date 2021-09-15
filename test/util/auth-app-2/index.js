import express from 'express'
import { createRpcServer } from '@atek-cloud/node-rpc'

const api = createRpcServer({
  getAuthHeaders () {
    return {
      user: this.req.headers['atek-auth-user'],
      service: this.req.headers['atek-auth-service']
    }
  }
})

const SOCKETFILE = process.env.ATEK_ASSIGNED_SOCKET_FILE
const app = express()
app.use(express.json())
app.get('/', (req, res) => res.status(200).end('Hello!'))
app.post('/_api', (req, res) => api.handle(req, res, req.body))
app.listen(SOCKETFILE, e => {
  console.log(`auth-app-2 HTTP webserver running at`, SOCKETFILE)
})