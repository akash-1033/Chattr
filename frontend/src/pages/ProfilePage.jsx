import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import assets from "../assets/assets";

const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();

  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState("Akash");
  const [bio, setBio] = useState("Hello");
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.fullName || "");
      setBio(user.bio || "");
      setProfilePic(user.profilePicUrl);
    }
  }, [user]);

  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileBuffer = null;
      let fileName = null;
      let contentType = null;

      if (selectedImage) {
        const base64 = await toBase64(selectedImage);
        fileBuffer = base64.split(",")[1];
        contentType = selectedImage.type;
        fileName = selectedImage.name;
      }
      const variables = {
        fullName: name,
        bio,
        fileBuffer,
        contentType,
        fileName,
      };

      const updatedUser = await updateProfile(variables);
      console.log(updatedUser);
      toast.success("User details updated!");
    } catch (err) {
      toast.error(err.message || "Somethign went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-no-repeat flex items-center 
  justify-center"
    >
      <div
        className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2
      border-gray-600 flex items-center justify-between max-sm:flex-col-reverse
      rounded-lg"
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-10 flex-1"
          action=""
        >
          <h3 className="text-lg">Profile details</h3>
          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer"
          >
            <input
              onChange={(e) => setSelectedImage(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpeg, .jpg"
              hidden
            />
            <img
              src={
                selectedImage ? URL.createObjectURL(selectedImage) : profilePic
              }
              alt=""
              className={`w-12 h-12 ${selectedImage && "rounded-full"}`}
            />
            Upload profile image
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder="Your name"
            className="p-2 border
          border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={5}
            name=""
            id=""
            placeholder="Write a profile bio.."
            required
            className="p-2 border
          border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          ></textarea>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-400 to_violet-600 text-white p-2
          rounded-full text-lg cursor-pointer"
          >
            Save
          </button>
        </form>
        <img
          className="max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10"
          src={selectedImage ? URL.createObjectURL(selectedImage) : profilePic}
          alt=""
        />
      </div>
    </div>
  );
};

export default ProfilePage;
