import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";

// toast
import { ToastContainer } from "react-toastify";
import routes from "./utils/routes";
import AuctionState from "./context/auctionState";
import BiddingRoom from "./pages/BiddingRoom";
import AuctionRoute from "./components/AuctionRoute";

const router = createBrowserRouter([
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/auction/live",
    element: <AuctionRoute element={<BiddingRoom />} />,
  },
  ...routes
]);

function App() {
  return (
    <AuctionState>
      <div className="App" style={{ height: "100vh" }}>
        <RouterProvider router={router} />
        <ToastContainer
          position="top-right"
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
