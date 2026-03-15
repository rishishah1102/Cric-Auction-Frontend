import React, { useCallback, useState, useEffect } from "react";
import "../style/navbar.css";
import { Navigate } from "react-router-dom";
import Navbar from "./navigation/Navbar";

const SIDEBAR_OPEN = 250;
const SIDEBAR_CLOSED = 78;

const PrivateRoute = ({ element, headerText }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const handleOpen = useCallback((open) => {
    setIsOpen(open);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (localStorage.getItem("auction")) {
    const sidebarW = isOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED;

    return (
      <div className="app-layout">
        <Navbar onOpen={handleOpen} />
        <main
          className="main-content"
          style={
            isMobile
              ? { marginLeft: 0, width: "100%", paddingTop: "60px" }
              : {
                  marginLeft: `${sidebarW}px`,
                  width: `calc(100% - ${sidebarW}px)`,
                }
          }
        >
          <div className="page-header-bar">
            <h4>{headerText || "Auction Web"}</h4>
          </div>
          <>{element}</>
        </main>
      </div>
    );
  } else {
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;
