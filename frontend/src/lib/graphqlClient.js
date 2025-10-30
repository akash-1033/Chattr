import { GraphQLClient } from "graphql-request";

const API_URL = import.meta.env.VITE_API_URL;

export const graphqlClient = new GraphQLClient(`${API_URL}/graphql`, {
  credentials: "include",
  mode: "cors",
  headers: {
    "Content-Type": "application/json",
  },
});
