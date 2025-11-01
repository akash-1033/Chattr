import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar DateTime

  type Query {
    testUsers: [User!]!
    getAllUsers: [User]
    getConversationById(conversationId: ID!): Conversation!
    getOrCreateConversationWith(userId: ID!): Conversation!
  }

  type User {
    id: ID!
    fullName: String!
    email: String!
    profilePic: String
    profilePicUrl: String
    bio: String
    createdAt: String!
    updatedAt: String!
  }

  type UserPayload {
    user: User!
  }

  type Message {
    id: ID!
    content: String
    senderId: ID!
    receiverId: ID!
    read: Boolean!
    attachment: String
    imageUrl: String
    createdAt: DateTime!
    sender: User!
    receiver: User!
    conversationId: ID
  }

  type Conversation {
    id: ID!
    users: [User!]!
    messages: [Message!]!
    createdAt: DateTime!
    updatedAt: DateTime!
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

    updateProfile(
      fullName: String
      bio: String
      fileName: String
      contentType: String
      fileBuffer: String
    ): User!
  }
`;
