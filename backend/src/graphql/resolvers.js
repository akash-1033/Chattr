import { signup, login, getAllUsers, logout } from "../controllers/userController.js";

export const resolvers = {
  Query: {
    testUsers: () => getAllUsers(),
  },

  Mutation: {
    signup: (_, args, context) => signup(args, context.res),
    login: (_, args, context) => login(args, context.res),
    logout: (_, __, context) => logout(context.res),
  },
};
