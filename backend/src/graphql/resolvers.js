import { signup, login, getAllUsers } from "../controllers/userController.js";

export const resolvers = {
  Query: {
    testUsers: () => getAllUsers(),
  },

  Mutation: {
    signup: (_, args) => signup(args),
    login: (_, args) => login(args),
  },
};
