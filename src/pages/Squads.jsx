import React, { useEffect, useState, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import auctionContext from "../context/auctionContext";
import { instance } from "../utils/axios";
import { toast } from "react-toastify";

import "../style/squads.css";

// Icons
import GavelIcon from "@mui/icons-material/Gavel";
import CloseIcon from "@mui/icons-material/Close";
import SportsIcon from "@mui/icons-material/Sports";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import FlightIcon from "@mui/icons-material/Flight";
import GroupsIcon from "@mui/icons-material/Groups";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import LockIcon from "@mui/icons-material/Lock";
import PeopleIcon from "@mui/icons-material/People";
import TimerIcon from "@mui/icons-material/Timer";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
// import InfoIcon from "@mui/icons-material/Info";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { GiCricketBat } from "react-icons/gi";
import { BiSolidCricketBall } from "react-icons/bi";
import { GiWinterGloves } from "react-icons/gi";

function Squads() {
  const { userData } = useContext(auctionContext);

  // Main data states
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [allSquadPlayers, setAllSquadPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // View states
  const [currentView, setCurrentView] = useState("squad");
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState(null);

  // Playing 11 states
  const [savedPlaying11Ids, setSavedPlaying11Ids] = useState([]);
  const [editingPlaying11, setEditingPlaying11] = useState(false);
  const [draftPlaying11Ids, setDraftPlaying11Ids] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [canEditWeekend, setCanEditWeekend] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check if it's weekend (Saturday, Sunday)
  const checkWeekendStatus = useCallback(() => {
    const now = new Date();
    const day = now.getDay();
    // 6 = Saturday, 0 = Sunday
    setCanEditWeekend(day === 6 || day === 0);
  }, []);

  useEffect(() => {
    document.title = "Squad";
    document.body.classList.add("scroll-enabled");
    checkWeekendStatus();
    const timer = setInterval(checkWeekendStatus, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [checkWeekendStatus]);

  // Fetch auctions
  const loadAuctions = useCallback(async () => {
    if (!userData) return;

    try {
      setLoading(true);
      const res = await instance.get("/auction/all", {
        headers: { Authorization: localStorage.getItem("auction") },
      });

      if (res.status === 200) {
        setAuctions(res.data.auctions || []);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again!");
      } else {
        toast.error("Failed to load auctions");
      }
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  // Fetch teams for selected auction
  const loadTeams = async (auctionId) => {
    try {
      setLoading(true);
      const res = await instance.post(
        "/auction/team/all",
        { auction_id: auctionId },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );

      if (res.status === 200) {
        setTeams(res.data.teams || []);
      }
    } catch (error) {
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  // Fetch squad players
  const loadSquadPlayers = async (playerIds) => {
    if (!playerIds || playerIds.length === 0) {
      setAllSquadPlayers([]);
      return;
    }

    try {
      setLoading(true);
      const res = await instance.post(
        "/players/squad",
        { player_id: playerIds },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );

      if (res.status === 200) {
        const squad = res.data.squad || {};
        // Flatten all players into single array
        const flattenedPlayers = [
          ...(squad.batters || []),
          ...(squad.bowlers || []),
          ...(squad.all_rounders || []),
          ...(squad.wicket_keepers || []),
        ];
        setAllSquadPlayers(flattenedPlayers);
      }
    } catch (error) {
      toast.error("Failed to load squad");
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved playing 11
  const loadPlaying11 = async (teamId) => {
    try {
      const res = await instance.post(
        "/players/eleven/get",
        { team_id: teamId },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );

      if (res.status === 200 && res.data.playing11) {
        const p11 = Array.isArray(res.data.playing11) ? res.data.playing11 : [];
        // Filter out null values and convert to strings
        const validIds = p11.map(player => player._id)  
        setSavedPlaying11Ids(validIds);
      } else {
        setSavedPlaying11Ids([]);
      }
    } catch (error) {
      setSavedPlaying11Ids([]);
    }
  };

  // Handle auction selection
  const handleSelectAuction = async (auctionId) => {
    if (!auctionId) {
      setSelectedAuction(null);
      setTeams([]);
      setSelectedTeam(null);
      setAllSquadPlayers([]);
      setSavedPlaying11Ids([]);
      setCurrentView("squad");
      return;
    }

    try {
      setLoading(true);
      const res = await instance.post(
        "/auction/get",
        { auction_id: auctionId },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );

      if (res.status === 200) {
        setSelectedAuction(res.data.auction);
        await loadTeams(res.data.auction.id);
        setSelectedTeam(null);
        setAllSquadPlayers([]);
        setSavedPlaying11Ids([]);
        setCurrentView("squad");
      }
    } catch (error) {
      toast.error("Failed to load auction");
    } finally {
      setLoading(false);
    }
  };

  // Handle team selection
  const handleSelectTeam = async (teamId) => {
    if (!teamId) {
      setSelectedTeam(null);
      setAllSquadPlayers([]);
      setSavedPlaying11Ids([]);
      setIsOwner(false);
      return;
    }

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    setSelectedTeam(team);

    // Check ownership
    const owners = team.team_owners || [];
    const userEmail = userData?.email || "";
    setIsOwner(owners.includes(userEmail));

    // Load squad
    if (team.squad && team.squad.length > 0) {
      await loadSquadPlayers(team.squad);

      // Load playing 11 if IPL auction
      if (selectedAuction?.is_ipl_auction) {
        await loadPlaying11(team.id);
      }
    } else {
      setAllSquadPlayers([]);
      setSavedPlaying11Ids([]);
    }
  };

  // Get player by ID
  const getPlayerById = (playerId) => {
    if (!playerId) return null;
    return allSquadPlayers.find(p => p.id === playerId);
  };

  // Categorize players by role
  const categorizeByRole = (players) => {
    const categories = {
      batters: [],
      bowlers: [],
      allRounders: [],
      wicketKeepers: []
    };

    players.forEach(player => {
      const role = (player.role || "").toLowerCase();
      if (role.includes("batter") || role.includes("batsman")) {
        categories.batters.push(player);
      } else if (role.includes("bowler")) {
        categories.bowlers.push(player);
      } else if (role.includes("all-rounder")) {
        categories.allRounders.push(player);
      } else if (role.includes("wicket-keeper")) {
        categories.wicketKeepers.push(player);
      }
    });

    return categories;
  };

  // Get role icon
  const getRoleIcon = (role) => {
    const r = (role || "").toLowerCase();
    if (r.includes("batter") || r.includes("batsman")) return <GiCricketBat />;
    if (r.includes("bowler")) return <BiSolidCricketBall />;
    if (r.includes("all-rounder")) return <SportsCricketIcon />;
    if (r.includes("wicket-keeper")) return <GiWinterGloves />;
    return <SportsIcon />;
  };

  // Calculate stats
  const calculateStats = () => {
    const totalSpent = allSquadPlayers.reduce((sum, p) => sum + (p.selling_price || 0), 0);
    return {
      totalPlayers: allSquadPlayers.length,
      totalSpent: totalSpent,
      remaining: 100 - totalSpent
    };
  };

  // Start editing playing 11
  const startEditingPlaying11 = () => {
    if (!canEditWeekend) {
      toast.error("Playing 11 can only be edited on Saturday, or Sunday!");
      return;
    }
    if (!isOwner) {
      toast.error("Only team owners can edit Playing 11");
      return;
    }

    setDraftPlaying11Ids([...savedPlaying11Ids]);
    setEditingPlaying11(true);
  };

  // Toggle player in draft
  const togglePlayerInDraft = (playerId) => {
    const id = playerId;
    const currentIndex = draftPlaying11Ids.findIndex(pid => pid === id);

    if (currentIndex >= 0) {
      // Remove player
      setDraftPlaying11Ids(draftPlaying11Ids.filter(pid => pid !== id));
    } else {
      // Add player
      if (draftPlaying11Ids.length >= 11) {
        toast.error("Maximum 11 players allowed");
        return;
      }
      setDraftPlaying11Ids([...draftPlaying11Ids, id]);
    }
  };

  // Validate playing 11
  const validatePlaying11 = (playerIds) => {
    const errors = [];

    if (playerIds.length !== 11) {
      errors.push(`Must select exactly 11 players (currently ${playerIds.length})`);
    }

    const players = playerIds.map(id => getPlayerById(id)).filter(p => p);

    const counts = {
      batters: 0,
      bowlers: 0,
      allRounders: 0,
      keepers: 0,
      overseas: 0
    };

    players.forEach(p => {
      const role = (p.role || "").toLowerCase();
      const country = (p.country || "").toLowerCase();

      if (role.includes("batter") || role.includes("batsman")) counts.batters++;
      if (role.includes("bowler")) counts.bowlers++;
      if (role.includes("all-rounder")) counts.allRounders++;
      if (role.includes("wicket-keeper")) counts.keepers++;
      if (country && country !== "india") counts.overseas++;
    });

    if (counts.batters < 2) errors.push(`Need at least 2 batters (have ${counts.batters})`);
    if (counts.bowlers < 3) errors.push(`Need at least 3 bowlers (have ${counts.bowlers})`);
    if (counts.allRounders < 1) errors.push(`Need at least 1 all-rounder (have ${counts.allRounders})`);
    if (counts.keepers < 1) errors.push(`Need at least 1 wicket-keeper (have ${counts.keepers})`);
    if (counts.overseas > 4) errors.push(`Maximum 4 overseas players (have ${counts.overseas})`);

    return errors;
  };

  // Save playing 11
  const savePlaying11 = async () => {
    const errors = validatePlaying11(draftPlaying11Ids);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      setSaving(true);
      const squad = allSquadPlayers.map(p => p.id);
      const res = await instance.post(
        "/players/eleven/save",
        {
          squad: squad,
          player_ids: draftPlaying11Ids
        },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );

      if (res.status === 200) {
        toast.success("Playing 11 saved successfully!");
        setSavedPlaying11Ids([...draftPlaying11Ids]);
        setEditingPlaying11(false);
      }
    } catch (error) {
      toast.error("Failed to save Playing 11");
    } finally {
      setSaving(false);
    }
  };

  // Render player card
  const renderPlayerCard = (player, showP11Badge = false) => {
    const isInP11 = savedPlaying11Ids.some(id => id === player._id);
    const isOverseas = selectedAuction?.is_ipl_auction &&
      player.country &&
      player.country.toLowerCase() !== "india";

    return (
      <motion.div
        key={player._id}
        className="player-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => setSelectedPlayerForDetail(player)}
      >
        {showP11Badge && isInP11 && (
          <div className="p11-badge">
            <EmojiEventsIcon fontSize="small" /> P11
          </div>
        )}

        <div className="player-card-top">
          <div className="player-name-section">
            <h4>{player.player_name}</h4>
            <span className="player-role">{player.role}</span>
          </div>
          <div className="player-role-icon">
            {getRoleIcon(player.role)}
          </div>
        </div>

        <div className="player-card-info">
          <div className="info-line">
            <span>Base:</span>
            <span>₹{(player.base_price || 0).toFixed(1)} Cr</span>
          </div>
          <div className="info-line">
            <span>Sold:</span>
            <span>{player.selling_price ? `₹${player.selling_price.toFixed(1)} Cr` : "N/A"}</span>
          </div>
          {selectedAuction?.is_ipl_auction && (
            <div className="info-line">
              <span>Country:</span>
              <span className="country-info">
                {isOverseas && <FlightIcon fontSize="small" />}
                {player.country || "N/A"}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Render squad view
  const renderSquadView = () => {
    if (allSquadPlayers.length === 0) {
      return (
        <div className="empty-content">
          <SportsIcon className="empty-icon" />
          <h3>No Players</h3>
          <p>This team hasn't bought any players yet</p>
        </div>
      );
    }

    const categorized = categorizeByRole(allSquadPlayers);

    return (
      <div className="squad-view">
        {categorized.batters.length > 0 && (
          <div className="role-section">
            <div className="role-header">
              <GiCricketBat className="role-icon" />
              <h3>Batters ({categorized.batters.length})</h3>
            </div>
            <div className="players-grid">
              {categorized.batters.map(p => renderPlayerCard(p, true))}
            </div>
          </div>
        )}

        {categorized.bowlers.length > 0 && (
          <div className="role-section">
            <div className="role-header">
              <BiSolidCricketBall className="role-icon" />
              <h3>Bowlers ({categorized.bowlers.length})</h3>
            </div>
            <div className="players-grid">
              {categorized.bowlers.map(p => renderPlayerCard(p, true))}
            </div>
          </div>
        )}

        {categorized.allRounders.length > 0 && (
          <div className="role-section">
            <div className="role-header">
              <SportsCricketIcon className="role-icon" />
              <h3>All-Rounders ({categorized.allRounders.length})</h3>
            </div>
            <div className="players-grid">
              {categorized.allRounders.map(p => renderPlayerCard(p, true))}
            </div>
          </div>
        )}

        {categorized.wicketKeepers.length > 0 && (
          <div className="role-section">
            <div className="role-header">
              <GiWinterGloves className="role-icon" />
              <h3>Wicket-Keepers ({categorized.wicketKeepers.length})</h3>
            </div>
            <div className="players-grid">
              {categorized.wicketKeepers.map(p => renderPlayerCard(p, true))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render playing 11 view
  const renderPlaying11View = () => {
    const selectedPlayers = savedPlaying11Ids
      .map(id => getPlayerById(id))
      .filter(p => p);

    return (
      <div className="playing11-view">
        <div className="p11-header">
          <div className="p11-title">
            <h2><EmojiEventsIcon /> Playing 11</h2>
            <p>Your team lineup for this week</p>
          </div>

          {isOwner && (
            <motion.button
              className="edit-p11-btn"
              onClick={startEditingPlaying11}
              disabled={!canEditWeekend}
              whileHover={canEditWeekend ? { scale: 1.05 } : {}}
              whileTap={canEditWeekend ? { scale: 0.95 } : {}}
            >
              <EditIcon />
              {savedPlaying11Ids.length > 0 ? "Edit Team" : "Select Team"}
            </motion.button>
          )}
        </div>

        {!canEditWeekend && (
          <div className="weekend-alert">
            <TimerIcon />
            <span>Playing 11 can only be edited on Saturday, or Sunday</span>
          </div>
        )}

        {!isOwner && (
          <div className="owner-alert">
            <LockIcon />
            <span>Only team owners can edit Playing 11</span>
          </div>
        )}

        {selectedPlayers.length === 0 ? (
          <div className="empty-content">
            <EmojiEventsIcon className="empty-icon" />
            <h3>No Playing 11 Selected</h3>
            <p>
              {isOwner
                ? "Click 'Edit Team' to choose your playing 11"
                : "Team owner hasn't selected playing 11 yet"}
            </p>
          </div>
        ) : (
          <div className="p11-selected">
            <h3>Selected Team ({selectedPlayers.length}/11)</h3>
            <div className="players-grid">
              {selectedPlayers.map(p => renderPlayerCard(p, false))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render edit modal
  const renderEditModal = () => {
    if (!editingPlaying11) return null;

    const validationErrors = validatePlaying11(draftPlaying11Ids);

    return (
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setEditingPlaying11(false)}
      >
        <motion.div
          className="edit-modal"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2><EditIcon /> Select Playing 11</h2>
            <button onClick={() => setEditingPlaying11(false)}>
              <CloseIcon />
            </button>
          </div>

          <div className="selection-status">
            <div className="status-text">
              <span>Selected:</span>
              <strong>{draftPlaying11Ids.length}/11</strong>
            </div>
            <div className="status-bar">
              <div
                className="status-fill"
                style={{
                  width: `${(draftPlaying11Ids.length / 11) * 100}%`,
                  backgroundColor: draftPlaying11Ids.length === 11 ? '#22c55e' : '#3b82f6'
                }}
              />
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="validation-box">
              <h4><ErrorOutlineIcon /> Issues:</h4>
              <ul>
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-content">
            <div className="selectable-players">
              {allSquadPlayers.map(player => {
                const isSelected = draftPlaying11Ids.some(id => id === player.id);
                const isOverseas = selectedAuction?.is_ipl_auction &&
                  player.country &&
                  player.country.toLowerCase() !== "india";

                return (
                  <motion.div
                    key={player.id}
                    className={`selectable-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => togglePlayerInDraft(player.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="select-indicator">
                      {isSelected ? <CheckCircleIcon /> : <AddCircleIcon />}
                    </div>

                    <div className="selectable-content">
                      <div className="selectable-top">
                        <div>
                          <h4>{player.player_name}</h4>
                          <span className="role-badge">{player.role}</span>
                        </div>
                        <div className="role-icon-lg">
                          {getRoleIcon(player.role)}
                        </div>
                      </div>

                      <div className="selectable-info">
                        <span>₹{(player.base_price || 0).toFixed(1)} Cr</span>
                        {isOverseas && (
                          <span className="overseas-tag">
                            <FlightIcon fontSize="small" /> {player.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-cancel"
              onClick={() => setEditingPlaying11(false)}
            >
              Cancel
            </button>
            <button
              className="btn-save"
              onClick={savePlaying11}
              disabled={saving || validationErrors.length > 0}
            >
              {saving ? (
                <>
                  <div className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon />
                  Save Team
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Main render
  if (loading && !selectedAuction) {
    return (
      <div className="squads-page">
        <div className="loading-screen">
          <GavelIcon className="loading-icon" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const stats = selectedTeam ? calculateStats() : null;

  return (
    <motion.div
      className="squads-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="page-header">
        <div className="selectors">
          <select
            value={selectedAuction?.id || ""}
            onChange={e => handleSelectAuction(e.target.value)}
            className="selector-dropdown"
          >
            <option value="">Choose Auction</option>
            {auctions.map(a => (
              <option key={a.id} value={a.id}>{a.auction_name}</option>
            ))}
          </select>

          {selectedAuction && (
            <select
              value={selectedTeam?.id || ""}
              onChange={e => handleSelectTeam(e.target.value)}
              className="selector-dropdown"
            >
              <option value="">Choose Team</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.team_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!selectedAuction ? (
        <div className="empty-content">
          <GavelIcon className="empty-icon" />
          <h3>Select an Auction</h3>
          <p>Choose an auction to view squads</p>
        </div>
      ) : !selectedTeam ? (
        <div className="empty-content">
          <GroupsIcon className="empty-icon" />
          <h3>Select a Team</h3>
          <p>Choose a team to view their squad</p>
        </div>
      ) : (
        <>
          <div className="team-info-bar">
            <div className="team-name">
              <h2>{selectedTeam.team_name}</h2>
              {selectedAuction.is_ipl_auction && (
                <div className="view-switcher">
                  <button
                    className={currentView === "squad" ? "active" : ""}
                    onClick={() => setCurrentView("squad")}
                  >
                    <GroupsIcon /> Squad
                  </button>
                  <button
                    className={currentView === "playing11" ? "active" : ""}
                    onClick={() => setCurrentView("playing11")}
                  >
                    <EmojiEventsIcon /> Playing 11
                  </button>
                </div>
              )}
            </div>

            <div className="stats-row">
              <div className="stat-box">
                <PeopleIcon />
                <div>
                  <span className="stat-label">Players</span>
                  <span className="stat-value">{stats.totalPlayers}</span>
                </div>
              </div>
              <div className="stat-box">
                <AccountBalanceWalletIcon />
                <div>
                  <span className="stat-label">Spent</span>
                  <span className="stat-value">₹{stats.totalSpent.toFixed(1)} Cr</span>
                </div>
              </div>
              <div className="stat-box">
                <AccountBalanceWalletIcon />
                <div>
                  <span className="stat-label">Remaining</span>
                  <span className="stat-value">₹{stats.remaining.toFixed(1)} Cr</span>
                </div>
              </div>
            </div>
          </div>

          <div className="main-content">
            {loading ? (
              <div className="loading-screen">
                <GavelIcon className="loading-icon" />
                <p>Loading...</p>
              </div>
            ) : currentView === "squad" ? (
              renderSquadView()
            ) : (
              renderPlaying11View()
            )}
          </div>
        </>
      )}

      {/* Player detail modal */}
      <AnimatePresence>
        {selectedPlayerForDetail && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPlayerForDetail(null)}
          >
            <motion.div
              className="detail-modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Player Details</h2>
                <button onClick={() => setSelectedPlayerForDetail(null)}>
                  <CloseIcon />
                </button>
              </div>

              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Player Number:</span>
                  <span className="detail-value">{selectedPlayerForDetail.player_number || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedPlayerForDetail.player_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value">{selectedPlayerForDetail.role || "N/A"}</span>
                </div>
                {selectedAuction?.is_ipl_auction && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Country:</span>
                      <span className="detail-value">{selectedPlayerForDetail.country || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">IPL Team:</span>
                      <span className="detail-value">{selectedPlayerForDetail.ipl_team || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Fantasy Points:</span>
                      <span className="detail-value">{selectedPlayerForDetail.prev_fantasy_points || 0}</span>
                    </div>
                  </>
                )}
                <div className="detail-row">
                  <span className="detail-label">Previous Team:</span>
                  <span className="detail-value">{selectedPlayerForDetail.prev_team || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Current Team:</span>
                  <span className="detail-value">{selectedTeam?.team_name || "Not Assigned"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Base Price:</span>
                  <span className="detail-value">₹{(selectedPlayerForDetail.base_price || 0).toLocaleString()} Cr</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Selling Price:</span>
                  <span className="detail-value">
                    {selectedPlayerForDetail.selling_price
                      ? `₹${selectedPlayerForDetail.selling_price.toLocaleString()} Cr`
                      : "Not Sold"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-${selectedPlayerForDetail.hammer || "unsold"}`}>
                    {selectedPlayerForDetail.hammer || "Unsold"}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit playing 11 modal */}
      <AnimatePresence>
        {renderEditModal()}
      </AnimatePresence>
    </motion.div>
  );
}

export default Squads;