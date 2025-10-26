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

  type AuthPayload {
    token: String!
    user: User!
  }

  type Mutation {
    signup(
      fullName: String!
      email: String!
      password: String!
      profilePic: String
      bio: String
    ): AuthPayload!

    login(email: String!, password: String!): AuthPayload!
  }
`;
