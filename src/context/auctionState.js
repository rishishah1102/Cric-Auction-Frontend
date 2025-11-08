import React, { useEffect, useState } from "react";
import AuctionContext from "./auctionContext";
import { instance } from "../utils/axios";

const UserState = (props) => {
  const [userData, setUserData] = useState({});
  const [userAuctions, setUserAuctions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await instance.get("/profile/get", {
          headers: { Authorization: localStorage.getItem("auction") },
        });
        if (res.status === 200) {
          setUserData(res.data.profile);
        }
      } catch (error) {
        console.error("failed to fetch user");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await instance.get("/auction/all?type=all", {
          headers: { Authorization: localStorage.getItem("auction") },
        });
        if (res.status === 200) {
          const respAuctions = res.data.auctions || [];
          setUserAuctions(respAuctions);
        }
      } catch (error) {
        console.error("failed to fetch auctions");
      }
    };

    fetchData();
  }, []);

  return (
    <AuctionContext.Provider
      value={{ userData, userAuctions }}
    >
      {props.children}
    </AuctionContext.Provider>
  );
};

export default UserState;
