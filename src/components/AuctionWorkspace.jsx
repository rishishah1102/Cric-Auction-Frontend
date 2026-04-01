import React, { useContext } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import TopHeader from "./navigation/TopHeader";
import BottomNav from "./navigation/BottomNav";
import PageTransition from "./PageTransition";
import WorkspaceProvider from "../context/WorkspaceProvider";
import workspaceContext from "../context/workspaceContext";
import GavelIcon from "@mui/icons-material/Gavel";

function WorkspaceContent() {
  const { auction, loading } = useContext(workspaceContext);
  const location = useLocation();
  const { auctionId } = useParams();

  const isLive = location.pathname === `/auction/${auctionId}/live`;
  const navMode = isLive ? "live" : "workspace";

  if (loading) {
    return (
      <div className="app-shell" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="loading-state">
          <div className="hammer-container">
            <GavelIcon className="hammer-icon" />
            <div className="impact" />
          </div>
          <p>Loading auction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopHeader mode={navMode} auction={auction} />
      <main className={`app-content ${isLive ? "live-mode" : ""}`}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <BottomNav mode={navMode} />
    </div>
  );
}

const AuctionWorkspace = () => {
  if (!localStorage.getItem("auction")) {
    return <Navigate to="/login" />;
  }

  return (
    <WorkspaceProvider>
      <WorkspaceContent />
    </WorkspaceProvider>
  );
};

export default AuctionWorkspace;
