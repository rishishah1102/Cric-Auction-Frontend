import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Auction from "./pages/Auction";
import Players from "./pages/Players";
import Squads from "./pages/Squads";
import BiddingRoom from "./pages/BiddingRoom";
import PointsTable from "./pages/PointsTable";

// toast
import { ToastContainer } from "react-toastify";
import AuctionState from "./context/auctionState";
import PrivateRoute from "./components/PrivateRoute";
import AuctionWorkspace from "./components/AuctionWorkspace";

const router = createBrowserRouter([
  { path: "/register", element: <Register /> },
  { path: "/login", element: <Login /> },

  // Lobby routes
  { path: "/", element: <PrivateRoute element={<Home />} headerText="Home" /> },
  { path: "/profile", element: <PrivateRoute element={<Profile />} headerText="Profile" /> },

  // Auction workspace (nested routes)
  {
    path: "/auction/:auctionId",
    element: <AuctionWorkspace />,
    children: [
      { index: true, element: <Auction /> },
      { path: "players", element: <Players /> },
      { path: "squads", element: <Squads /> },
      { path: "points", element: <PointsTable /> },
      { path: "live", element: <BiddingRoom /> },
    ],
  },
]);

function App() {
  return (
    <AuctionState>
      <div className="App" style={{ height: "100vh" }}>
        <RouterProvider router={router} />
        <ToastContainer
          position="top-center"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          className="text-xl"
        />
      </div>
    </AuctionState>
  );
}

export default App;
