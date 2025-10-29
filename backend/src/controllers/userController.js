import prisma from "../prismaClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { deleteFromS3, uploadToS3 } from "../config/s3.js";
import { generateCloudUrl } from "../utils/cloudfront.js";

const DEFAULT_AVATAR_KEY = "profileImages/image.png";
const JWT_SECRET = process.env.JWT_SECRET;

export const signup = async (req, res) => {
  const { fullName, email, password, profilePic, bio } = req;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
      profilePic: DEFAULT_AVATAR_KEY,
      bio,
    },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const profilePicUrl = generateCloudUrl(user.profilePic);
  return { user: { ...user, profilePicUrl } };
};

export const login = async (req, res) => {
  const { email, password } = req;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User doesnt exits");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error("Wrong password");
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const profilePicUrl = generateCloudUrl(user.profilePic);
  return { user: { ...user, profilePicUrl } };
};

export const getAllUsers = async () => {
  return await prisma.user.findMany();
};

export const logout = async (res) => {
  res.clearCookie("token");
  return true;
};

export const updateProfile = async (userId, args) => {
  const { fullName, bio, fileBuffer, contentType, fileName } = args;

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) {
    throw new Error("User Not Found");
  }
  let newProfileKey = currentUser.profilePic;

  if (fileBuffer && contentType && fileName) {
    if (
      currentUser.profilePic &&
      currentUser.profilePic !== DEFAULT_AVATAR_KEY
    ) {
      await deleteFromS3(currentUser.profilePic);
    }
    const timestamp = Date.now();
    newProfileKey = `profileImages/${userId}_${timestamp}_${fileName}`;
    await uploadToS3(fileBuffer, newProfileKey, contentType);
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: fullName || undefined,
      bio: bio || undefined,
      profilePic: newProfileKey,
    },
  });
  const profilePicUrl = generateCloudUrl(newProfileKey);
  return { ...updated, profilePicUrl };
};

export const getAllUsersExceptMe = async (userId) => {
  const users = await prisma.user.findMany({
    where: { NOT: { id: userId } },
    select: { id: true, fullName: true, profilePic: true, bio: true },
  });

  return users.map((u) => ({
    ...u,
    profilePicUrl: generateCloudUrl(u.profilePic),
  }));
};
