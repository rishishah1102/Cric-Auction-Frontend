import React, { useEffect, useState, useContext, useCallback } from "react";
import "../style/auction.css";
import { motion, AnimatePresence } from "framer-motion";
import auctionContext from "../context/auctionContext";
import { auctionAPI } from "../utils/axios";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import axios from "axios";

// Icons
import GavelIcon from "@mui/icons-material/Gavel";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Avatar } from "@mui/material";

function AuctionPage() {
  const { userData } = useContext(auctionContext);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [originalAuction, setOriginalAuction] = useState(null);
  const [originalTeams, setOriginalTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // Edit modal states
  const [editData, setEditData] = useState({
    auction_name: "",
    auction_image: "",
    is_ipl_auction: false,
    auction_date: "",
  });
  const [imageLoading, setImageLoading] = useState(false);
  const [playersFile, setPlayersFile] = useState(null);

  // Team modal states
  const [teamData, setTeamData] = useState({
    team_name: "",
    team_image: "",
    team_owners: [],
  });
  const [teamImageLoading, setTeamImageLoading] = useState(false);

  const location = useLocation();
  const { auctionId } = location.state || {};

  useEffect(() => {
    document.title = "Auction";
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
        const respAuctions = response.data.auctions || [];

        setAuctions(respAuctions);

        if (auctionId) {
          const selected = respAuctions.find(
            (auction) => auction.id === auctionId
          );
          if (selected) {
            setSelectedAuction(selected);
            setOriginalAuction({ ...selected });
            setIsEditor(selected.created_by === userData.email);
            await fetchTeams(selected.id);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load auctions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [auctionId, userData?.email]);

  const fetchTeams = async (auctionId) => {
    try {
      const response = await auctionAPI.post(
        "/auction/team/all",
        { auction_id: auctionId },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );
      if (response.status === 200) {
        const fetchedTeams = response.data.teams || [];
        setTeams(fetchedTeams);
        setOriginalTeams([...fetchedTeams]);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchAuctions();
    }
  }, [fetchAuctions, userData]);

  const handleAuctionSelect = async (auctionId) => {
    const selected = auctions.find((auction) => auction.id === auctionId);

    setSelectedAuction(selected);
    setOriginalAuction({ ...selected });
    setIsEditor(selected.created_by === userData.email);
    setIsEditing(false);
    await fetchTeams(selected.id);
  };

  const copyAuctionId = () => {
    navigator.clipboard.writeText(selectedAuction.id);
    toast.success("Auction ID copied to clipboard!");
  };

  const handleImageUpload = async (file) => {
    if (!file) return "";

    setImageLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_UPLOAD_PRESET);
    formData.append("cloud_name", process.env.REACT_APP_CLOUD_NAME);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      toast.error("Failed to upload image!");
      return "";
    } finally {
      setImageLoading(false);
    }
  };

  const handleTeamImageUpload = async (file) => {
    if (!file) return "";

    setTeamImageLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_UPLOAD_PRESET);
    formData.append("cloud_name", process.env.REACT_APP_CLOUD_NAME);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      toast.error("Failed to upload team image!");
      return "";
    } finally {
      setTeamImageLoading(false);
    }
  };

  const openEditModal = () => {
    setEditData({
      auction_name: selectedAuction.auction_name,
      auction_image: selectedAuction.auction_image,
      is_ipl_auction: selectedAuction.is_ipl_auction || false,
      auction_date: selectedAuction.auction_date
        ? selectedAuction.auction_date.split("T")[0]
        : "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    try {
      setLoading(true);
      let imageUrl = editData.auction_image;
      let rfcTime;

      if (typeof editData.auction_image === "object") {
        imageUrl = await handleImageUpload(editData.auction_image);
      }

      if (regex.test(editData.auction_date)) {
        rfcTime = new Date(editData.auction_date).toISOString()
      } else {
        rfcTime = editData.auction_date
      }
      
      const updateData = {
        "id": selectedAuction.id,
        "auction_name": editData.auction_name,
        "auction_image": imageUrl,
        "is_ipl_auction": editData.is_ipl_auction,
        "auction_date": rfcTime,
      };

      // Handle players file upload if provided
      if (playersFile) {
        const formData = new FormData();
        formData.append("players_file", playersFile);
        formData.append("auction_id", selectedAuction.id);

        // Upload players file (this would need to be implemented in your backend)
        // await auctionAPI.post("/auction/players", formData, {
        //   headers: {
        //     Authorization: localStorage.getItem("auction"),
        //     "Content-Type": "multipart/form-data"
        //   },
        // });
      }
      
      const response = await auctionAPI.patch("/auction", updateData, {
        headers: { Authorization: localStorage.getItem("auction") },
      });

      if (response.status === 200) {
        toast.success("Auction updated successfully!");
        const updatedAuction = { ...selectedAuction, ...updateData };
        setSelectedAuction(updatedAuction);
        setOriginalAuction({ ...updatedAuction });
        setAuctions((prev) =>
          prev.map((a) => (a.id === selectedAuction.id ? updatedAuction : a))
        );
        setEditModalOpen(false);
        setPlayersFile(null);
      }
    } catch (error) {
      console.log(error);

      toast.error("Failed to update auction!");
    } finally {
      setLoading(false);
    }
  };

  const openTeamModal = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setTeamData({
        team_name: team.team_name,
        team_image: team.team_image,
        team_owners: team.team_owners || [],
      });
    } else {
      setEditingTeam(null);
      setTeamData({
        team_name: "",
        team_image: "",
        team_owners: [],
      });
    }
    setTeamModalOpen(true);
  };

  const handleTeamSubmit = async () => {
    try {
      setLoading(true);
      let imageUrl = teamData.team_image;

      if (typeof teamData.team_image === "object") {
        imageUrl = await handleTeamImageUpload(teamData.team_image);
      }

      const teamPayload = {
        team_name: teamData.team_name,
        team_image: imageUrl,
        auction_id: selectedAuction.id,
        team_owners: teamData.team_owners,
      };

      if (editingTeam) {
        // Update existing team
        const response = await auctionAPI.patch(
          "/auction/team",
          {
            id: editingTeam.id,
            ...teamPayload,
          },
          {
            headers: { Authorization: localStorage.getItem("auction") },
          }
        );

        if (response.status === 200) {
          toast.success("Team updated successfully!");
          await fetchTeams(selectedAuction.id);
        }
      } else {
        // Create new team
        console.log(teamPayload);
        
        const response = await auctionAPI.post("/auction/team", teamPayload, {
          headers: { Authorization: localStorage.getItem("auction") },
        });

        if (response.status === 201) {
          toast.success("Team created successfully!");
          await fetchTeams(selectedAuction.id);
        }
      }

      setTeamModalOpen(false);
    } catch (error) {
      toast.error(
        editingTeam ? "Failed to update team!" : "Failed to create team!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        setLoading(true);
        const response = await auctionAPI.delete("/auction/team", {
          data: { team_id: teamId, auction_id: selectedAuction.id },
          headers: { Authorization: localStorage.getItem("auction") },
        });

        if (response.status === 200) {
          toast.success("Team deleted successfully!");
          await fetchTeams(selectedAuction.id);
        }
      } catch (error) {
        toast.error("Failed to delete team!");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="auction-container">
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="auction-container"
    >
      {/* Auction Selection */}
      <div className="auction-selection-section">
        <div className="auction-dropdown-wrapper">
          <select
            value={selectedAuction?.id || ""}
            onChange={(e) => handleAuctionSelect(e.target.value)}
            className="auction-dropdown"
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

      {auctions.length === 0 ? (
        <div className="empty-state">
          <GavelIcon className="empty-icon" />
          <h3>No Auctions Found</h3>
          <p>You haven't created or joined any auctions yet.</p>
        </div>
      ) : selectedAuction ? (
        <div className="auction-details-container">
          {/* Auction Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="auction-details-card"
          >
            <div className="auction-header">
              <div className="auction-title-section">
                <Avatar
                  src={selectedAuction.auction_image}
                  className="auction-main-avatar"
                />
                <div className="auction-title-info">
                  <h2>{selectedAuction.auction_name}</h2>
                  <div className="auction-id-section">
                    <span className="auction-id-label">ID:</span>
                    <code className="auction-id">{selectedAuction.id}</code>
                    <button
                      className="copy-button"
                      onClick={copyAuctionId}
                      title="Copy Auction ID"
                    >
                      <ContentCopyIcon />
                    </button>
                  </div>
                </div>
              </div>

              {isEditor && (
                <button className="edit-auction-button" onClick={openEditModal}>
                  <BorderColorIcon />
                  Edit Auction
                </button>
              )}
            </div>

            <div className="auction-info-grid">
              <div className="info-item">
                <div className="info-icon">
                  <GavelIcon />
                </div>
                <div className="info-content">
                  <span className="info-label">Auction Type</span>
                  <span className="info-value">
                    {selectedAuction.is_ipl_auction
                      ? "IPL Auction"
                      : "Custom Auction"}
                  </span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <CalendarMonthIcon />
                </div>
                <div className="info-content">
                  <span className="info-label">Auction Date</span>
                  <span className="info-value">
                    {formatDate(selectedAuction.auction_date)}
                  </span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <GroupsIcon />
                </div>
                <div className="info-content">
                  <span className="info-label">Total Teams</span>
                  <span className="info-value">{teams.length}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <PersonIcon />
                </div>
                <div className="info-content">
                  <span className="info-label">Total Players</span>
                  <span className="info-value">0</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Teams Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="teams-section"
          >
            <div className="teams-header">
              <h3>Teams</h3>
              {isEditor && (
                <button
                  className="add-team-button"
                  onClick={() => openTeamModal()}
                >
                  <AddIcon />
                  Add Team
                </button>
              )}
            </div>

            {teams.length === 0 ? (
              <div className="no-teams-state">
                <GroupsIcon className="no-teams-icon" />
                <p>No teams created yet</p>
                {isEditor && (
                  <button
                    className="create-first-team-button"
                    onClick={() => openTeamModal()}
                  >
                    Create First Team
                  </button>
                )}
              </div>
            ) : (
              <div className="teams-grid">
                <AnimatePresence>
                  {teams.map((team, index) => (
                    <motion.div
                      key={team.id}
                      className="team-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="team-card-content">
                        <Avatar src={team.team_image} className="team-avatar" />
                        <div className="team-info">
                          <h4 className="team-name">{team.team_name}</h4>
                          <div className="team-owners">
                            <span className="owners-label">Owners:</span>
                            <div className="owners-list">
                              {team.team_owners &&
                              team.team_owners.length > 0 ? (
                                team.team_owners.map((owner, idx) => (
                                  <span key={idx} className="owner-tag">
                                    {owner}
                                  </span>
                                ))
                              ) : (
                                <span className="no-owners">
                                  No owners assigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isEditor && (
                          <div className="team-actions">
                            <button
                              className="team-edit-button"
                              onClick={() => openTeamModal(team)}
                              title="Edit team"
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="team-delete-button"
                              onClick={() => handleDeleteTeam(team.id)}
                              title="Delete team"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        )}
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
          <p>Choose an auction from the dropdown to view its details.</p>
        </div>
      )}

      {/* Edit Auction Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              className="edit-auction-modal"
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

              <h2>Edit Auction</h2>

              <div className="edit-form">
                <div className="form-group">
                  <label>Auction Image</label>
                  <div className="image-upload-section">
                    {imageLoading ? (
                      <div className="image-loading">
                        <div className="spinner" />
                      </div>
                    ) : editData.auction_image ? (
                      <div className="image-preview-container">
                        <Avatar
                          src={
                            typeof editData.auction_image === "string"
                              ? editData.auction_image
                              : URL.createObjectURL(editData.auction_image)
                          }
                          className="edit-image-preview"
                        />
                        <button
                          className="change-image-button"
                          onClick={() =>
                            document.getElementById("edit-image-upload").click()
                          }
                        >
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <div
                        className="image-upload-placeholder"
                        onClick={() =>
                          document.getElementById("edit-image-upload").click()
                        }
                      >
                        <CloudUploadIcon />
                        <p>Click to upload auction image</p>
                      </div>
                    )}
                    <input
                      id="edit-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setEditData((prev) => ({
                            ...prev,
                            auction_image: e.target.files[0],
                          }));
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Auction Name</label>
                  <input
                    type="text"
                    value={editData.auction_name}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        auction_name: e.target.value,
                      }))
                    }
                    placeholder="Enter auction name"
                  />
                </div>

                <div className="form-group">
                  <label>Auction Date</label>
                  <input
                    type="date"
                    value={editData.auction_date}
                    onChange={(e) => {
                      setEditData((prev) => ({
                        ...prev,
                        auction_date: e.target.value,
                      }));
                    }}
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editData.is_ipl_auction}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          is_ipl_auction: e.target.checked,
                        }))
                      }
                    />
                    <span className="checkbox-text">IPL Auction</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Players File (XLSX)</label>
                  <div className="file-upload-section">
                    <input
                      id="players-file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setPlayersFile(e.target.files[0])}
                      style={{ display: "none" }}
                    />
                    <button
                      className="file-upload-button"
                      onClick={() =>
                        document.getElementById("players-file-upload").click()
                      }
                    >
                      <UploadFileIcon />
                      {playersFile ? playersFile.name : "Upload Players File"}
                    </button>
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
                    disabled={!editData.auction_name || imageLoading}
                  >
                    {imageLoading ? "Uploading..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Modal */}
      <AnimatePresence>
        {teamModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setTeamModalOpen(false)}
          >
            <motion.div
              className="team-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <button
                className="modal-close-button"
                onClick={() => setTeamModalOpen(false)}
              >
                <CloseIcon />
              </button>

              <h2>{editingTeam ? "Edit Team" : "Add New Team"}</h2>

              <div className="team-form">
                <div className="form-group">
                  <label>Team Image</label>
                  <div className="image-upload-section">
                    {teamImageLoading ? (
                      <div className="image-loading">
                        <div className="spinner" />
                      </div>
                    ) : teamData.team_image ? (
                      <div className="image-preview-container">
                        <Avatar
                          src={
                            typeof teamData.team_image === "string"
                              ? teamData.team_image
                              : URL.createObjectURL(teamData.team_image)
                          }
                          className="edit-image-preview"
                        />
                        <button
                          className="change-image-button"
                          onClick={() =>
                            document.getElementById("team-image-upload").click()
                          }
                        >
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <div
                        className="image-upload-placeholder"
                        onClick={() =>
                          document.getElementById("team-image-upload").click()
                        }
                      >
                        <CloudUploadIcon />
                        <p>Click to upload team image</p>
                      </div>
                    )}
                    <input
                      id="team-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setTeamData((prev) => ({
                            ...prev,
                            team_image: e.target.files[0],
                          }));
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Team Name</label>
                  <input
                    type="text"
                    value={teamData.team_name}
                    onChange={(e) =>
                      setTeamData((prev) => ({
                        ...prev,
                        team_name: e.target.value,
                      }))
                    }
                    placeholder="Enter team name"
                  />
                </div>

                <div className="form-group">
                  <label>Team Owners (comma separated emails)</label>
                  <input
                    type="text"
                    value={teamData.team_owners.join(", ")}
                    onChange={(e) => {
                      const owners = e.target.value
                        .split(",")
                        .map((email) => email.trim())
                        .filter((email) => email);
                      setTeamData((prev) => ({ ...prev, team_owners: owners }));
                    }}
                    placeholder="Enter owner emails separated by commas"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    className="cancel-button"
                    onClick={() => setTeamModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="save-button"
                    onClick={handleTeamSubmit}
                    disabled={!teamData.team_name || teamImageLoading}
                  >
                    {teamImageLoading
                      ? "Uploading..."
                      : editingTeam
                      ? "Update Team"
                      : "Create Team"}
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

export default AuctionPage;
