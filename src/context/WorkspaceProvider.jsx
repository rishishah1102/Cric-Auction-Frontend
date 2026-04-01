import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { instance } from "../utils/axios";
import auctionContext from "./auctionContext";
import workspaceContext from "./workspaceContext";

const WorkspaceProvider = ({ children }) => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(auctionContext);

  const [auction, setAuction] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  const auth = () => ({ Authorization: localStorage.getItem("auction") });

  const refreshAuction = useCallback(async () => {
    if (!auctionId) return;
    try {
      const res = await instance.post("/auction/get", { auction_id: auctionId }, { headers: auth() });
      if (res.status === 200) {
        setAuction(res.data.auction);
      }
    } catch {
      toast.error("Failed to load auction");
      navigate("/", { replace: true });
    }
  }, [auctionId, navigate]);

  const refreshTeams = useCallback(async () => {
    if (!auctionId) return;
    try {
      const res = await instance.post("/auction/team/all", { auction_id: auctionId }, { headers: auth() });
      if (res.status === 200) {
        setTeams(res.data.teams || []);
      }
    } catch {
    }
  }, [auctionId]);

  // Fetch auction + teams on mount (don't wait for userData)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshAuction();
      await refreshTeams();
      setLoading(false);
    };
    if (auctionId) {
      load();
    }
  }, [auctionId, refreshAuction, refreshTeams]);

  // Derive isCreator whenever auction or userData changes
  useEffect(() => {
    if (auction && userData?.email) {
      setIsCreator(auction.created_by === userData.email);
    }
  }, [auction, userData?.email]);

  return (
    <workspaceContext.Provider value={{ auction, teams, isCreator, loading, refreshAuction, refreshTeams }}>
      {children}
    </workspaceContext.Provider>
  );
};

export default WorkspaceProvider;
