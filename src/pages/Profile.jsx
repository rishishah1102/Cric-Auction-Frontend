import React, { useContext, useEffect, useState } from "react";
import "../style/profile.css";
import FormInput from "../components/profile/Input";
import auctionContext from "../context/auctionContext";
import { motion } from "framer-motion";
// import GavelIcon from '@mui/icons-material/Gavel';

// axios
import axios from "axios";
import { instance } from "../utils/axios";

// toast
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const roles = [
  "Batter",
  "Bowler",
  "All-Rounder",
  "Wicket-Keeper",
  "W/K (All-Rounder)",
];
const arm = ["Right", "Left"];
const battingHand = ["Right", "Left"];
const pace = ["Fast", "Medium", "Spin"];
const battingOrder = ["Top", "Middle", "Lower"];
const battingStyle = ["Classic", "Hitter", "Defensive"];

const defaultImgUrl =
  "https://imgs.search.brave.com/wGgfdqlFqaMenZ26MF0WogbGt-djpTOK_PzwLaN1lPs/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzY0LzY3LzI3/LzM2MF9GXzY0Njcy/NzM2X1U1a3BkR3M5/a2VVbGw4Q1JRM3Az/WWFFdjJNNnFrVlk1/LmpwZw";

function Profile() {
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    role: "",
    bowling_arm: "",
    bowling_type: "",
    batting_hand: "",
    batting_order: "",
    batting_style: "",
  });
  const [imageUrl, setImageUrl] = useState(defaultImgUrl);
  const [loading, setLoading] = useState(false);

  const { userData } = useContext(auctionContext);

  useEffect(() => {
    document.title = "Profile";

    if (userData !== (null || undefined) && Object.keys(userData).length !== 0) {
      setProfileData(userData);
      userData.image_url !== (null || undefined) && setImageUrl(userData?.image_url);
    } else {
      fetchData()
    }

    document.body.classList.add("scroll-enabled");
    return () => document.body.classList.remove("scroll-enabled");
  }, [userData]);

  const fetchData = async () => {
    try {
      const res = await instance.get("/profile/get", {
        headers: { Authorization: localStorage.getItem("auction") },
      });
      if (res.status === 200) {
        setProfileData(res.data.profile);
        setImageUrl(res.data.profile?.image_url);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Please login again!")
      } else {
        toast.error("Please try again later!")
      }
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_UPLOAD_PRESET);
    formData.append("cloud_name", process.env.REACT_APP_CLOUD_NAME);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/image/upload`,
        formData
      );
      setImageUrl(response.data.secure_url);
    } catch (error) {
      toast.error("Failed to upload the photo!");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const reqData = {
        ...profileData,
        image_url: imageUrl,
      };
      
      const res = await instance.post("/profile/save", reqData, {
        headers: { Authorization: localStorage.getItem("auction") },
      });
      if (res.status === 200) {
        toast.success("Profile updated successfully!");
        window.location.reload()
      }
    } catch (error) {
      if (error.response.status === 401) {
        toast.error("Unauthorized, Please login again!");
      } else {
        toast.error("Internal Server Error!");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      <div className="profile-container">
        {/* <div className="profile-header">
          <GavelIcon /> Set up your Profile
        </div> */}

        <div className="profile-body-animation" />
        <div className="profile-body">
          <div className="avatar-section">
            {loading ? (
              <div className="loader">
                <div className="spinner" />
              </div>
            ) : (
              <div className="avatar-wrapper">
                <img src={imageUrl} className="avatar-image" alt="" />
              </div>
            )}
            <div className="file-input-wrapper">
              <label className="file-input-label">
                Change Photo
                <input
                  type="file"
                  className="file-input"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          <div className="form-grid">
            <FormInput
              name="first_name"
              title="First Name"
              type="text"
              placeholder="eg: John"
              value={profileData?.first_name}
              onChange={handleChange}
            />
            <FormInput
              name="last_name"
              title="Last Name"
              type="text"
              placeholder="eg: Doe"
              value={profileData?.last_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid">
            <FormInput
              name="role"
              title="Role"
              type="select"
              options={roles}
              value={profileData?.role}
              onChange={handleChange}
            />
            <FormInput
              name="batting_hand"
              title="Batting Hand"
              type="select"
              options={battingHand}
              value={profileData?.batting_hand}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid">
            <FormInput
              name="batting_order"
              title="Batting Order"
              type="select"
              options={battingOrder}
              value={profileData?.batting_order}
              onChange={handleChange}
            />
            <FormInput
              name="batting_style"
              title="Batting Style"
              type="select"
              options={battingStyle}
              value={profileData?.batting_style}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid">
            <FormInput
              name="bowling_arm"
              title="Bowling Arm"
              type="select"
              options={arm}
              value={profileData?.bowling_arm}
              onChange={handleChange}
            />
            <FormInput
              name="bowling_type"
              title="Bowling Type"
              type="select"
              options={pace}
              value={profileData?.bowling_type}
              onChange={handleChange}
            />
          </div>

          <button className="save-button" onClick={saveProfile}>
            Save Profile
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default Profile;
