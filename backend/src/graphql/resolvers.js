import {
  signup,
  login,
  getAllUsers,
  logout,
  getAllUsersExceptMe,
  updateProfile,
} from "../controllers/userController.js";
import prisma from "../prismaClient.js";
import { deleteFromS3, uploadToS3 } from "../config/s3.js";
import { generateCloudUrl } from "../utils/cloudfront.js";

export const resolvers = {
  Query: {
    testUsers: () => getAllUsers(),
    getAllUsers: async (_, __, context) => {
      if (!context.user) throw new Error("Not authenticated");
      return await getAllUsersExceptMe(context.user.userId);
    },

    getConversationById: async (_, { conversationId }) => {
      const convo = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          users: true,
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: true, receiver: true },
          },
        },
      });
      if (!convo) throw new Error("Conversation not found");

      for (const msg of convo.messages) {
        if (msg.attachment) {
          msg.imageUrl = await generateCloudUrl(msg.attachment);
          // console.log(msg.imageUrl);
        }
      }
      return convo;
    },

    getOrCreateConversationWith: async (_, { userId }, context) => {
      if (!context.user) throw new Error("Not authenticated");
      const me = context.user.userId;

      let conversation = await prisma.conversation.findFirst({
        where: {
          users: { some: { id: me } },
          AND: { users: { some: { id: userId } } },
        },
        include: {
          users: true,
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: true, receiver: true },
          },
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { users: { connect: [{ id: me }, { id: userId }] } },
          include: {
            users: true,
            messages: {
              orderBy: { createdAt: "asc" },
              include: { sender: true, receiver: true },
            },
          },
        });
      }
      for (const msg of conversation.messages) {
        if (msg.attachment) {
          msg.imageUrl = await generateCloudUrl(msg.attachment);
          // console.log(msg.imageUrl);
        }
      }

      return conversation;
    },
  },

  Mutation: {
    signup: (_, args, context) => signup(args, context.res),
    login: (_, args, context) => login(args, context.res),
    logout: (_, __, context) => logout(context.res),
    updateProfile: async (_, args, context) => {
      if (!context.user) throw new Error("Not authenticated");
      return await updateProfile(context.user.userId, args);
    },
  },
};
