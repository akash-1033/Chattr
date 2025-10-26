import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Query {
    testUsers: [User!]!
  }

  type User {
    id: ID!
    fullName: String!
    email: String!
    profilePic: String
    bio: String
    createdAt: String!
    updatedAt: String!
  }

  type UserPayload {
    user: User!
  }

  type Mutation {
    signup(
      fullName: String!
      email: String!
      password: String!
      profilePic: String
      bio: String
    ): UserPayload!

    login(email: String!, password: String!): UserPayload!

    logout: Boolean! 
  }
`;
