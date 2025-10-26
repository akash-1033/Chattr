import http, { Server } from "http";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import app from "./app.js";

const JWT_SECRET = process.env.JWT_SECRET;

import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

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
      return {req, res, user};
    },
  });

  await apollo.start();
  apollo.applyMiddleware({ app, path: "/graphql" });

  const httpServer = http.createServer(app);

  httpServer.listen(PORT, () => {
    console.log(`Server running at PORT: ${PORT} ${apollo.graphqlPath}`);
  });
}

start().catch((err) => {
  console.log("Failes to start server ", err);
  process.exit(1);
});
