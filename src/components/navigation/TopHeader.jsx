import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Avatar from "@mui/material/Avatar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import auctionContext from "../../context/auctionContext";
import "../../style/bottomnav.css";

function TopHeader({ mode = "lobby", auction }) {
  const navigate = useNavigate();
  const { userData } = useContext(auctionContext);

  const handleLogout = () => {
    localStorage.removeItem("auction");
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  };

  if (mode === "live") return null;

  return (
    <motion.header
      className="top-header"
      initial={{ y: -56 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      {mode === "lobby" ? (
        <>
          <div className="header-logo">
            <motion.div
              whileHover={{ rotate: [0, -12, 12, 0] }}
              transition={{ duration: 0.4 }}
            >
              <SportsCricketIcon className="header-logo-icon" sx={{ fontSize: 26 }} />
            </motion.div>
            <span>Cricket Auction</span>
          </div>
          <div className="header-right">
            <motion.div
              className="header-avatar"
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate("/profile")}
            >
              <Avatar
                src={userData?.image_url}
                sx={{ width: 34, height: 34 }}
              />
            </motion.div>
            <motion.button
              className="header-logout"
              onClick={handleLogout}
              whileHover={{ scale: 1.1, color: "#ef4444" }}
              whileTap={{ scale: 0.9 }}
              title="Logout"
            >
              <LogoutIcon sx={{ fontSize: 20 }} />
            </motion.button>
          </div>
        </>
      ) : (
        <>
          <motion.button
            className="header-back"
            onClick={() => navigate("/")}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
            <span>Lobby</span>
          </motion.button>
          <div className="header-auction-info">
            <Avatar
              src={auction?.auction_image}
              sx={{ width: 30, height: 30 }}
            />
            <span className="header-auction-name">
              {auction?.auction_name || "Auction"}
            </span>
          </div>
          <div className="header-right">
            <motion.div
              className="header-avatar"
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate("/profile")}
            >
              <Avatar
                src={userData?.image_url}
                sx={{ width: 30, height: 30 }}
              />
            </motion.div>
            <motion.button
              className="header-logout"
              onClick={handleLogout}
              whileHover={{ scale: 1.1, color: "#ef4444" }}
              whileTap={{ scale: 0.9 }}
              title="Logout"
            >
              <LogoutIcon sx={{ fontSize: 20 }} />
            </motion.button>
          </div>
        </>
      )}
    </motion.header>
  );
}

export default TopHeader;
