import React from 'react';
import "../../style/home.css";
import { useNavigate } from 'react-router-dom';
import { Avatar } from "@mui/material";
import EastIcon from '@mui/icons-material/East';
import { motion } from "framer-motion";

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return null;
    }
};

const AuctionCard = ({ auction }) => {
    const navigate = useNavigate();
    const formattedDate = formatDate(auction.auction_date);

    return (
        <motion.div
            className="auction-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(`/auction/${auction.id}`)}
        >
            <div className="auction-card-content">
                <Avatar src={auction.auction_image} className="auction-avatar" />
                <div className="auction-card-info">
                    <div className="auction-name">{auction.auction_name}</div>
                    <div className="auction-card-meta">
                        {formattedDate && (
                            <span className="auction-card-date">{formattedDate}</span>
                        )}
                        {auction.is_ipl_auction && (
                            <span className="ipl-badge">IPL</span>
                        )}
                    </div>
                    {(auction.teams_count !== undefined || auction.joined_count !== undefined) && (
                        <div className="auction-card-stats">
                            {auction.teams_count !== undefined && (
                                <span>Teams: {auction.teams_count}</span>
                            )}
                            {auction.joined_count !== undefined && (
                                <span>Joined: {auction.joined_count}</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="arrow-icon">
                    <EastIcon />
                </div>
            </div>
        </motion.div>
    );
};

export default AuctionCard;