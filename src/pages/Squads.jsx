import React, { useEffect, useState, useContext, useCallback } from "react";
import "../style/squads.css";
import { motion, AnimatePresence } from "framer-motion";
import auctionContext from "../context/auctionContext";
import { auctionAPI, playerAPI } from "../utils/axios";
import { toast } from "react-toastify";

// Icons
import GavelIcon from "@mui/icons-material/Gavel";
import CloseIcon from "@mui/icons-material/Close";
import SportsIcon from "@mui/icons-material/Sports";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import FlightIcon from "@mui/icons-material/Flight";
import GroupsIcon from "@mui/icons-material/Groups";
import { GiCricketBat } from "react-icons/gi";
import { BiSolidCricketBall } from "react-icons/bi";
import { GiWinterGloves } from "react-icons/gi";

function Squads() {
  const { userData } = useContext(auctionContext);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [squadPlayers, setSquadPlayers] = useState({
    batters: [],
    bowlers: [],
    all_rounders: [],
    wicket_keepers: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    document.title = "Squad";
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

  const fetchTeams = async (auctionId) => {
    try {
      setLoading(true);
      const response = await auctionAPI.post(
        "/auction/team/all",
        { auction_id: auctionId },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );
      if (response.status === 200) {
        const fetchedTeams = response.data.teams || [];
        setTeams(fetchedTeams);
        setSelectedTeam(null);
        setSquadPlayers({
          batters: [],
          bowlers: [],
          all_rounders: [],
          wicket_keepers: [],
        });
      }
    } catch (error) {
      toast.error("Failed to fetch teams!");
    } finally {
      setLoading(false);
    }
  };

  const fetchSquad = async (playerIds) => {
    console.log(playerIds);
    
    try {
      setLoading(true);
      const response = await playerAPI.post(
        "/players/squad",
        { player_id: playerIds },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );
      if (response.status === 200) {
        setSquadPlayers(response.data.squad || {
          batters: [],
          bowlers: [],
          all_rounders: [],
          wicket_keepers: [],
        });
      }
    } catch (error) {
      toast.error("Failed to fetch squad!");
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
          await fetchTeams(selected.id);
        }
      } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 404) {
          toast.error("Invalid Auction Id");
        } else if (error.response?.status === 401) {
          toast.error("Please login again!");
        } else {
          toast.error("Please try again later!");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleTeamSelect = useCallback(
    async (teamId) => {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        setSelectedTeam(team);
        console.log(team);
        
        if (team.squad && team.squad.length > 0) {
          await fetchSquad(team.squad);
        } else {
          setSquadPlayers({
            batters: [],
            bowlers: [],
            all_rounders: [],
            wicket_keepers: [],
          });
        }
      }
    },
    [teams]
  );

  useEffect(() => {
    if (userData) {
      fetchAuctions();
    }
  }, [fetchAuctions, userData]);

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case "batter":
      case "batsman":
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

  const renderPlayerCard = (player, index) => (
    <motion.div
      key={player._id}
      className="squad-player-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => handlePlayerClick(player)}
    >
      <div className="squad-player-header">
        <div className="squad-player-name-section">
          <h4 className="squad-player-name">{player.player_name}</h4>
          <div className="squad-role-icon">{getRoleIcon(player.role)}</div>
          {selectedAuction?.is_ipl_auction &&
            player.country &&
            player.country !== "India" && (
              <FlightIcon className="squad-overseas-icon" />
            )}
        </div>
      </div>

      <div className="squad-player-info">
        <div className="squad-info-row">
          <span className="squad-info-label">Base Price:</span>
          <span className="squad-info-value">
            ₹{player.base_price?.toLocaleString() || 0} Cr
          </span>
        </div>
        <div className="squad-info-row">
          <span className="squad-info-label">Selling Price:</span>
          <span className="squad-info-value">
            {player.selling_price
              ? `₹${player.selling_price.toLocaleString()} Cr`
              : "N/A"}
          </span>
        </div>
        {selectedAuction?.is_ipl_auction && (
          <>
            <div className="squad-info-row">
              <span className="squad-info-label">Country:</span>
              <span className="squad-info-value">
                {player.country || "N/A"}
              </span>
            </div>
            <div className="squad-info-row">
              <span className="squad-info-label">IPL Team:</span>
              <span className="squad-info-value">
                {player.ipl_team || "N/A"}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );

  const renderSquadSection = (title, players, icon) => {
    if (players.length === 0) return null;

    return (
      <div className="squad-section">
        <div className="squad-section-header">
          <div className="squad-section-icon">{icon}</div>
          <h3 className="squad-section-title">
            {title} ({players.length})
          </h3>
        </div>
        <div className="squad-players-grid">
          {players.map((player, index) => renderPlayerCard(player, index))}
        </div>
      </div>
    );
  };

  if (loading && !selectedAuction) {
    return (
      <div className="squad-container">
        <div className="squad-loading-state">
          <div className="squad-hammer-container">
            <GavelIcon className="squad-hammer-icon" />
            <div className="squad-impact" />
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

  const totalPlayers =
    squadPlayers.batters.length +
    squadPlayers.bowlers.length +
    squadPlayers.all_rounders.length +
    squadPlayers.wicket_keepers.length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="squad-container"
    >
      {/* Auction & Team Selection */}
      <div className="squad-selection-section">
        <div className="squad-dropdown-wrapper">
          <select
            value={selectedAuction?.id || ""}
            onChange={(e) => handleAuctionSelect(e.target.value)}
            className="squad-dropdown"
          >
            <option value="">Select an Auction</option>
            {auctions.map((auction) => (
              <option key={auction.id} value={auction.id}>
                {auction.auction_name}
              </option>
            ))}
          </select>

          {selectedAuction && (
            <select
              value={selectedTeam?.id || ""}
              onChange={(e) => handleTeamSelect(e.target.value)}
              className="squad-dropdown"
            >
              <option value="">Select a Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.team_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {auctions.length === 0 ? (
        <div className="squad-empty-state">
          <GavelIcon className="squad-empty-icon" />
          <h3>No Auctions Found</h3>
          <p>You haven't created or joined any auctions yet.</p>
        </div>
      ) : !selectedAuction ? (
        <div className="squad-empty-state">
          <GavelIcon className="squad-empty-icon" />
          <h3>Select an Auction</h3>
          <p>Choose an auction from the dropdown to view its teams.</p>
        </div>
      ) : !selectedTeam ? (
        <div className="squad-empty-state">
          <GroupsIcon className="squad-empty-icon" />
          <h3>Select a Team</h3>
          <p>Choose a team to view their squad.</p>
        </div>
      ) : (
        <div className="squad-content">
          {/* Squad Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="squad-header-card"
          >
            <div className="squad-team-info">
              <h2 className="squad-team-name">{selectedTeam.team_name}</h2>
              <p className="squad-team-count">
                Total Players: <strong>{totalPlayers}</strong>
              </p>
            </div>
          </motion.div>

          {/* Squad Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="squad-sections-container"
          >
            {loading ? (
              <div className="squad-loading-state">
                <div className="squad-hammer-container">
                  <GavelIcon className="squad-hammer-icon" />
                  <div className="squad-impact" />
                </div>
                <p>Loading squad...</p>
              </div>
            ) : totalPlayers === 0 ? (
              <div className="squad-no-players-state">
                <SportsIcon className="squad-no-players-icon" />
                <p>No players in this squad yet</p>
              </div>
            ) : (
              <>
                {renderSquadSection(
                  "Batters",
                  squadPlayers.batters,
                  <GiCricketBat />
                )}
                {renderSquadSection(
                  "Bowlers",
                  squadPlayers.bowlers,
                  <BiSolidCricketBall />
                )}
                {renderSquadSection(
                  "All-Rounders",
                  squadPlayers.all_rounders,
                  <SportsCricketIcon />
                )}
                {renderSquadSection(
                  "Wicket-Keepers",
                  squadPlayers.wicket_keepers,
                  <GiWinterGloves />
                )}
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <div
            className="squad-modal-overlay"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              className="squad-player-detail-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <button
                className="squad-modal-close-button"
                onClick={() => setSelectedPlayer(null)}
              >
                <CloseIcon />
              </button>

              <h2>Player Details</h2>

              <div className="squad-player-detail-content">
                <div className="squad-detail-section">
                  <div className="squad-detail-row">
                    <span className="squad-detail-label">Player Number:</span>
                    <span className="squad-detail-value">
                      {selectedPlayer.player_number}
                    </span>
                  </div>
                  <div className="squad-detail-row">
                    <span className="squad-detail-label">Name:</span>
                    <span className="squad-detail-value">
                      {selectedPlayer.player_name}
                    </span>
                  </div>
                  <div className="squad-detail-row">
                    <span className="squad-detail-label">Role:</span>
                    <span className="squad-detail-value">
                      {selectedPlayer.role}
                    </span>
                  </div>
                  {selectedAuction?.is_ipl_auction && (
                    <>
                      <div className="squad-detail-row">
                        <span className="squad-detail-label">Country:</span>
                        <span className="squad-detail-value">
                          {selectedPlayer.country || "N/A"}
                        </span>
                      </div>
                      <div className="squad-detail-row">
                        <span className="squad-detail-label">IPL Team:</span>
                        <span className="squad-detail-value">
                          {selectedPlayer.ipl_team || "N/A"}
                        </span>
                      </div>
                      <div className="squad-detail-row">
                        <span className="squad-detail-label">
                          Previous Fantasy Points:
                        </span>
                        <span className="squad-detail-value">
                          {selectedPlayer.prev_fantasy_points || 0}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="squad-detail-row">
                    <span className="squad-detail-label">Previous Team:</span>
                    <span className="squad-detail-value">
                      {selectedPlayer.prev_team || "N/A"}
                    </span>
                  </div>
                  <div className="squad-detail-row">
                    <span className="squad-detail-label">Current Team:</span>
                    <span className="squad-detail-value">
                      {selectedPlayer.current_team || "Not Assigned"}
                    </span>
                  </div>
                  <div className="squad-detail-row">
                    <span className="squad-detail-label">Base Price:</span>
                    <span className="squad-detail-value">
                      ₹{selectedPlayer.base_price?.toLocaleString() || 0} Cr
                    </span>
                  </div>
                  <div className="squad-detail-row">
                    <span className="squad-detail-label">Selling Price:</span>
                    <span className="squad-detail-value">
                      {selectedPlayer.selling_price
                        ? `₹${selectedPlayer.selling_price.toLocaleString()} Cr`
                        : "Not Sold"}
                    </span>
                  </div>
                  <div className="squad-detail-row">
                    <span className="squad-detail-label">Status:</span>
                    <span
                      className={`squad-detail-value squad-status-badge squad-status-${selectedPlayer.hammer}`}
                    >
                      {selectedPlayer.hammer}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Squads;