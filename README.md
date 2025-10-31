# 💬 Chattr — Real-Time Messaging App

Chattr is a full-stack, **real-time messaging platform** built with **Node.js, React, GraphQL, Prisma, and Socket.IO**.  
It supports one-to-one conversations, instant delivery via WebSockets, and optimistic message updates — all persisted through a lightweight Zustand store with offline support.

---

## 🚀 Features

- 🔐 **JWT Authentication** via HTTP-only cookies  
- ⚡ **Real-time Messaging** with Socket.IO  
- 🗂️ **GraphQL API** for conversations and users  
- 💾 **Zustand + Persist Middleware** for local state caching  
- 💬 **Optimistic UI** for instant message send feedback  
- 🔁 **Auto-join Conversation Rooms** for authenticated users  
- 🌐 **Cross-origin Safe Socket Connection** (CORS & cookies handled)  
- 🧩 **Modular Architecture** — GraphQL + WebSocket layers separated  
- 🧠 **Dedupe & Merge Logic** ensures message consistency after refresh  

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React.js + Vite | UI, socket connection, state management |
| **State Management** | Zustand (with `persist`) | Stores conversations, sockets, active chat |
| **Backend** | Node.js + Express | Server runtime, GraphQL + Socket.IO integration |
| **API** | GraphQL + `graphql-request` | Conversation & message fetching/creation |
| **Database** | PostgreSQL (via Prisma ORM) | Persistent storage of users, messages, conversations |
| **Realtime** | Socket.IO | Live chat and event broadcasting |
| **Auth** | JWT + Cookies | Secure, stateless authentication |
| **Dev Tools** | Vite, Nodemon, ESLint | Development and linting setup |

---
