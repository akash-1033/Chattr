import http from "http";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server as IOServer } from "socket.io";
import { ApolloServer } from "apollo-server-express";

import initSocket from "./sockets/socketHandler.js";
import app from "./app.js";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 4000;

async function start() {
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => {
      const token = req.cookies?.token;
      let user = null;

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          user = { userId: decoded.userId };
        } catch (err) {
          console.error("Invalid token:", err.message);
        }
      }

      return { req, res, user };
    },
  });

  await apollo.start();
  apollo.applyMiddleware({ app, path: "/graphql", cors: false });

  const httpServer = http.createServer(app);

  const io = new IOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: ["https://chattrr.pages.dev", "http://localhost:5173"],
      credentials: true,
    },
  });

  initSocket(io, JWT_SECRET);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}${apollo.graphqlPath}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
