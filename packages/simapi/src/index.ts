import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { builder } from './schema/builder.js'
import { fileURLToPath } from 'url'
import fs from 'fs';
import path from 'path';
import { printSchema } from 'graphql'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  schema: builder.toSchema(),
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

// We must start the server before applying the middleware
async function startServer() {
  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(server),
  );

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`Server ready at http://localhost:${PORT}/graphql`);
}

if (process.env.GENERATION) {
  // We're generating the GraphQL schema
  const srcDir = path.join(__dirname, '..', 'src');
  fs.writeFileSync(path.join(srcDir, 'generated', 'schema.graphql'), printSchema(builder.toSchema()))
} else {
  startServer();
}
