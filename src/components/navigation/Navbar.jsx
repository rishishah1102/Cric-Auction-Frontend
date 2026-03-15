import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../../style/navbar.css";
import auctionContext from "../../context/auctionContext";

// Icons
import GavelIcon from "@mui/icons-material/Gavel";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";

// Components
import NavList from "./NavList";
import routes from "../../utils/routes";
import { instance } from "../../utils/axios";
import { toast } from "react-toastify";

function Navbar({ onOpen }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState({
    image_url: "",
    first_name: "",
    last_name: "",
    role: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  const { userData } = useContext(auctionContext);

  useEffect(() => {
    if (userData != null && Object.keys(userData).length !== 0) {
      setProfile(userData);
    } else {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      const res = await instance.get("/profile/get", {
        headers: { Authorization: localStorage.getItem("auction") },
      });
      if (res.status === 200) {
        setProfile(res.data.profile);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Please login again!");
      }
    }
  };

  const toggleNav = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      const newState = !isOpen;
      setIsOpen(newState);
      setTimeout(() => {
        onOpen(newState);
      }, 0);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem("auction");
    navigate("/login");
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        mobileMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
        onOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [onOpen]);

  const displayName =
    profile.first_name || profile.email?.split("@")[0] || "User";
  const displayRole = profile.role || "Cricketer";

  // --- MOBILE NAVBAR ---
  if (isMobile) {
    return (
      <>
        {/* Top bar */}
        <motion.nav
          className="mobile-topbar"
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="mobile-topbar-left">
            <motion.button
              className="mobile-menu-btn"
              onClick={toggleNav}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CloseIcon />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MenuIcon />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <div className="mobile-logo">
              <GavelIcon className="mobile-logo-icon" />
              <span>Auction</span>
            </div>
          </div>
          <motion.div
            className="mobile-topbar-right"
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/profile")}
          >
            <Avatar
              src={profile.image_url}
              className="mobile-avatar"
              sx={{ width: 34, height: 34 }}
            />
          </motion.div>
        </motion.nav>

        {/* Mobile overlay + slide-in menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                className="mobile-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                ref={sidebarRef}
                className="mobile-sidebar"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 35,
                }}
              >
                {/* Mobile sidebar header */}
                <div className="mobile-sidebar-header">
                  <GavelIcon className="mobile-sidebar-logo-icon" />
                  <span className="mobile-sidebar-title">Auction</span>
                </div>

                {/* Nav items */}
                <ul className="mobile-nav-list">
                  {routes.map((route, index) => (
                    <NavList
                      Icon={route.icon}
                      name={route.name}
                      route={route.path}
                      isOpen={true}
                      isMobile={true}
                      index={index}
                      key={route.path}
                    />
                  ))}
                </ul>

                {/* Profile at bottom */}
                <div className="mobile-sidebar-profile">
                  <div className="mobile-profile-info">
                    <Avatar
                      src={profile.image_url}
                      sx={{ width: 42, height: 42 }}
                    />
                    <div className="mobile-profile-text">
                      <span className="mobile-profile-name">
                        {displayName}
                      </span>
                      <span className="mobile-profile-role">
                        {displayRole}
                      </span>
                    </div>
                  </div>
                  <motion.button
                    className="mobile-logout-btn"
                    onClick={handleLogOut}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogoutIcon />
                    <span>Logout</span>
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // --- DESKTOP SIDEBAR ---
  return (
    <motion.div
      className={`sidebar ${isOpen ? "open" : "collapsed"}`}
      initial={false}
      animate={{ width: isOpen ? 250 : 78 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Logo + Toggle */}
      {isOpen ? (
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <motion.div
              className="logo-icon-wrapper"
              whileHover={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 0.5 }}
            >
              <GavelIcon className="logo-icon" />
            </motion.div>
            <motion.span
              className="logo-text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              Auction
            </motion.span>
          </div>
          <motion.button
            className="toggle-btn"
            onClick={toggleNav}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Collapse sidebar"
          >
            <KeyboardDoubleArrowLeftIcon />
          </motion.button>
        </div>
      ) : (
        <div className="sidebar-header-collapsed">
          <motion.div
            className="logo-icon-wrapper"
            whileHover={{ rotate: [0, -15, 15, 0] }}
            transition={{ duration: 0.5 }}
          >
            <GavelIcon className="logo-icon" />
          </motion.div>
          <motion.button
            className="toggle-btn-small"
            onClick={toggleNav}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Expand sidebar"
          >
            <KeyboardDoubleArrowRightIcon />
          </motion.button>
        </div>
      )}

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Nav items */}
      <ul className="nav-list">
        {routes.map((route, index) => (
          <NavList
            Icon={route.icon}
            name={route.name}
            route={route.path}
            isOpen={isOpen}
            isMobile={false}
            index={index}
            key={route.path}
          />
        ))}
      </ul>

      {/* Profile section */}
      <div className="sidebar-profile">
        <div className="sidebar-divider" />
        <div className="profile-row">
          <Avatar
            src={profile.image_url}
            className="profile-avatar"
            sx={{ width: 38, height: 38 }}
          />
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="profile-info"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className="profile-name">{displayName}</span>
                <span className="profile-role">{displayRole}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            className="logout-btn"
            onClick={handleLogOut}
            whileHover={{ scale: 1.15, color: "#ff6b6b" }}
            whileTap={{ scale: 0.9 }}
            title="Logout"
          >
            <LogoutIcon fontSize="small" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default Navbar;
