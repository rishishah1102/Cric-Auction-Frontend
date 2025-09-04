import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import "../../style/home.css"

const JoinAuctionModal = ({ isOpen, onClose, onJoinAuction }) => {
  const [auctionId, setAuctionId] = useState("");

  const handleSubmit = () => {
    onJoinAuction(auctionId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div 
            className="join-auction-modal"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button className="close-button" onClick={onClose}>
              <CloseIcon />
            </button>

            <h2>Join Auction</h2>

            <div className="input-group">
              <label htmlFor="auction-id">Auction ID</label>
              <input
                id="auction-id"
                type="text"
                value={auctionId}
                onChange={(e) => setAuctionId(e.target.value)}
                placeholder="Enter auction ID"
                autoComplete='off'
              />
            </div>

            <button 
              className="join-button"
              onClick={handleSubmit}
              disabled={!auctionId}
            >
              Join Auction
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JoinAuctionModal;