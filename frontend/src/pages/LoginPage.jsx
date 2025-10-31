import React, { use, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { initSocket } from "../lib/socket";

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { signup, login, loading } = useAuthStore();

  const navigate = useNavigate();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      if (currState == "Sign up") {
        if (!isDataSubmitted) {
          setIsDataSubmitted(true);
          return;
        }
        const newUser = await signup({ fullName, email, password, bio });
        // const socket = initSocket();
        toast.success(`Welcome, ${newUser.fullName}!`);
        setTimeout(() => navigate("/"), 1500);
      } else {
        const user = await login({ email, password });
        // const socket = initSocket();
        toast.success(`Welcome back, ${user.fullName}`);
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      toast.error(err.message || "Somethign went wrong!");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center
    gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl"
    >
      {/* ---left---- */}
      <img src={assets.logo_big} alt="" className="w-[min(20vw,250px)]" />

      {/* ----right---- */}
      <form
        onSubmit={onSubmitHandler}
        className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg"
        action=""
      >
        <h2 className="font-medium text-2xl flex justify-between items-center">
          {currState}
          {isDataSubmitted && (
            <img
              onClick={() => {
                setIsDataSubmitted(false);
              }}
              src={assets.arrow_icon}
              alt=""
              className="w-5 cursor-pointer"
            />
          )}
        </h2>

        {currState == "Sign up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            name=""
            id=""
            className="p-2 border border-gray-500 rounded-md focus:outline-none"
            placeholder="Full Name"
            required
          />
        )}

        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Email Address"
              required
              className="p-2 border border-gray-500 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="Password"
              required
              className="p-2 border border-gray-500 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </>
        )}

        {currState == "Sign up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={7}
            name=""
            id=""
            required
            className="p-2 border border-gray-500 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Provide a short Bio..."
          ></textarea>
        )}

        <button
          type="submit"
          className="py-3 bg-gradient-to-r from-purple-400
           to-violet-600 text-white rounded-md cursor-pointer"
        >
          {currState == "Sign up" ? " Create Account" : " Login Now"}
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>
        <div className="flex flex-col gap-2">
          {currState == "Sign up" ? (
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setCurrState("Login");
                  setIsDataSubmitted(false);
                }}
                className="font-medium text-violet-500 cursor-pointer"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Create an account{" "}
              <span
                onClick={() => {
                  setCurrState("Sign up");
                }}
                className="font-medium text-violet-500 cursor-pointer"
              >
                Click here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
