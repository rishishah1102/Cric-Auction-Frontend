import React from "react";
import { Navigate } from "react-router-dom";
import TopHeader from "./navigation/TopHeader";
import BottomNav from "./navigation/BottomNav";
import PageTransition from "./PageTransition";

const PrivateRoute = ({ element }) => {
  if (!localStorage.getItem("auction")) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="app-shell">
      <TopHeader mode="lobby" />
      <main className="app-content">
        <PageTransition>{element}</PageTransition>
      </main>
      <BottomNav mode="lobby" />
    </div>
  );
};

export default PrivateRoute;
