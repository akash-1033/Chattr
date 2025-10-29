import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <>
  <BrowserRouter>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
  </BrowserRouter>
  </>
);
