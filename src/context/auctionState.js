import React, { useEffect, useState } from "react";
import AuctionContext from "./auctionContext";
import { instance } from "../utils/axios";

const UserState = (props) => {
  let token = localStorage.getItem("auction")
  const [userData, setUserData] = useState({});
  const [userAuctions, setUserAuctions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await instance.get("/profile/get", {
          headers: { Authorization: token },
        });
        if (res.status === 200) {
          setUserData(res.data.profile);
        }
      } catch (error) {
        console.error("failed to fetch user");
      }
    };
    if (token) {
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await instance.get("/auction/all?type=all", {
          headers: { Authorization: token },
        });
        if (res.status === 200) {
          const respAuctions = res.data.auctions || [];
          setUserAuctions(respAuctions);
        }
      } catch (error) {
        console.error("failed to fetch auctions");
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  return (
    <AuctionContext.Provider
      value={{ userData, userAuctions }}
    >
      {props.children}
    </AuctionContext.Provider>
  );
};

export default UserState;
