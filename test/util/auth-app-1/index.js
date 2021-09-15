import express from 'express'
import { createRpcServer, rpc } from '@atek-cloud/node-rpc'

const authApp2Api = rpc('auth-app-two.com/api')

const api = createRpcServer({
  getAuthHeaders () {
    return {
      user: this.req.headers['atek-auth-user'],
      service: this.req.headers['atek-auth-service']
    }
  },
  getAuthHeadersFromApp2 () {
    return authApp2Api.getAuthHeaders()
  }
})

const SOCKETFILE = process.env.ATEK_ASSIGNED_SOCKET_FILE
const app = express()
app.use(express.json())
app.get('/', (req, res) => res.status(200).end('Hello!'))
app.post('/_api', (req, res) => api.handle(req, res, req.body))
app.listen(SOCKETFILE, e => {
  console.log(`auth-app-1 HTTP webserver running at`, SOCKETFILE)
})