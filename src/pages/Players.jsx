import React, { useEffect, useState, useContext, useCallback } from "react";
import "../style/players.css";
import { motion, AnimatePresence } from "framer-motion";
import auctionContext from "../context/auctionContext";
import { auctionAPI, playerAPI } from "../utils/axios";
import { toast } from "react-toastify";

// Icons
import GavelIcon from "@mui/icons-material/Gavel";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SportsIcon from "@mui/icons-material/Sports";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import FlightIcon from "@mui/icons-material/Flight";
import TuneIcon from "@mui/icons-material/Tune";
import { GiCricketBat } from "react-icons/gi";
import { BiSolidCricketBall } from "react-icons/bi";
import { GiWinterGloves } from "react-icons/gi";

function Players() {
  const { userData } = useContext(auctionContext);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [isAuctioneer, setIsAuctioneer] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [hammerFilter, setHammerFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Modal states
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    document.title = "Players";
    document.body.classList.add("scroll-enabled");
    return () => {
      document.body.classList.remove("scroll-enabled");
    };
  }, []);

  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await auctionAPI.get("/auction/all", {
        headers: { Authorization: localStorage.getItem("auction") },
      });
      if (response.status === 200) {
        setAuctions(response.data.auctions || []);
      }
    } catch (error) {
      toast.error("Failed to load auctions!");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlayers = async (auctionId) => {
    try {
      setLoading(true);
      const response = await playerAPI.post(
        "/players/get",
        { auction_id: auctionId },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );
      if (response.status === 200) {
        setPlayers(response.data.players || []);
        setFilteredPlayers(response.data.players || []);
      }
    } catch (error) {
      toast.error("Failed to fetch players!");
    } finally {
      setLoading(false);
    }
  };

  const handleAuctionSelect = useCallback(
    async (auctionId) => {
      try {
        setLoading(true);
        const response = await auctionAPI.post(
          "/auction/",
          { auction_id: auctionId },
          { headers: { Authorization: localStorage.getItem("auction") } }
        );
        if (response.status === 200) {
          let selected = response.data.auction;
          setSelectedAuction(selected);
          setIsAuctioneer(selected.created_by === userData.email);
          await fetchPlayers(selected.id);
        }
      } catch (error) {
        if (error.response.status === 400 || error.response.status === 404) {
          toast.error("Invalid Auction Id");
        } else if (error.response.status === 401) {
          toast.error("Please login again!");
        } else {
          toast.error("Please try again later!");
        }
      } finally {
        setLoading(false);
      }
    },
    [userData.email]
  );

  useEffect(() => {
    if (userData) {
      fetchAuctions();
    }
  }, [fetchAuctions, userData]);

  // Apply filters
  useEffect(() => {
    let filtered = players;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (player) =>
          player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.ipl_team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((player) => player.role === roleFilter);
    }

    // Hammer filter
    if (hammerFilter !== "all") {
      filtered = filtered.filter((player) => player.hammer === hammerFilter);
    }

    setFilteredPlayers(filtered);
  }, [searchTerm, roleFilter, hammerFilter, players]);

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case "batter":
        return <GiCricketBat />;
      case "bowler":
        return <BiSolidCricketBall />;
      case "all-rounder":
        return <SportsCricketIcon />;
      case "wicket-keeper":
        return <GiWinterGloves />;
      default:
        return <SportsIcon />;
    }
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
  };

  const openEditModal = () => {
    setEditData({ ...selectedPlayer });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      const response = await playerAPI.patch("/players/update", editData, {
        headers: { Authorization: localStorage.getItem("auction") },
      });

      if (response.status === 200) {
        toast.success("Player updated successfully!");
        await fetchPlayers(selectedAuction.id);
        setEditModalOpen(false);
        setSelectedPlayer(null);
      }
    } catch (error) {
      toast.error("Failed to update player!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (window.confirm("Are you sure you want to delete this player?")) {
      try {
        setLoading(true);
        const response = await playerAPI.delete("/players/delete", {
          data: { player_id: selectedPlayer._id },
          headers: { Authorization: localStorage.getItem("auction") },
        });

        if (response.status === 200) {
          toast.success("Player deleted successfully!");
          await fetchPlayers(selectedAuction.id);
          setSelectedPlayer(null);
        }
      } catch (error) {
        toast.error("Failed to delete player!");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !selectedAuction) {
    return (
      <div className="player-container">
        <div className="loading-state">
          <div className="hammer-container">
            <GavelIcon className="hammer-icon" />
            <div className="impact" />
          </div>
          <p>Loading auctions...</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0 },
  };

  const getHammerColor = (hammer) => {
    switch (hammer) {
      case "sold":
        return "#d1fae5";
      case "unsold":
        return "#fee2e2";
      case "upcoming":
        return "#fef3c7";
      default:
        return "#666";
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="player-container"
    >
      {/* Auction Selection */}
      <div className="player-selection-section">
        <div className="player-dropdown-wrapper">
          <select
            value={selectedAuction?.id || ""}
            onChange={(e) => handleAuctionSelect(e.target.value)}
            className="player-dropdown"
          >
            <option value="">Select an Auction</option>
            {auctions.map((auction) => (
              <option key={auction.id} value={auction.id}>
                {auction.auction_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedAuction ? (
        <div className="player-content">
          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="filters-card"
          >
            {/* Desktop Filters */}
            <div className="desktop-filters">
              <div className="search-box">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search by name, country, or IPL team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>

                <select
                  value={hammerFilter}
                  onChange={(e) => setHammerFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="sold">Sold</option>
                  <option value="unsold">Unsold</option>
                </select>
              </div>
            </div>

            {/* Mobile Filters */}
            <div className="mobile-filters">
              <div className="search-box">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className="filter-toggle"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <TuneIcon />
              </button>
            </div>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  className="mobile-filter-dropdown"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Roles</option>
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Wicket-Keeper">Wicket-Keeper</option>
                  </select>

                  <select
                    value={hammerFilter}
                    onChange={(e) => setHammerFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="sold">Sold</option>
                    <option value="unsold">Unsold</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Players Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="players-section"
          >
            {loading ? (
              <div className="loading-state">
                <div className="hammer-container">
                  <GavelIcon className="hammer-icon" />
                  <div className="impact" />
                </div>
                <p>Loading players...</p>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="no-players-state">
                <SportsIcon className="no-players-icon" />
                <p>No players found</p>
              </div>
            ) : (
              <div className="players-grid">
                <AnimatePresence>
                  {filteredPlayers.map((player, index) => (
                    <motion.div
                      key={player._id}
                      className="player-card"
                      style={{
                        borderTop: "3px solid",
                        borderBottom: "2px solid",
                        borderTopColor: getHammerColor(player.hammer),
                        borderBottomColor: getHammerColor(player.hammer),
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handlePlayerClick(player)}
                    >
                      <div className="player-card-header">
                        <div className="player-name-section">
                          <h4 className="player-name">{player.player_name}</h4>
                          <div className="role-icon">
                            {getRoleIcon(player.role)}
                          </div>
                          {selectedAuction.is_ipl_auction &&
                            player.country &&
                            player.country !== "India" && (
                              <FlightIcon className="overseas-icon" />
                            )}
                        </div>
                      </div>

                      <div className="player-info">
                        <div className="info-row">
                          <span className="info-label">Base Price:</span>
                          <span className="info-value">
                            ₹{player.base_price?.toLocaleString() || 0} Cr
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Role:</span>
                          <span className="info-value">
                            {player.role}
                          </span>
                        </div>
                        {selectedAuction.is_ipl_auction && (
                          <>
                            <div className="info-row">
                              <span className="info-label">Country:</span>
                              <span className="info-value">
                                {player.country || "N/A"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">IPL Team:</span>
                              <span className="info-value">
                                {player.ipl_team || "N/A"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className={`player-status status-${player.hammer}`}>
                        {player.hammer}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="empty-state">
          <GavelIcon className="empty-icon" />
          <h3>Select an Auction</h3>
          <p>Choose an auction from the dropdown to view its players.</p>
        </div>
      )}

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && !editModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              className="player-detail-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <button
                className="modal-close-button"
                onClick={() => setSelectedPlayer(null)}
              >
                <CloseIcon />
              </button>

              <h2>Player Details</h2>

              <div className="player-detail-content">
                <div className="detail-section">
                  <div className="detail-row">
                    <span className="detail-label">Player Number:</span>
                    <span className="detail-value">
                      {selectedPlayer.player_number}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">
                      {selectedPlayer.player_name}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{selectedPlayer.role}</span>
                  </div>
                  {selectedAuction.is_ipl_auction && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Country:</span>
                        <span className="detail-value">
                          {selectedPlayer.country || "N/A"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">IPL Team:</span>
                        <span className="detail-value">
                          {selectedPlayer.ipl_team || "N/A"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">
                          Previous Fantasy Points:
                        </span>
                        <span className="detail-value">
                          {selectedPlayer.prev_fantasy_points || 0}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Previous Team:</span>
                    <span className="detail-value">
                      {selectedPlayer.prev_team || "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Current Team:</span>
                    <span className="detail-value">
                      {selectedPlayer.current_team || "Not Assigned"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Base Price:</span>
                    <span className="detail-value">
                      ₹{selectedPlayer.base_price?.toLocaleString() || 0} Cr
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Selling Price:</span>
                    <span className="detail-value">
                      {selectedPlayer.selling_price
                        ? `₹${selectedPlayer.selling_price.toLocaleString()} Cr`
                        : "Not Sold"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span
                      className={`detail-value status-badge status-${selectedPlayer.hammer}`}
                    >
                      {selectedPlayer.hammer}
                    </span>
                  </div>
                </div>

                {isAuctioneer && (
                  <div className="modal-actions">
                    <button
                      className="edit-player-button"
                      onClick={openEditModal}
                    >
                      <EditIcon />
                      Edit Player
                    </button>
                    <button
                      className="delete-player-button"
                      onClick={handleDeletePlayer}
                    >
                      <DeleteIcon />
                      Delete Player
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Player Modal */}
      <AnimatePresence>
        {editModalOpen && editData && (
          <div
            className="modal-overlay"
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              className="edit-player-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <button
                className="modal-close-button"
                onClick={() => setEditModalOpen(false)}
              >
                <CloseIcon />
              </button>

              <h2>Edit Player</h2>

              <div className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Player Name</label>
                    <input
                      type="text"
                      value={editData.player_name}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          player_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={editData.role}
                      onChange={(e) =>
                        setEditData({ ...editData, role: e.target.value })
                      }
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-Rounder">All-Rounder</option>
                      <option value="Wicket-Keeper">Wicket-Keeper</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Base Price</label>
                    <input
                      type="number"
                      value={editData.base_price}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          base_price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Selling Price</label>
                    <input
                      type="number"
                      value={editData.selling_price}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          selling_price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {selectedAuction.is_ipl_auction && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        value={editData.country || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, country: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>IPL Team</label>
                      <input
                        type="text"
                        value={editData.ipl_team || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, ipl_team: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Previous Team</label>
                    <input
                      type="text"
                      value={editData.prev_team || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, prev_team: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Team</label>
                    <select
                      value={editData.current_team}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          current_team: e.target.value,
                        })
                      }
                    >
                      <option value="">Select</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="sold">Sold</option>
                      <option value="unsold">Unsold</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Previous Fantasy Points</label>
                    <input
                      type="number"
                      value={editData.prev_fantasy_points}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          prev_fantasy_points: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editData.hammer}
                      onChange={(e) =>
                        setEditData({ ...editData, hammer: e.target.value })
                      }
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="sold">Sold</option>
                      <option value="unsold">Unsold</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="cancel-button"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="save-button"
                    onClick={handleEditSubmit}
                    disabled={!editData.player_name}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Players;
