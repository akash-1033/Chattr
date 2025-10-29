import express from "express";
import cookieParser from "cookie-parser";
import prisma from "./prismaClient.js";

const app = express();

app.use(cookieParser());
app.use(express.json());


app.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

export default app;
