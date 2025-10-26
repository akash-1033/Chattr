import prisma from "../prismaClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const signup = async (req) => {
  const { fullName, email, password, profilePic, bio } = req;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { fullName, email, password: hashedPassword, profilePic, bio },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  return { token, user };
};

export const login = async (req) => {
  const { email, password } = req;

  const user = await prisma.user.findUnique({ where: {email} });
  if (!user) {
    throw new Error("User doesnt exits");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error("Wrong password");
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  return { token, user };
};

export const getAllUsers = async () => {
  return await prisma.user.findMany();
};
