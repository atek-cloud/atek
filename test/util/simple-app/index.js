import { serve } from "https://deno.land/std@0.101.0/http/server.ts"

const PORT = Number(Deno.env.get('ATEK_ASSIGNED_PORT'))
const server = serve({ port: PORT });
console.log(`simple-app HTTP webserver running at: http://localhost:${PORT}/`);

for await (const request of server) {
  request.respond({ status: 200, body: `Hello, world!` });
}