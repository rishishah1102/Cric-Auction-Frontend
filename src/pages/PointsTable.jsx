import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import auctionContext from "../context/auctionContext";
import { instance } from "../utils/axios";
import "../style/pointstable.css";

import EmojiEventsIcon    from "@mui/icons-material/EmojiEvents";
import ScoreboardIcon     from "@mui/icons-material/Scoreboard";
import EditNoteIcon       from "@mui/icons-material/EditNote";
import SaveIcon           from "@mui/icons-material/Save";
import ArrowBackIcon      from "@mui/icons-material/ArrowBack";
import SearchIcon         from "@mui/icons-material/Search";
import SportsCricketIcon  from "@mui/icons-material/SportsCricket";
import RefreshIcon        from "@mui/icons-material/Refresh";
import SwapHorizIcon      from "@mui/icons-material/SwapHoriz";
import WarningAmberIcon   from "@mui/icons-material/WarningAmber";
import CloseIcon          from "@mui/icons-material/Close";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon  from "@mui/icons-material/KeyboardArrowLeft";
import GroupsIcon         from "@mui/icons-material/Groups";
import { Avatar } from "@mui/material";

// ─── Constants ────────────────────────────────────────────────────────────────
const MATCH_OPTIONS = Array.from({ length: 10 }, (_, i) => ({ value: i, label: `M${i + 1}` }));

const ROLE_MAP = {
  BAT:  { color: "#1d4ed8", bg: "#dbeafe" },
  WK:   { color: "#c2410c", bg: "#ffedd5" },
  AR:   { color: "#15803d", bg: "#dcfce7" },
  BOWL: { color: "#4b5563", bg: "#f3f4f6" },
};

