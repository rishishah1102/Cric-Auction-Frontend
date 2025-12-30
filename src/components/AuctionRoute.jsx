import React from 'react'
import { Navigate } from "react-router-dom";

function AuctionRoute({ element }) {
  if (localStorage.getItem("auction")) {
    return element;
  } else {
    // If there's no auction token, redirect to the /auth route
    return <Navigate to="/login" />;
  }
}

export default AuctionRoute