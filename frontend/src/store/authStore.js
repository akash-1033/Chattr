import { create } from "zustand";
import { persist } from "zustand/middleware";
import { graphqlClient } from "../lib/graphqlClient";
import {
  SIGNUP_MUTATION,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  UPDATE_PROFILE_MUTATION,
} from "../graphql/userMutations";
import { GET_ALL_USERS } from "../graphql/userQueries";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      users: [],
      onlineUsers: [],
      loading: false,
      error: null,

      setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),

      fetchUsers: async () => {
        try {
          const data = await graphqlClient.request(GET_ALL_USERS);
          set({ users: data.getAllUsers });
        } catch (err) {
          console.error("Failed to fetch users:", err);
        }
      },

      signup: async (formData) => {
        set({ loading: true, error: null });
        try {
          const data = await graphqlClient.request(SIGNUP_MUTATION, formData);
          const user = data.signup.user;
          set({ user, loading: false });
          return user;
        } catch (err) {
          const msg =
            err?.response?.errors?.[0]?.message ||
            err?.message ||
            "Something went wrong. Please try again.";
          console.error("Signup Error:", err);
          set({ error: msg, loading: false });
          throw new Error(msg);
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
          const msg =
            err?.response?.errors?.[0]?.message ||
            err?.message ||
            "Something went wrong. Please try again.";
          console.error("Login Error:", err);
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      logout: async () => {
        try {
          await graphqlClient.rawRequest(LOGOUT_MUTATION);
        } catch (err) {
          const msg =
            err?.response?.errors?.[0]?.message ||
            err?.message ||
            "Something went wrong. Please try again.";
          console.warn("Logout error (ignored):", msg);
        }
        set({ user: null });
      },

      updateProfile: async ({
        fullName,
        bio,
        fileBuffer,
        fileName,
        contentType,
      }) => {
        try {
          const data = await graphqlClient.request(UPDATE_PROFILE_MUTATION, {
            fullName,
            bio,
            fileBuffer,
            fileName,
            contentType,
          });
          const updatedUser = data.updateProfile;
          set({ user: updatedUser, loading: false });
          return updatedUser;
        } catch (err) {
          const msg =
            err?.response?.errors?.[0]?.message ||
            err?.message ||
            "Something went wrong. Please try again.";
          console.log("Update Details Error:", err);
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },
    }),
    {
      name: "chattr-auth",
      getStorage: () => localStorage,
    }
  )
);
