export const GET_ALL_USERS = `
  query GetAllUsers {
    getAllUsers {
      id
      fullName
      bio
      profilePicUrl
    }
  }
`;

export const GET_CONVERSATION = `query GetConversation($conversationId: ID!) {
  getConversationById(conversationId: $conversationId) {
    id
    users { id fullName profilePic }
    messages {
      id content senderId receiverId createdAt attachment conversationId read
      sender { id fullName profilePic }
      receiver { id fullName profilePic }
    }
    createdAt updatedAt
  }
}`;

export const GET_OR_CREATE_CONVERSATION_WITH = `
  query GetOrCreateConversationWith($userId: ID!) {
    getOrCreateConversationWith(userId: $userId) {
      id
      users { id fullName profilePic }
      messages {
        id content senderId receiverId createdAt attachment conversationId read
        sender { id fullName profilePic }
        receiver { id fullName profilePic }
      }
      createdAt updatedAt
    }
  }
`;
