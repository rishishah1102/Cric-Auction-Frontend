import React, { useContext, useEffect, useState } from "react";
import "../style/players.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  SportsCricket as BatterIcon,
  SportsBaseball as BowlerIcon,
  Stars as AllRounderIcon,
  SportsHandball as WicketKeeperIcon,
  AirplanemodeActive as AeroplaneIcon,
} from "@mui/icons-material";
import { Avatar } from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import auctionContext from "../context/auctionContext";
// import instance from '../utils/axios';

const Players = () => {
  const { userData, userAuctions } = useContext(auctionContext);
  const [loading, setLoading] = useState(false);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    hammer: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  useEffect(() => {
    if (userAuctions) {
      setAuctions(userAuctions);
    }
    document.title = "Players";
    document.body.classList.add("scroll-enabled");
    return () => {
      document.body.classList.remove("scroll-enabled");
    };
  }, [userAuctions]);

  const getRoleIcon = (role) => {
    const icons = {
      Batter: <BatterIcon className="role-icon" />,
      Bowler: <BowlerIcon className="role-icon" />,
      "All-Rounder": <AllRounderIcon className="role-icon" />,
      "Wicket-Keeper": <WicketKeeperIcon className="role-icon" />,
    };
    return icons[role] || null;
  };

  const handleAuctionSelect = async (auctionId) => {
    setLoading(true);
    try {
      const auction = auctions.find((a) => a._id === auctionId);
      console.log(userData);

      setSelectedAuction(auction);

      // Replace with actual API call
      const mockPlayers = [
        {
          _id: 1,
          playerName: "Rohit Sharma",
          role: "Batter",
          team: "MI",
          basePrice: "2.0 Cr",
          sellingPrice: "15.5 Cr",
          country: "India",
          playerImg: "",
          hammer: "sold",
        },
        {
          _id: 2,
          playerName: "Kane Williamson",
          role: "Batter",
          team: "SRH",
          basePrice: "2.0 Cr",
          sellingPrice: "15.5 Cr",
          country: "New Zealand",
          playerImg: "",
          hammer: "upcoming",
        },
      ];

      setPlayers(mockPlayers);
      setFilteredPlayers(mockPlayers);
    } catch (error) {
      console.error("Failed to fetch players:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    filterPlayers({ ...filters, [name]: value });
  };

  const filterPlayers = (filterValues) => {
    let filtered = players.filter(
      (player) =>
        player.playerName
          .toLowerCase()
          .includes(filterValues.search.toLowerCase()) &&
        (filterValues.role ? player.role === filterValues.role : true) &&
        (filterValues.hammer ? player.hammer === filterValues.hammer : true)
    );
    setFilteredPlayers(filtered);
  };

  const handlePlayerUpdate = (updatedPlayer) => {
    setPlayers((prev) =>
      prev.map((p) => (p._id === updatedPlayer._id ? updatedPlayer : p))
    );
    setFilteredPlayers((prev) =>
      prev.map((p) => (p._id === updatedPlayer._id ? updatedPlayer : p))
    );
    setShowEditModal(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="players-container"
    >
      {/* Filter Section */}
      <div className="filter-section">
        <select
          value={selectedAuction?._id || ""}
          onChange={(e) => handleAuctionSelect(e.target.value)}
        >
          <option value="">Select Auction</option>
          {auctions.map((auction) => (
            <option key={auction._id} value={auction._id}>
              {auction.auctionName}
            </option>
          ))}
        </select>

        <select
          value={filters.role}
          onChange={(e) => handleFilterChange("role", e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="Batter">Batter</option>
          <option value="Bowler">Bowler</option>
          <option value="All-Rounder">All-Rounder</option>
          <option value="Wicket-Keeper">Wicket-Keeper</option>
        </select>

        <select
          value={filters.hammer}
          onChange={(e) => handleFilterChange("hammer", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="sold">Sold</option>
          <option value="unsold">Unsold</option>
          <option value="upcoming">Upcoming</option>
        </select>

        <div className="search-section">
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search players..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="players-section">
        <AnimatePresence>
          {loading ? (
            <div className="loading-state">
              <div className="hammer-container">
                <GavelIcon className="hammer-icon" />
                <div className="impact" />
              </div>
              <p>Loading players...</p>
            </div>
          ) : filteredPlayers.length > 0 ? (
            // Players Grid
            <div className="players-grid">
              {filteredPlayers.map((player) => (
                <motion.div
                  key={player._id}
                  className="player-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="player-card-inner">
                    {/* Front Side */}
                    <div className="player-card-front">
                      {player.country !== "India" && (
                        <AeroplaneIcon className="aeroplane-icon" />
                      )}
                      {getRoleIcon(player.role)}
                      <div className="player-image">
                        <Avatar src={player.playerImg}>
                          {/* {player.playerName.charAt(0)} */}
                        </Avatar>
                      </div>
                      <div className="player-info">
                        <h3 className="player-name">{player.playerName}</h3>
                        <span className="player-role">{player.role}</span>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="player-card-back">
                      <div className="player-details">
                        <div className="detail-item">
                          <span className="detail-label">Team</span>
                          <span className="detail-value">{player.team}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Country</span>
                          <span className="detail-value">{player.country}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Base Price</span>
                          <span className="detail-value">
                            {player.basePrice}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Selling Price</span>
                          <span className="detail-value">
                            {player.sellingPrice}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Status</span>
                          <span
                            className="detail-value"
                            style={{
                              backgroundColor:
                                player.hammer === "sold"
                                  ? "#4caf50"
                                  : player.hammer === "unsold"
                                  ? "#f44336"
                                  : "#f6c502",
                              padding: "3px",
                              borderRadius: "3px",
                            }}
                          >
                            {player.hammer}
                          </span>
                        </div>
                      </div>

                      {selectedAuction?.createdBy === userData?.email && (
                        <button
                          className="edit-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPlayer(player);
                            setShowEditModal(true);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="emptyPlayerMessage">
              <span>No players found!</span>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        {showEditModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="edit-player-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-button"
                onClick={() => setShowEditModal(false)}
              >
                <CloseIcon />
              </button>

              <h2>Edit Player</h2>

              <div className="input-group">
                <label>Player Name</label>
                <input
                  value={currentPlayer?.playerName || ""}
                  onChange={(e) =>
                    setCurrentPlayer((prev) => ({
                      ...prev,
                      playerName: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="input-group">
                <label>Role</label>
                <select
                  value={currentPlayer?.role || ""}
                  onChange={(e) =>
                    setCurrentPlayer((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                >
                  <option value="">All Roles</option>
                  <option value="Batter">Batter</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>
              </div>

              <div className="input-group">
                <label>Team Name</label>
                <input
                  value={currentPlayer?.team || ""}
                  onChange={(e) =>
                    setCurrentPlayer((prev) => ({
                      ...prev,
                      team: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="input-group">
                <label>Base Price</label>
                <input
                  value={currentPlayer?.basePrice || ""}
                  onChange={(e) =>
                    setCurrentPlayer((prev) => ({
                      ...prev,
                      basePrice: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="input-group">
                <label>Hammer</label>
                <select
                  value={currentPlayer?.hammer || ""}
                  onChange={(e) =>
                    setCurrentPlayer((prev) => ({
                      ...prev,
                      hammer: e.target.value,
                    }))
                  }
                >
                  <option value="">All Statuses</option>
                  <option value="sold">Sold</option>
                  <option value="unsold">Unsold</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>

              <div className="button-group">
                <button
                  className="save-button"
                  onClick={() => handlePlayerUpdate(currentPlayer)}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Players;
