// In CreateAuctionModal.jsx
import React, { useState, useEffect } from 'react';
import "../../style/home.css"
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Avatar } from '@mui/material';
import axios from 'axios';

const CreateAuctionModal = ({ isOpen, onClose, onCreateAuction }) => {
  const [auctionName, setAuctionName] = useState('');
  const [auctionDate, setAuctionDate] = useState('');
  const [isIPLAuction, setIsIPLAuction] = useState(false);
  const [auctionImg, setAuctionImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAuctionName('');
      setAuctionImage(null);
      setError('');
    }
  }, [isOpen]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_UPLOAD_PRESET);
    formData.append("cloud_name", process.env.REACT_APP_CLOUD_NAME);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/image/upload`,
        formData
      );
      setAuctionImage(response.data.url);
    } catch (error) {
      console.error("Failed to upload image:", error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    let auction_date;
    
    if (regex.test(auctionDate)) {
      auction_date = new Date(auctionDate).toISOString()
    }
    setAuctionDate("")
    onCreateAuction({ auctionName, auctionImg, auction_date, isIPLAuction });
  };

  const handleUploadClick = () => {
    document.getElementById('file-upload').click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div 
            className="create-auction-modal"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button className="close-button" onClick={onClose}>
              <CloseIcon />
            </button>

            <h2>Create New Auction</h2>

            <div 
              className={`image-upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleUploadClick}
            >
              {loading ? (
                <div className="spinner" />
              ) : auctionImg ? (
                <div className="preview-container">
                  <Avatar 
                    src={auctionImg}
                    className="image-preview"
                  />
                  <button 
                    className="change-image"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('file-upload').click();
                    }}
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <CloudUploadIcon />
                  <p>Drag and drop an image or click to upload</p>
                  {error && <p className="error-message">{error}</p>}
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>

            <div className="input-group">
              <label htmlFor="auction-name">Auction Name</label>
              <input
                id="auction-name"
                type="text"
                value={auctionName}
                onChange={(e) => setAuctionName(e.target.value)}
                placeholder="Enter auction name"
                autoComplete='off'
              />
            </div>

            <div className="input-group">
              <label htmlFor="auction-date">Auction Date</label>
              <input
                id="auction-date"
                type="date"
                value={auctionDate}
                onChange={(e) => setAuctionDate(e.target.value)}
                placeholder="Enter auction date"
                autoComplete='off'
              />
            </div>

            <div className="input-group input-checkbox">
              <input
                id="is-auction-auction"
                type="checkbox"
                value={isIPLAuction}
                onChange={(e) => setIsIPLAuction(e.target.checked)}
                />
              <label htmlFor="is-auction-auction">IPL Auction</label>
            </div>

            {error && !loading && <p className="error-message">{error}</p>}

            <button 
              className="create-button"
              onClick={handleSubmit}
              disabled={!auctionName || !auctionImg || loading}
            >
              {loading ? 'Processing...' : 'Create Auction'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateAuctionModal;