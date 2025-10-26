import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import prisma from "./prismaClient.js";

const app = express();

app.use(cors());
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.path === "/graphql") {
    return next();
  }
  express.json()(req, res, next);
});

app.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

export default app;
