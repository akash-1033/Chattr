import {
  signup,
  login,
  getAllUsers,
  logout,
  getAllUsersExceptMe,
  updateProfile,
} from "../controllers/userController.js";
import prisma from "../prismaClient.js";

export const resolvers = {
  Query: {
    testUsers: () => getAllUsers(),
    getAllUsers: async (_, __, context) => {
      if (!context.user) throw new Error("Not authenticated");
      return await getAllUsersExceptMe(context.user.userId);
    },

    getConversationById: async (_, { conversationId }) => {
      return await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          users: true,
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: true, receiver: true },
          },
        },
      });
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
