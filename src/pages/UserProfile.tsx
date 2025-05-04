import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import React, { useState } from "react";

const UserProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    bio: "A passionate developer.",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log("Profile Saved:", profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <>
    <Navbar />
    {/* <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/30 via-secondary/20 to-background/30"> */}
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/30 via-secondary/20 to-background/30 pt-20">


      {/* Blurred floating background shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute bg-primary/20 w-80 h-80 rounded-full filter blur-3xl opacity-40 animate-float"></div>
        <div className="absolute bg-secondary/20 w-64 h-64 rounded-full filter blur-2xl opacity-30 top-40 left-20 animate-float-delay"></div>
        <div className="absolute bg-accent/20 w-72 h-72 rounded-full filter blur-2xl opacity-30 bottom-10 right-10 animate-float"></div>
      </div>

      {/* Profile Content */}
      <div className="relative z-10 max-w-2xl mx-auto p-6 space-y-8">
        {/* Avatar */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src="https://via.placeholder.com/120"
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-primary hover:scale-105 transition-transform"
          />
          <div className="text-center">
            <h2 className="text-2xl font-semibold">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="glass-effect rounded-2xl shadow-md p-6 space-y-6 backdrop-blur-md bg-white/10 border border-white/20">
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-transparent border-b border-input focus:outline-none focus:border-primary py-2 px-1 disabled:text-muted-foreground"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-transparent border-b border-input focus:outline-none focus:border-primary py-2 px-1 disabled:text-muted-foreground"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-transparent border-b border-input focus:outline-none focus:border-primary py-2 px-1 disabled:text-muted-foreground"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-transparent border-b border-input focus:outline-none focus:border-primary py-2 px-1 disabled:text-muted-foreground"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-transparent border-b border-input focus:outline-none focus:border-primary py-2 px-1 disabled:text-muted-foreground resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            {isEditing ? (
              <>
                <button
                  className="px-4 py-2 rounded-md bg-muted hover:bg-muted-foreground text-foreground transition-default"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition-default"
                  onClick={handleSave}
                >
                  Save
                </button>
              </>
            ) : (
              <button
                className="px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-default"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default UserProfile;
