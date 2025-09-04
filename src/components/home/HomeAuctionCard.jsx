import React from 'react';
import "../../style/home.css";
import { useNavigate } from 'react-router-dom';
import { Avatar } from "@mui/material";
import EastIcon from '@mui/icons-material/East';
import { motion } from "framer-motion";

const AuctionCard = ({ auction }) => {
    const navigate = useNavigate();
    let state = {
        auctionId: auction.id,
    }

    return (
        <motion.div
            className="auction-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate("/auction", {state: state})}
        >
            <div className="auction-card-content">
                <Avatar src={auction.auction_image} className="auction-avatar" />
                <div className="auction-name">{auction.auction_name}</div>
                <div className="arrow-icon">
                    <EastIcon />
                </div>
            </div>
        </motion.div>
    );
};

export default AuctionCard;