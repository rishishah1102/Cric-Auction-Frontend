// Navbar.js
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/navbar.css";
import auctionContext from "../../context/auctionContext";

// icons
import GavelIcon from "@mui/icons-material/Gavel";
import MenuIcon from "@mui/icons-material/Menu";
import Avatar from "@mui/material/Avatar";
import LogoutIcon from "@mui/icons-material/Logout";

// Components
import NavList from "./NavList";
import routes from "../../utils/routes";
import { profileAPI } from "../../utils/axios";
import { toast } from "react-toastify";

function Navbar({ onOpen }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(true);
  const [profile, setProfile] = useState({
    image_url: "",
    first_name: "",
    last_name: "",
    role: "",
  });
  const navigate = useNavigate();

  const { userData } = useContext(auctionContext);

  useEffect(() => {
    if (userData !== (null || undefined)) {
      setProfile(userData);
    } else {
      fetchData()
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      const res = await profileAPI.get("/profile", {
        headers: { Authorization: localStorage.getItem("auction") },
      });
      if (res.status === 200) {
        setProfile(res.data.userProfile);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Please login again!")
      } else {
        toast.error("Please try again later!")
      }
    }
  };

  const toggleNav = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    // Use setTimeout to defer the parent state update
    setTimeout(() => {
      onOpen(newState);
    }, 0);
  };

  const handleLogOut = () => {
    localStorage.clear("auction");
    navigate("/login");
  };

  useEffect(() => {
    const handleResize = () => {
      // Close sidebar on mobile by default
      if (window.innerWidth < 500) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    window.addEventListener("resize", handleResize);
    // Initialize based on current screen size
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div
        className={`sidebar ${isOpen ? "open" : ""}`}
        style={{ width: isOpen ? "240px" : "72px" }}
      >
        <div className="logo_content">
          <div className="logo" style={{ opacity: isOpen || isMobile ? 1 : 0 }}>
            <GavelIcon />
            <div className="logo_name">Auction</div>
          </div>
          <span
            id="btn"
            onClick={toggleNav}
            style={{ left: isOpen || isMobile ? "92%" : "50%" }}
          >
            <MenuIcon />
          </span>
        </div>
        <ul className="nav_list">
          {routes.map((route, index) => (
            <NavList
              Icon={route.icon}
              name={route.name}
              route={route.path}
              isOpen={isOpen}
              key={index}
            />
          ))}
        </ul>
        <div className="profile_content">
          <div className="profile">
            <div
              className="profile_details"
              style={{ opacity: isOpen ? 1 : 0 }}
            >
              <Avatar src={profile.image_url} />
              <div className="name_job">
                <div className="name">
                  {profile.first_name !== undefined ? profile.first_name : profile.email !== undefined ? profile.email : "John"}{" "}
                  {profile.last_name !== undefined && profile.last_name}
                </div>
                <div className="job">
                  {profile.role !== undefined ? profile.role : "Cricketer"}
                </div>
              </div>
            </div>
            <span
              id="log_out"
              style={{ left: isOpen ? "90%" : "50%" }}
              onClick={handleLogOut}
            >
              <LogoutIcon />
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
