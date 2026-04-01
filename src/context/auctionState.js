import React, { useEffect, useState, useCallback } from "react";
import AuctionContext from "./auctionContext";
import { instance } from "../utils/axios";

const UserState = (props) => {
  const [token, setToken] = useState(localStorage.getItem("auction"));
  const [userData, setUserData] = useState({});
  const [userAuctions, setUserAuctions] = useState([]);

  // Listen for token changes via custom event (same-tab) and storage event (cross-tab)
  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem("auction"));
    window.addEventListener("auth-change", syncToken);
    window.addEventListener("storage", syncToken);
    return () => {
      window.removeEventListener("auth-change", syncToken);
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  // Clear data when token is removed (logout)
  useEffect(() => {
    if (!token) {
      setUserData({});
      setUserAuctions([]);
    }
  }, [token]);

  // Fetch user profile
  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const res = await instance.get("/profile/get", {
          headers: { Authorization: token },
        });
        if (res.status === 200) {
          setUserData(res.data.profile);
        }
      } catch (error) {
      }
    };
    fetchProfile();
  }, [token]);

  // Fetch auctions
  useEffect(() => {
    if (!token) return;
    const fetchAuctions = async () => {
      try {
        const res = await instance.get("/auction/all?type=all", {
          headers: { Authorization: token },
        });
        if (res.status === 200) {
          setUserAuctions(res.data.auctions || []);
        }
      } catch (error) {
      }
    };
    fetchAuctions();
  }, [token]);

  // Manual refresh (call after login)
  const refreshContext = useCallback(async () => {
    const current = localStorage.getItem("auction");
    setToken(current);
  }, []);

  return (
    <AuctionContext.Provider
      value={{ userData, userAuctions, refreshContext }}
    >
      {props.children}
    </AuctionContext.Provider>
  );
};

export default UserState;
