import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

function NavList({ Icon, name, route, isOpen, isMobile, index }) {
  return (
    <motion.li
      className="nav-item"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <NavLink
        to={route}
        className={({ isActive }) =>
          `nav-link ${isActive ? "nav-active" : ""}`
        }
      >
        <span className="nav-icon-box">
          <Icon />
        </span>
        {(isOpen || isMobile) && (
          <span className="nav-label">{name}</span>
        )}
      </NavLink>

      {/* Tooltip for collapsed sidebar */}
      {!isOpen && !isMobile && (
        <div className="nav-tooltip">{name}</div>
      )}
    </motion.li>
  );
}

export default NavList;
