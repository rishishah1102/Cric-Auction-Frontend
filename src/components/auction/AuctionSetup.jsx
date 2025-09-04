import React, { useState, useEffect } from 'react';
import parseExcel from "../../utils/parseExcel";
import { Gavel } from '@mui/icons-material';
import ImageInput from '../ImageInput';
import { ContentCopy, ContentPaste } from '@mui/icons-material';

function AuctionSetup({ auction, auctionTeams, isEditing, onAuctionChange, onTeamsCountChange }) {
    const [totalTeams, setTotalTeams] = useState(auctionTeams.length);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setTotalTeams(auctionTeams.length);
    }, [auctionTeams.length]);

    const handleTeamsCountChange = (e) => {
        const newTeamCount = parseInt(e.target.value);
        setTotalTeams(newTeamCount);
        onTeamsCountChange(newTeamCount);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const jsonData = await parseExcel(file);
            console.log("Parsed JSON Data:", jsonData);
        } catch (error) {
            console.error("Error parsing Excel file:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleAuctionChange = (field, value) => {
        onAuctionChange({ ...auction, [field]: value });
    };

    const copyAuctionIdToClipboard = () => {
        navigator.clipboard.writeText(auction._id)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 5000);
            })
            .catch((err) => console.error('Failed to copy Auction ID: ', err));
    };

    return (
        <div className="auctionArea">
            <div className="auctionHeader">
                <span className="areaName">Auction Setup</span>
            </div>
            <div className="areaBody">
                <div className="auctionImageSection">
                    <ImageInput
                        initialImage={auction.auction_image}
                        onImageUpload={(url) => handleAuctionChange('auctionImg', url)}
                        isEditing={isEditing}
                        imgId="auction-main"
                    />
                </div>
                <div className="auctionDetailsSection">
                    <div className="detailRow">
                        <span className="label">Auction Name:</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={auction.auction_name}
                                onChange={(e) => handleAuctionChange('auctionName', e.target.value)}
                                className="detailInput"
                                placeholder="Enter auction name"
                            />
                        ) : (
                            <span className="value">{auction.auction_name}</span>
                        )}
                    </div>
                    <div className="detailRow auction-id-row">
                        <span className="label">Auction ID:</span>
                        <span className="value">
                            {auction._id}
                        </span>
                        {copied ? (
                            <ContentPaste className="copy-icon" />
                        ) : (
                            <ContentCopy
                                className="copy-icon"
                                onClick={copyAuctionIdToClipboard}
                            />
                        )}
                    </div>
                    <div className="detailRow">
                        <span className="label">Total Players:</span>
                        <span className="value">{auction.players?.length || 0}</span>
                    </div>
                    <div className="detailRow">
                        <span className="label">Total Teams:</span>
                        {isEditing ? (
                            <input
                                type="number"
                                value={totalTeams}
                                onChange={handleTeamsCountChange}
                                min="1"
                                max="10"
                                className="detailInput numberInput"
                            />
                        ) : (
                            <span className="value">{totalTeams}</span>
                        )}
                    </div>
                    <div className="detailRow">
                        <span className="label">Points Table:</span>
                        {isEditing ? (
                            <input
                                type="checkbox"
                                checked={auction?.is_ipl_auction}
                                onChange={(e) => handleAuctionChange('pointsTableChecked', e.target.checked)}
                                className="detailInput checkBoxInput"
                            />
                        ) : (
                            <span className="value">{auction?.is_ipl_auction ? 'Yes' : 'No'}</span>
                        )}
                    </div>
                    {isEditing && (
                        <div className="detailRow">
                            <span className="label">Upload Players:</span>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".xls,.xlsx"
                                disabled={uploading}
                                className="detailInput"
                            />
                            {uploading && <Gavel className="hammer-loader" />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuctionSetup;