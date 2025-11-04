import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import prisma from "./prismaClient.js";

const app = express();

const corsOptions = {
  origin: ["https://chattrr.pages.dev", "http://localhost:5173"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

export default app;
