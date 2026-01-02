import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

// Icons
import GavelIcon from "@mui/icons-material/Gavel";
import SportsIcon from "@mui/icons-material/Sports";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import FlightIcon from "@mui/icons-material/Flight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { GiCricketBat } from "react-icons/gi";
import { BiSolidCricketBall } from "react-icons/bi";
import { GiWinterGloves } from "react-icons/gi";

import '../style/biddingroom.css';
import { instance } from '../utils/axios';

function BiddingRoom() {
    const navigate = useNavigate();

    const location = useLocation();
    const { auctionId, auctionName } = location.state || {};

    const [teams, setTeams] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingPlayer, setFetchingPlayer] = useState(false);
    const [playerSource, setPlayerSource] = useState('upcoming');
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        document.title = `🔥 LIVE - ${auctionName || 'Auction'}`;
        document.body.classList.add("scroll-enabled");

        const fetchTeams = async () => {
            if (!auctionId) return;

            try {
                setLoading(true);
                const response = await instance.post(
                    "/bidding/teams/all",
                    { auction_id: auctionId },
                    { headers: { Authorization: localStorage.getItem("auction") } }
                );
                if (response.status === 200) {
                    const fetchedTeams = response.data.teams || [];
                    setTeams(fetchedTeams);
                }
            } catch (error) {
                toast.error("Failed to fetch teams!");
                console.error("Error fetching teams:", error);
            } finally {
                setLoading(false);
            }
        };

        if (auctionId) {
            fetchTeams();
        }

        return () => document.body.classList.remove("scroll-enabled");
    }, [auctionId, auctionName]);

    const fetchPlayer = async (source) => {
        try {
            setFetchingPlayer(true);
            const response = await instance.post(
                `/bidding/player/fetch?hammer=${source}`,
                { auction_id: auctionId },
                { headers: { Authorization: localStorage.getItem("auction") } }
            );

            if (response.status === 200) {
                setCurrentPlayer(response.data.player);
                setBidAmount(response.data.player.base_price.toString());
                setSelectedTeam(null);
                toast.success("Player is LIVE!");
            }
        } catch (error) {
            toast.error("Failed to fetch player!");
            console.error("Error fetching player:", error);
        } finally {
            setFetchingPlayer(false);
        }
    };

    const handleBid = (team) => {
        if (!bidAmount || parseFloat(bidAmount) < (currentPlayer?.base_price || 0)) {
            toast.error("Bid amount must be at least the base price!");
            return;
        }

        if (parseFloat(bidAmount) > team.team_purse) {
            toast.error(`${team.team_name} doesn't have enough budget!`);
            return;
        }

        setSelectedTeam(team);
    };

    const handleSold = async () => {
        if (!selectedTeam || !currentPlayer) {
            toast.error("Please select a team first!");
            return;
        }

        try {
            setLoading(true);
            const response = await instance.post(
                "/bidding/players/sold",
                {
                    player_id: currentPlayer._id,
                    team_id: selectedTeam.id,
                    selling_price: parseFloat(bidAmount),
                    auction_id: auctionId
                },
                { headers: { Authorization: localStorage.getItem("auction") } }
            );

            if (response.status === 200) {
                setTeams(prevTeams =>
                    prevTeams.map(team =>
                        team.id === selectedTeam.id
                            ? {
                                ...team,
                                budget: team.team_purse - parseFloat(bidAmount),
                                batters: currentPlayer.role === 'Batter' ? (team.batters || 0) + 1 : team.batters,
                                bowler: currentPlayer.role === 'Bowler' ? (team.bowler || 0) + 1 : team.bowler,
                                wicket_keepers: currentPlayer.role === 'Wicket-Keeper' ? (team.wicket_keepers || 0) + 1 : team.wicket_keepers,
                                all_rounders: currentPlayer.role === 'All-Rounder' ? (team.all_rounders || 0) + 1 : team.all_rounders,
                                overseas: currentPlayer.country !== 'India' ? (team.overseas || 0) + 1 : team.overseas
                            }
                            : team
                    )
                );

                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);

                toast.success(`🎉 SOLD to ${selectedTeam.team_name}!`);
                setCurrentPlayer(null);
                setBidAmount('');
                setSelectedTeam(null);
            }
        } catch (error) {
            toast.error("Failed to mark player as sold!");
            console.error("Error marking player as sold:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsold = async () => {
        if (!currentPlayer) return;

        try {
            setLoading(true);
            const response = await instance.post(
                "bidding/players/unsold",
                {
                    player_id: currentPlayer._id,
                    auction_id: auctionId
                },
                { headers: { Authorization: localStorage.getItem("auction") } }
            );

            if (response.status === 200) {
                toast.info(`${currentPlayer.player_name} remains UNSOLD`);
                setCurrentPlayer(null);
                setBidAmount('');
                setSelectedTeam(null);
            }
        } catch (error) {
            toast.error("Failed to mark player as unsold!");
            console.error("Error marking player as unsold:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleBack = () => {
        if (window.confirm("Are you sure you want to leave the auction?")) {
            navigate(-1);
        }
    };

    if (loading && teams.length === 0) {
        return (
            <div className="bidding-container">
                <div className="loading-state">
                    <div className="hammer-container">
                        <GavelIcon className="hammer-icon" />
                        <div className="impact" />
                    </div>
                    <p>Loading auction room...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bidding-container"
        >
            {/* Confetti Effect */}
            <AnimatePresence>
                {showConfetti && (
                    <div className="confetti-container">
                        {[...Array(50)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="confetti"
                                initial={{
                                    x: Math.random() * window.innerWidth,
                                    y: -20,
                                    rotate: 0
                                }}
                                animate={{
                                    y: window.innerHeight + 20,
                                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                                    x: Math.random() * window.innerWidth
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 2,
                                    ease: "linear"
                                }}
                                style={{
                                    backgroundColor: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)]
                                }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Back Button */}
            <motion.button
                className="back-button"
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <ArrowBackIcon />
                Exit Auction
            </motion.button>

            {/* Live Header */}
            <motion.div
                className="live-header"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <div className="live-badge">
                    <motion.div
                        className="live-dot"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    LIVE
                </div>
                <h1 className="auction-title">
                    <LocalFireDepartmentIcon className="fire-icon" />
                    {auctionName}
                    <LocalFireDepartmentIcon className="fire-icon" />
                </h1>
                <div className="trophy-icon">
                    <EmojiEventsIcon />
                </div>
            </motion.div>

            {/* Main Arena */}
            <div className="auction-arena">

                {/* Center Stage - Player Display */}
                <div className="center-stage">
                    {!currentPlayer && !fetchingPlayer && (
                        <motion.div
                            className="fetch-controls"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <h2 className="fetch-title">
                                <GavelIcon /> BRING OUT THE NEXT PLAYER
                            </h2>

                            <div className="source-selector">
                                <motion.button
                                    className={`source-button ${playerSource === 'upcoming' ? 'active' : ''}`}
                                    onClick={() => setPlayerSource('upcoming')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <PlayArrowIcon />
                                    <span>UPCOMING</span>
                                </motion.button>
                                <motion.button
                                    className={`source-button ${playerSource === 'unsold' ? 'active' : ''}`}
                                    onClick={() => setPlayerSource('unsold')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <SkipNextIcon />
                                    <span>UNSOLD</span>
                                </motion.button>
                            </div>

                            <motion.button
                                className="fetch-player-button"
                                onClick={() => fetchPlayer(playerSource)}
                                disabled={fetchingPlayer}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <GavelIcon />
                                START BIDDING
                            </motion.button>
                        </motion.div>
                    )}

                    {fetchingPlayer && (
                        <motion.div
                            className="fetching-state"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                        >
                            <motion.div
                                className="gavel-animation"
                                animate={{
                                    rotate: [0, -30, 0, -30, 0],
                                    scale: [1, 1.1, 1, 1.1, 1]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "easeInOut"
                                }}
                            >
                                <GavelIcon />
                            </motion.div>
                            <h3>FETCHING PLAYER...</h3>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {currentPlayer && (
                            <motion.div
                                className="player-spotlight"
                                initial={{
                                    scale: 0,
                                    rotateY: -180,
                                    opacity: 0
                                }}
                                animate={{
                                    scale: 1,
                                    rotateY: 0,
                                    opacity: 1
                                }}
                                exit={{
                                    scale: 0,
                                    rotateY: 180,
                                    opacity: 0
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 80,
                                    damping: 15
                                }}
                            >
                                <motion.div
                                    className="spotlight-glow"
                                    animate={{
                                        opacity: [0.5, 1, 0.5],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2
                                    }}
                                />

                                <div className="player-showcase">
                                    <div className="player-header-section">
                                        <motion.div
                                            className="role-badge"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            {getRoleIcon(currentPlayer.role)}
                                        </motion.div>

                                        <div className="player-identity">
                                            <motion.h2
                                                initial={{ x: -50, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                {currentPlayer.player_name}
                                            </motion.h2>
                                            <motion.p
                                                initial={{ x: -50, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                {currentPlayer.role}
                                            </motion.p>
                                        </div>

                                        {currentPlayer.country && currentPlayer.country !== 'India' && (
                                            <motion.div
                                                className="overseas-tag"
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                <FlightIcon /> OVERSEAS
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="player-stats-showcase">
                                        <motion.div
                                            className="stat-card"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <span className="stat-label">Country</span>
                                            <span className="stat-value">{currentPlayer.country || 'N/A'}</span>
                                        </motion.div>
                                        <motion.div
                                            className="stat-card"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <span className="stat-label">Previous Team</span>
                                            <span className="stat-value">{currentPlayer.prev_team || 'N/A'}</span>
                                        </motion.div>
                                        <motion.div
                                            className="stat-card highlight"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <span className="stat-label">BASE PRICE</span>
                                            <span className="stat-value-big">₹{currentPlayer.base_price?.toFixed(2)} Cr</span>
                                        </motion.div>
                                        <motion.div
                                            className="stat-card"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.7 }}
                                        >
                                            <span className="stat-label">Fantasy Pts</span>
                                            <span className="stat-value">{currentPlayer.prev_fantasy_points || 0}</span>
                                        </motion.div>
                                    </div>

                                    {/* Bidding Section */}
                                    <motion.div
                                        className="bidding-section"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.8 }}
                                    >
                                        <div className="bid-input-wrapper">
                                            <label>CURRENT BID</label>
                                            <div className="bid-amount-display">
                                                ₹<input
                                                    type="number"
                                                    value={bidAmount}
                                                    onChange={(e) => setBidAmount(e.target.value)}
                                                    min={currentPlayer.base_price}
                                                    step="0.1"
                                                    className="bid-input"
                                                /> Cr
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {selectedTeam && (
                                                <motion.div
                                                    className="winning-bid"
                                                    initial={{ scale: 0, rotate: -10 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    exit={{ scale: 0, rotate: 10 }}
                                                >
                                                    <div className="winning-badge">HIGHEST BID</div>
                                                    <div className="winning-team">{selectedTeam.team_name}</div>
                                                    <div className="winning-amount">₹{bidAmount} Cr</div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="action-row">
                                            <motion.button
                                                className="action-btn sold-btn"
                                                onClick={handleSold}
                                                disabled={loading || !selectedTeam}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <CheckCircleIcon />
                                                SOLD!
                                            </motion.button>
                                            <motion.button
                                                className="action-btn unsold-btn"
                                                onClick={handleUnsold}
                                                disabled={loading}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <CancelIcon />
                                                UNSOLD
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Teams Carousel */}
                <div className="teams-carousel-section">
                    <h2 className="carousel-title">🏆 TEAMS</h2>
                    <div className="teams-carousel">
                        {teams.map((team, index) => (
                            <motion.div
                                key={team.id}
                                className={`team-card-mini ${selectedTeam?.id === team.id ? 'selected' : ''}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <div className="team-mini-header">
                                    {team.team_image ? (
                                        <img src={team.team_image} alt={team.team_name} className="team-logo" />
                                    ) : (
                                        <div className="team-logo-placeholder">
                                            <SportsIcon />
                                        </div>
                                    )}
                                    <h3>{team.team_name}</h3>
                                </div>

                                <div className="team-budget-display">
                                    <span className="budget-label">PURSE</span>
                                    <span className="budget-amount">₹{team.team_purse?.toFixed(2)} Cr</span>
                                </div>

                                <div className="team-mini-stats">
                                    <div className="mini-stat">
                                        <GiCricketBat />
                                        <span>{team.batters || 0}</span>
                                    </div>
                                    <div className="mini-stat">
                                        <BiSolidCricketBall />
                                        <span>{team.bowler || 0}</span>
                                    </div>
                                    <div className="mini-stat">
                                        <GiWinterGloves />
                                        <span>{team.wicket_keepers || 0}</span>
                                    </div>
                                    <div className="mini-stat">
                                        <SportsCricketIcon />
                                        <span>{team.all_rounders || 0}</span>
                                    </div>
                                    <div className="mini-stat">
                                        <FlightIcon />
                                        <span>{team.overseas || 0}</span>
                                    </div>
                                </div>

                                {currentPlayer && (
                                    <motion.button
                                        className="bid-btn"
                                        onClick={() => handleBid(team)}
                                        disabled={loading || team.team_purse < parseFloat(bidAmount || 0)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        PLACE BID
                                    </motion.button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default BiddingRoom;