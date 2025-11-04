import http from "http";
import express from "express";
import { Server as IOServer } from "socket.io";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import initSocket from "./sockets/socketHandler.js";

const corsOptions = {
  origin: ["http://localhost:5173", "https://chattrr.pages.dev"],
  credentials: true,
};

dotenv.config();

import app from "./app.js";

const JWT_SECRET = process.env.JWT_SECRET;

import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";

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
        } catch {}
      }
      return { req, res, user };
    },
  });

  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  await apollo.start();
  apollo.applyMiddleware({ app, path: "/graphql", cors: false });

  const httpServer = http.createServer(app);

  const io = new IOServer(httpServer, {
    path: "/socket.io",
    cors: corsOptions,
  });
  initSocket(io, JWT_SECRET);

  httpServer.listen(PORT, () => {
    console.log(`Server running at PORT: ${PORT} ${apollo.graphqlPath}`);
  });
}

start().catch((err) => {
  console.log("Failes to start server ", err);
  process.exit(1);
});