function getRoleInfo(role) {
  const r = (role || "").toUpperCase();
  if (r.includes("BAT")) return { ...ROLE_MAP.BAT, label: "BAT" };
  if (r.includes("WK") || r.includes("KEEPER") || r.includes("WICKET")) return { ...ROLE_MAP.WK, label: "WK" };
  if (r.includes("ALL") || r === "AR") return { ...ROLE_MAP.AR, label: "AR" };
  if (r.includes("BOWL")) return { ...ROLE_MAP.BOWL, label: "BOWL" };
  return { color: "#6b7280", bg: "#f9fafb", label: role?.slice(0, 4) || "?" };
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function RolePill({ role }) {
  const i = getRoleInfo(role);
  return <span className="pt-role-pill" style={{ color: i.color, background: i.bg }}>{i.label}</span>;
}

function XIBadge({ active }) {
  if (active === undefined || active === null) return <span className="pt-xi pt-xi-none" title="XI not set" />;
  return active
    ? <span className="pt-xi pt-xi-on" title="Playing XI" />
    : <span className="pt-xi pt-xi-off" title="Benched" />;
}

function Spinner() {
  return <div className="pt-spinner-wrap"><div className="pt-spinner" /></div>;
}

function EmptyState({ icon, text }) {
  return (
    <div className="pt-empty">
      <span className="pt-empty-icon">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

// Animated number
function AnimNum({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    let start = 0;
    const step = Math.ceil(target / 20);
    clearInterval(ref.current);
    ref.current = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(ref.current); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(ref.current);
  }, [value]);
  return <>{display}</>;
}

// Confirm Dialog
function ConfirmDialog({ open, onClose, onConfirm, loading }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="pt-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}>
          <motion.div className="pt-dialog" initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
            onClick={e => e.stopPropagation()}>
            <div className="pt-dialog-icon"><WarningAmberIcon sx={{ fontSize: 40, color: "#f59e0b" }} /></div>
            <h3 className="pt-dialog-title">Change Playing XI?</h3>
            <p className="pt-dialog-body">
              This will rotate the XI for <strong>all players</strong> in this auction:
            </p>
            <ul className="pt-dialog-list">
              <li>Earned/Benched/Total points → saved as previous</li>
              <li>Match points array reset to zeros (new week)</li>
              <li>Current XI → Previous XI, Next XI → Current XI</li>
              <li>Next XI reset to empty</li>
            </ul>
            <p className="pt-dialog-warn">⚠️ This action cannot be undone.</p>
            <div className="pt-dialog-actions">
              <button className="pt-dialog-cancel" onClick={onClose} disabled={loading}>Cancel</button>
              <button className="pt-dialog-confirm" onClick={onConfirm} disabled={loading}>
                {loading ? "Updating…" : "Yes, Change XI"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PointsTable() {
  const navigate = useNavigate();
  const location = useLocation();
  if (!location.state?.is_ipl_auction) {
    toast.error("Points table is not available for this auction");
    navigate('/');
  }

  const { userData, userAuctions } = useContext(auctionContext);

  const [selectedId,     setSelectedId]     = useState(location.state?.auctionId || "");
  const [auction,        setAuction]         = useState(null);
  const [isCreator,      setIsCreator]       = useState(false);
  const [auctionLoading, setAuctionLoading]  = useState(false);
  const [activeTab,      setActiveTab]       = useState("leaderboard");

  // Enter Points
  const [matchIndex,    setMatchIndex]    = useState(0);
  const [iplTeam1,      setIplTeam1]      = useState("");
  const [iplTeam2,      setIplTeam2]      = useState("");
  const [iplTeams,      setIplTeams]      = useState([]);
  const [matchPlayers,  setMatchPlayers]  = useState([]);
  const [pointsMap,     setPointsMap]     = useState({});
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [loadingPl,     setLoadingPl]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [showXIConfirm, setShowXIConfirm] = useState(false);
  const [xiLoading,     setXiLoading]     = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading,   setLbLoading]   = useState(false);

  // Scoreboard
  const [scoreboard, setScoreboard] = useState([]);
  const [sbLoading,  setSbLoading]  = useState(false);
  const [search,     setSearch]     = useState("");

  // Team Details
  const [teamDetail,       setTeamDetail]       = useState(null);   // { name, players }
  const [teamDetailLoading, setTeamDetailLoading] = useState(false);

  const auth = () => ({ Authorization: localStorage.getItem("auction") });

  // ── Enable scrolling on body ─────────────────────────────────────────────
  useEffect(() => {
    document.title = "Points Table";
    document.body.classList.add("scroll-enabled");
    return () => document.body.classList.remove("scroll-enabled");
  }, []);

  // ── Fetch full auction (for created_by check) ──────────────────────────────
  const loadAuction = useCallback(async (id) => {
    if (!id) return;
    setAuctionLoading(true);
    try {
      const res = await instance.post("/auction/get", { auction_id: id }, { headers: auth() });
      if (res.status === 200) {
        setAuction(res.data.auction);
        setIsCreator(res.data.auction.created_by === userData?.email);
      }
    } catch { toast.error("Failed to load auction"); }
    finally { setAuctionLoading(false); }
  }, [userData?.email]);

  useEffect(() => { if (selectedId) loadAuction(selectedId); }, [selectedId, loadAuction]);

  // ── IPL teams ──────────────────────────────────────────────────────────────
  const fetchIPLTeams = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await instance.post("/points-table/ipl-teams", { auction_id: selectedId }, { headers: auth() });
      if (res.status === 200) setIplTeams(res.data.teams || []);
    } catch { toast.error("Failed to load IPL teams"); }
  }, [selectedId]);

  useEffect(() => { if (selectedId && isCreator) fetchIPLTeams(); }, [selectedId, isCreator, fetchIPLTeams]);

  // ── Leaderboard ────────────────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    if (!selectedId) return;
    setLbLoading(true);
    try {
      const res = await instance.post("/points-table/leaderboard", { auction_id: selectedId }, { headers: auth() });
      if (res.status === 200) setLeaderboard(res.data.leaderboard || []);
    } catch { toast.error("Failed to load leaderboard"); }
    finally { setLbLoading(false); }
  }, [selectedId]);

  // ── Scoreboard ─────────────────────────────────────────────────────────────
  const fetchScoreboard = useCallback(async () => {
    if (!selectedId) return;
    setSbLoading(true);
    try {
      const res = await instance.post("/points-table/scoreboard", { auction_id: selectedId }, { headers: auth() });
      if (res.status === 200) setScoreboard(res.data.players || []);
    } catch { toast.error("Failed to load scoreboard"); }
    finally { setSbLoading(false); }
  }, [selectedId]);

  // ── Team Details ──────────────────────────────────────────────────────────
  const fetchTeamDetails = useCallback(async (teamName) => {
    if (!selectedId || !teamName) return;
    setTeamDetailLoading(true);
    try {
      const res = await instance.post("/points-table/team-details",
        { auction_id: selectedId, team_name: teamName },
        { headers: auth() }
      );
      if (res.status === 200) {
        setTeamDetail({ name: teamName, players: res.data.players || [] });
      }
    } catch { toast.error("Failed to load team details"); }
    finally { setTeamDetailLoading(false); }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    if (activeTab === "leaderboard") { fetchLeaderboard(); setTeamDetail(null); }
    else if (activeTab === "scoreboard") fetchScoreboard();
  }, [activeTab, selectedId, fetchLeaderboard, fetchScoreboard]);

  // ── Load match players ─────────────────────────────────────────────────────
  const loadMatchPlayers = async () => {
    if (!iplTeam1 || !iplTeam2) { toast.error("Select both IPL teams"); return; }
    if (iplTeam1 === iplTeam2)  { toast.error("Select two different teams"); return; }
    setLoadingPl(true); setPlayersLoaded(false);
    try {
      const res = await instance.post("/points-table/match-players",
        { auction_id: selectedId, ipl_team1: iplTeam1, ipl_team2: iplTeam2 },
        { headers: auth() }
      );
      if (res.status === 200) {
        const players = res.data.players || [];
        setMatchPlayers(players);
        const map = {};
        players.forEach(p => { if (p.match_data) map[p.match_data._id] = p.match_data.matches?.[matchIndex] ?? 0; });
        setPointsMap(map);
        setPlayersLoaded(true);
      }
    } catch { toast.error("Failed to load players"); }
    finally { setLoadingPl(false); }
  };

  useEffect(() => {
    if (!playersLoaded) return;
    const map = {};
    matchPlayers.forEach(p => { if (p.match_data) map[p.match_data._id] = p.match_data.matches?.[matchIndex] ?? 0; });
    setPointsMap(map);
  }, [matchIndex]); // eslint-disable-line

  // ── Save points ────────────────────────────────────────────────────────────
  const saveAllPoints = async () => {
    const updates = matchPlayers.filter(p => p.match_data)
      .map(p => ({ match_id: p.match_data._id, points: Number(pointsMap[p.match_data._id]) || 0 }));
    if (!updates.length) { toast.warning("No players with match records"); return; }
    setSaving(true);
    try {
      await instance.patch("/points-table/match-points", { match_index: matchIndex, updates }, { headers: auth() });
      toast.success("Points saved!");
    } catch { toast.error("Failed to save points"); }
    finally { setSaving(false); }
  };

  // ── Change XI ──────────────────────────────────────────────────────────────
  const handleChangeXI = async () => {
    setXiLoading(true);
    try {
      await instance.post("/points-table/change-xi", { auction_id: selectedId }, { headers: auth() });
      toast.success("Playing XI updated successfully!");
      setShowXIConfirm(false);
    } catch { toast.error("Failed to change XI"); }
    finally { setXiLoading(false); }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const team1Players = matchPlayers.filter(p => p.ipl_team === iplTeam1);
  const team2Players = matchPlayers.filter(p => p.ipl_team === iplTeam2);
  const maxMatchLen  = scoreboard.reduce((m, p) => Math.max(m, p.match_data?.matches?.length || 0), 0);
  const filteredSB   = scoreboard.filter(p =>
    !search ||
    p.player_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.ipl_team?.toLowerCase().includes(search.toLowerCase()) ||
    p.current_team?.toLowerCase().includes(search.toLowerCase())
  );

  // top 4 for hero section, rest for ranked list
  const top4 = leaderboard.slice(0, 4);
  const rest = leaderboard.slice(4);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="pt-page">
      {/* ── Confirm Dialog ── */}
      <ConfirmDialog open={showXIConfirm} onClose={() => setShowXIConfirm(false)}
        onConfirm={handleChangeXI} loading={xiLoading} />

      {/* ── Top Bar ── */}
      <div className="pt-topbar">
        <button className="pt-back" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowBackIcon fontSize="small" />
        </button>
        <div className="pt-topbar-title">
          <EmojiEventsIcon sx={{ color: "#f59e0b", fontSize: 22 }} />
          <span>Points Table</span>
        </div>
        <select className="pt-auction-pick" value={selectedId}
          onChange={e => {
            setSelectedId(e.target.value);
            setPlayersLoaded(false); setMatchPlayers([]);
            setLeaderboard([]); setScoreboard([]);
          }}>
          <option value="">Choose auction…</option>
          {(userAuctions || []).map(a => <option key={a.id} value={a.id}>{a.auction_name}</option>)}
        </select>
      </div>

      {!selectedId ? (
        <div className="pt-splash">
          <SportsCricketIcon className="pt-splash-icon" />
          <p>Select an auction to view the points table</p>
        </div>
      ) : auctionLoading ? (
        <Spinner />
      ) : !auction?.is_ipl_auction ? (
        <div className="pt-splash">
          <EmojiEventsIcon className="pt-splash-icon" />
          <p>Points table is only available for IPL auctions</p>
        </div>
      ) : (
        <div className="pt-body">

          {/* ── Tabs ── */}
          <div className="pt-tabs-row">
            <div className="pt-tabs">
              {[
                { id: "leaderboard", icon: <EmojiEventsIcon fontSize="small" />,   label: "Leaderboard" },
                { id: "scoreboard",  icon: <ScoreboardIcon fontSize="small" />,    label: "Scoreboard"  },
                ...(isCreator ? [{ id: "enter", icon: <EditNoteIcon fontSize="small" />, label: "Enter Points" }] : []),
              ].map(tab => (
                <button key={tab.id}
                  className={`pt-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}>
                  {tab.icon}
                  <span className="pt-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ══════════ LEADERBOARD ══════════ */}
            {activeTab === "leaderboard" && (
              <motion.div key="lb" className="pt-section"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

                <div className="pt-section-head">
                  <h2>Leaderboard</h2>
                  <button className="pt-icon-btn" onClick={fetchLeaderboard} disabled={lbLoading} title="Refresh">
                    <RefreshIcon fontSize="small" className={lbLoading ? "spinning" : ""} />
                  </button>
                </div>

                {lbLoading ? <Spinner /> : leaderboard.length === 0 ? (
                  <EmptyState icon={<EmojiEventsIcon />} text="No data yet. Enter match points to get started." />
                ) : teamDetail ? (
                  /* ── Team Detail View ── */
                  <motion.div className="pt-team-detail"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <button className="pt-detail-back" onClick={() => setTeamDetail(null)}>
                      <KeyboardArrowLeftIcon fontSize="small" /> Back to Leaderboard
                    </button>
                    <div className="pt-detail-header">
                      <GroupsIcon sx={{ color: "#0d2249" }} />
                      <h3>{teamDetail.name}</h3>
                      <div className="pt-detail-totals">
                        <span className="pt-detail-earned">
                          XI Pts: <b>{teamDetail.players.reduce((s, p) => s + (p.match_data?.earnedPoints ?? 0), 0)}</b>
                        </span>
                        <span className="pt-detail-benched">
                          Bench: <b>{teamDetail.players.reduce((s, p) => s + (p.match_data?.benchedPoints ?? 0), 0)}</b>
                        </span>
                      </div>
                    </div>
                    {teamDetailLoading ? <Spinner /> : teamDetail.players.length === 0 ? (
                      <EmptyState icon={<GroupsIcon />} text="No players in this team." />
                    ) : (
                      <div className="pt-table-wrap">
                        <table className="pt-table">
                          <thead>
                            <tr>
                              <th className="pt-th center">#</th>
                              <th className="pt-th">Player</th>
                              <th className="pt-th">IPL Team</th>
                              <th className="pt-th">Role</th>
                              <th className="pt-th center">XI</th>
                              {Array.from({ length: teamDetail.players.reduce((m, p) =>
                                Math.max(m, p.match_data?.matches?.length || 0), 0) }, (_, i) => (
                                <th key={i} className="pt-th center pt-th-match">M{i + 1}</th>
                              ))}
                              <th className="pt-th center pt-th-earned">Earned</th>
                              <th className="pt-th center pt-th-benched">Benched</th>
                              <th className="pt-th center pt-th-total">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamDetail.players.map((p, i) => {
                              const info = getRoleInfo(p.role);
                              const maxM = teamDetail.players.reduce((m, pl) =>
                                Math.max(m, pl.match_data?.matches?.length || 0), 0);
                              return (
                                <motion.tr key={i} className="pt-tr" style={{ "--rc": info.color }}
                                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  transition={{ delay: Math.min(i * 0.02, 0.3) }}>
                                  <td className="pt-td center muted">{i + 1}</td>
                                  <td className="pt-td bold">{p.player_name}</td>
                                  <td className="pt-td"><span className="pt-ipl-chip">{p.ipl_team || "—"}</span></td>
                                  <td className="pt-td"><RolePill role={p.role} /></td>
                                  <td className="pt-td center"><XIBadge active={p.match_data?.currentX1} /></td>
                                  {Array.from({ length: maxM }, (_, j) => (
                                    <td key={j} className="pt-td center">{p.match_data?.matches?.[j] ?? 0}</td>
                                  ))}
                                  <td className="pt-td center pt-earned-cell">{p.match_data?.earnedPoints ?? 0}</td>
                                  <td className="pt-td center pt-benched-cell">{p.match_data?.benchedPoints ?? 0}</td>
                                  <td className="pt-td center pt-total-cell">{p.match_data?.totalPoints ?? 0}</td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <>
                    {/* Top 4 hero cards */}
                    <div className="pt-top4-grid">
                      {top4.map((entry, idx) => (
                        <Top4Card key={entry.team_name} entry={entry} rank={idx + 1}
                          onClick={() => fetchTeamDetails(entry.team_name)} />
                      ))}
                    </div>

                    {/* Rest of rankings */}
                    {rest.length > 0 && (
                      <div className="pt-lb-list">
                        {rest.map((entry, i) => (
                          <motion.div key={entry.team_name} className="pt-lb-row pt-lb-clickable"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => fetchTeamDetails(entry.team_name)}>
                            <span className="pt-lb-rank-num">{i + 5}</span>
                            <Avatar src={entry.team_image} sx={{ width: 38, height: 38, flexShrink: 0 }} />
                            <span className="pt-lb-name">{entry.team_name}</span>
                            <div className="pt-lb-stats">
                              <LbStat label="XI Pts" value={entry.earned_points}  color="#16a34a" />
                              <LbStat label="Bench"  value={entry.benched_points} color="#d97706" />
                              <LbStat label="Total"  value={entry.total_points}   color="#0d2249" bold />
                            </div>
                            <KeyboardArrowRightIcon className="pt-lb-arrow" />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ══════════ SCOREBOARD ══════════ */}
            {activeTab === "scoreboard" && (
              <motion.div key="sb" className="pt-section"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

                <div className="pt-section-head">
                  <h2>Scoreboard</h2>
                  <button className="pt-icon-btn" onClick={fetchScoreboard} disabled={sbLoading} title="Refresh">
                    <RefreshIcon fontSize="small" className={sbLoading ? "spinning" : ""} />
                  </button>
                </div>

                <div className="pt-searchbar">
                  <SearchIcon className="pt-search-ico" />
                  <input type="text" placeholder="Search player, IPL team or fantasy team…"
                    value={search} onChange={e => setSearch(e.target.value)} className="pt-search-inp" />
                  {search && (
                    <button className="pt-clear-search" onClick={() => setSearch("")}>
                      <CloseIcon fontSize="small" />
                    </button>
                  )}
                </div>

                {sbLoading ? <Spinner /> : filteredSB.length === 0 ? (
                  <EmptyState icon={<ScoreboardIcon />} text="No scoreboard data yet." />
                ) : (
                  <div className="pt-table-wrap">
                    <table className="pt-table">
                      <thead>
                        <tr>
                          <th className="pt-th center">#</th>
                          <th className="pt-th">Player</th>
                          <th className="pt-th">IPL Team</th>
                          <th className="pt-th">Role</th>
                          <th className="pt-th">Fantasy Team</th>
                          <th className="pt-th center">XI</th>
                          {Array.from({ length: maxMatchLen }, (_, i) => (
                            <th key={i} className="pt-th center pt-th-match">M{i + 1}</th>
                          ))}
                          <th className="pt-th center pt-th-earned">Earned</th>
                          <th className="pt-th center pt-th-benched">Benched</th>
                          <th className="pt-th center pt-th-total">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSB.map((p, i) => {
                          const info = getRoleInfo(p.role);
                          return (
                            <motion.tr key={p._id || i} className="pt-tr"
                              style={{ "--rc": info.color }}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              transition={{ delay: Math.min(i * 0.01, 0.3) }}>
                              <td className="pt-td center muted">{i + 1}</td>
                              <td className="pt-td bold">{p.player_name}</td>
                              <td className="pt-td">
                                <span className="pt-ipl-chip">{p.ipl_team || "—"}</span>
                              </td>
                              <td className="pt-td"><RolePill role={p.role} /></td>
                              <td className="pt-td muted">{p.current_team || <i>Unsold</i>}</td>
                              <td className="pt-td center">
                                <XIBadge active={p.match_data?.currentX1} />
                              </td>
                              {Array.from({ length: maxMatchLen }, (_, j) => (
                                <td key={j} className="pt-td center">
                                  {p.match_data?.matches?.[j] ?? 0}
                                </td>
                              ))}
                              <td className="pt-td center pt-earned-cell">
                                {p.match_data?.earnedPoints ?? 0}
                              </td>
                              <td className="pt-td center pt-benched-cell">
                                {p.match_data?.benchedPoints ?? 0}
                              </td>
                              <td className="pt-td center pt-total-cell">
                                {p.match_data?.totalPoints ?? 0}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════ ENTER POINTS ══════════ */}
            {activeTab === "enter" && isCreator && (
              <motion.div key="ep" className="pt-section"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

                {/* Actions row */}
                <div className="pt-ep-actions-row">
                  <h2 className="pt-section-h2">Enter Points</h2>
                  <button className="pt-xi-btn" onClick={() => setShowXIConfirm(true)}>
                    <SwapHorizIcon fontSize="small" />
                    Change XI
                  </button>
                </div>

                {/* Config card */}
                <div className="pt-config">
                  <div className="pt-config-block">
                    <label className="pt-cfg-label">Select Match</label>
                    <div className="pt-match-chips">
                      {MATCH_OPTIONS.map(o => (
                        <button key={o.value}
                          className={`pt-match-chip ${matchIndex === o.value ? "active" : ""}`}
                          onClick={() => setMatchIndex(o.value)}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-config-block">
                    <label className="pt-cfg-label">Match — Select Teams</label>
                    <div className="pt-teams-row">
                      <div className="pt-team-picker">
                        <span className="pt-picker-badge pt-badge-1">Team 1</span>
                        <div className="pt-team-chips">
                          {iplTeams.filter(t => t !== iplTeam2).map(t => (
                            <button key={t}
                              className={`pt-team-chip ${iplTeam1 === t ? "active" : ""}`}
                              onClick={() => { setIplTeam1(iplTeam1 === t ? "" : t); setPlayersLoaded(false); }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-vs-divider">
                        <span>VS</span>
                      </div>

                      <div className="pt-team-picker">
                        <span className="pt-picker-badge pt-badge-2">Team 2</span>
                        <div className="pt-team-chips">
                          {iplTeams.filter(t => t !== iplTeam1).map(t => (
                            <button key={t}
                              className={`pt-team-chip ${iplTeam2 === t ? "active" : ""}`}
                              onClick={() => { setIplTeam2(iplTeam2 === t ? "" : t); setPlayersLoaded(false); }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="pt-load-btn" onClick={loadMatchPlayers}
                    disabled={loadingPl || !iplTeam1 || !iplTeam2}>
                    {loadingPl ? "Loading…" : `Load Players — M${matchIndex + 1}: ${iplTeam1 || "?"} vs ${iplTeam2 || "?"}`}
                  </button>
                </div>

                {/* Players grid */}
                {playersLoaded && (
                  <motion.div className="pt-entry-grid"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <TeamCol teamName={iplTeam1} players={team1Players} matchIndex={matchIndex}
                      pointsMap={pointsMap} setPointsMap={setPointsMap} accentClass="pt-col-1" />
                    <TeamCol teamName={iplTeam2} players={team2Players} matchIndex={matchIndex}
                      pointsMap={pointsMap} setPointsMap={setPointsMap} accentClass="pt-col-2" />
                  </motion.div>
                )}

                {/* Save bar */}
                {playersLoaded && (
                  <div className="pt-save-bar">
                    <div className="pt-save-meta">
                      <span className="pt-save-match">Match {matchIndex + 1}</span>
                      <span className="pt-save-vs">{iplTeam1} vs {iplTeam2}</span>
                    </div>
                    <div className="pt-save-actions">
                      <button className="pt-save-btn" onClick={saveAllPoints} disabled={saving}>
                        <SaveIcon fontSize="small" />
                        {saving ? "Saving…" : "Save All Points"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Top 4 Card ───────────────────────────────────────────────────────────────
const RANK_STYLES = {
  1: { gradient: "linear-gradient(145deg,#fffbeb,#fef3c7)", border: "#fbbf24", medal: "🥇", size: "large" },
  2: { gradient: "linear-gradient(145deg,#f8fafc,#f1f5f9)", border: "#94a3b8", medal: "🥈", size: "medium" },
  3: { gradient: "linear-gradient(145deg,#fff7ed,#ffedd5)", border: "#fb923c", medal: "🥉", size: "medium" },
  4: { gradient: "linear-gradient(145deg,#f0fdf4,#dcfce7)", border: "#86efac", medal: "4th", size: "small" },
};

function Top4Card({ entry, rank, onClick }) {
  const s = RANK_STYLES[rank] || RANK_STYLES[4];
  return (
    <motion.div
      className={`pt-top4-card pt-top4-${s.size}`}
      style={{ background: s.gradient, borderColor: s.border, cursor: "pointer" }}
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, type: "spring", stiffness: 120 }}
      whileHover={{ scale: 1.03, boxShadow: "0 12px 32px rgba(0,0,0,0.14)" }}
    >
      <div className="pt-top4-medal">{s.medal}</div>
      <Avatar src={entry.team_image}
        sx={{ width: s.size === "large" ? 64 : 52, height: s.size === "large" ? 64 : 52,
          border: `3px solid ${s.border}`, boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }} />
      <div className="pt-top4-name">{entry.team_name}</div>
      <div className="pt-top4-pts"><AnimNum value={entry.earned_points} /></div>
      <div className="pt-top4-pts-label">XI Points</div>
      <div className="pt-top4-sub-row">
        <span>Bench <b>{entry.benched_points}</b></span>
        <span>·</span>
        <span>Total <b>{entry.total_points}</b></span>
      </div>
    </motion.div>
  );
}

function LbStat({ label, value, color, bold }) {
  return (
    <div className="pt-lb-stat">
      <span className="pt-lb-stat-lbl">{label}</span>
      <span className="pt-lb-stat-val" style={{ color, fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}

// ─── Team Column (Enter Points) ───────────────────────────────────────────────
function TeamCol({ teamName, players, matchIndex, pointsMap, setPointsMap, accentClass }) {
  return (
    <div className={`pt-team-col ${accentClass}`}>
      <div className="pt-team-col-hd">
        <span className="pt-team-col-name">{teamName}</span>
        <span className="pt-team-col-badge">{players.length}</span>
      </div>
      <div className="pt-entries">
        {players.length === 0 ? (
          <p className="pt-no-pl">No players found</p>
        ) : (
          players.map((p, i) => {
            const hasMatch = !!p.match_data;
            const info = getRoleInfo(p.role);
            return (
              <motion.div key={p.id} className="pt-entry-row" style={{ "--rc": info.color }}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}>
                <div className="pt-entry-left">
                  <RolePill role={p.role} />
                  <div className="pt-entry-info">
                    <span className="pt-entry-name">{p.player_name}</span>
                    <span className="pt-entry-sub">{p.current_team || "Unsold"}</span>
                  </div>
                </div>
                <div className="pt-entry-right">
                  <XIBadge active={p.match_data?.currentX1} />
                  {hasMatch ? (
                    <div className="pt-pts-box">
                      <input type="number" min="0" max="999"
                        className="pt-pts-input"
                        value={pointsMap[p.match_data._id] ?? 0}
                        onChange={e => setPointsMap(prev => ({ ...prev, [p.match_data._id]: e.target.value }))}
                      />
                      <span className="pt-pts-label">pts</span>
                    </div>
                  ) : (
                    <span className="pt-no-rec">—</span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
