import { create } from "zustand";
import { persist } from "zustand/middleware";
import { graphqlClient } from "../lib/graphqlClient";
import {
  SIGNUP_MUTATION,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
} from "../graphql/userMutations";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,

      signup: async (formData) => {
        set({ loading: true, error: null });
        try {
          const data = await graphqlClient.request(SIGNUP_MUTATION, formData);
          const user = data.signup.user;
          set({ user, loading: false });
          return user;
        } catch (err) {
          console.error("Signup Error:", err);
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      login: async ({ email, password }) => {
        set({ loading: true, error: null });
        try {
          const data = await graphqlClient.request(LOGIN_MUTATION, {
            email,
            password,
          });
          const user = data.login.user;
          set({ user, loading: false });
          return user;
        } catch (err) {
          console.error("Login Error:", err);
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await graphqlClient.rawRequest(LOGOUT_MUTATION);
        } catch (err) {
          console.warn("Logout error (ignored):", err.message);
        }
        set({ user: null });
      },
    }),
    {
      name: "chattr-auth",
      getStorage: () => localStorage,
    }
  )
);
