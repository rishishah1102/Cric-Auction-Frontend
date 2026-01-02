import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "../style/auction.css";
import { motion, AnimatePresence } from "framer-motion";
import auctionContext from "../context/auctionContext";
import { instance } from "../utils/axios";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import axios from "axios";

// Icons
import GavelIcon from "@mui/icons-material/Gavel";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Avatar } from "@mui/material";
import parseExcel from "../utils/parse_excel";
import FileUpload from "../components/auction/FileUpload";

function AuctionPage() {
  const navigate = useNavigate();

  const { userData } = useContext(auctionContext);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isEditor, setIsEditor] = useState(false);
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
  const [uploadedPlayers, setUploadedPlayers] = useState([]);
  const [players, setPlayers] = useState(0);

  // Team modal states
  const [teamData, setTeamData] = useState({
    team_name: "",
    team_image: "",
    team_owners: [],
  });
  const [teamImageLoading, setTeamImageLoading] = useState(false);

  const [ownerSearch, setOwnerSearch] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);

  const location = useLocation();
  const { auctionId } = location.state || {};

  useEffect(() => {
    document.title = "Auction";
    document.body.classList.add("scroll-enabled");
    return () => {
      document.body.classList.remove("scroll-enabled");
    };
  }, []);

  const handleAuctionSelect = useCallback(
    async (auctionId) => {
      if (!auctionId) {
        setSelectedAuction(null);
        setIsEditor(false);
        setTeams([]);
        return;
      }

      try {
        setLoading(true);
        const response = await instance.post(
          "/auction/get",
          { auction_id: auctionId },
          { headers: { Authorization: localStorage.getItem("auction") } }
        );
        if (response.status === 200) {
          let selected = response.data.auction;
          setSelectedAuction(selected);

          setIsEditor(selected.created_by === userData?.email);
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
    [userData?.email]
  );

  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await instance.get("/auction/all", {
        headers: { Authorization: localStorage.getItem("auction") },
      });
      if (response.status === 200) {
        const respAuctions = response.data.auctions || [];
        setAuctions(respAuctions);
        if (auctionId) {
          await handleAuctionSelect(auctionId);
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please login again!");
      } else {
        toast.error("Failed to load auctions!");
      }
    } finally {
      setLoading(false);
    }
  }, [auctionId, handleAuctionSelect]);

  const fetchTeams = async (auctionId) => {
    try {
      const response = await instance.post(
        "/auction/team/all",
        { auction_id: auctionId },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );
      if (response.status === 200) {
        const fetchedTeams = response.data.teams || [];
        setTeams(fetchedTeams);
      }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        toast.error("Invalid Auction Id");
      } else if (error.response?.status === 401) {
        toast.error("Please login again!");
      } else {
        toast.error("Failed to fetch teams!");
      }
    }
  };

  const fetchPlayers = async (auctionId) => {
    try {
      const response = await instance.post(
        "/players/get",
        { auction_id: auctionId },
        { headers: { Authorization: localStorage.getItem("auction") } }
      );
      if (response.status === 200) {
        const fetchedPlayers = response.data.players || [];
        setPlayers(fetchedPlayers.length);
      }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        toast.error("Invalid Auction Id");
      } else if (error.response?.status === 401) {
        toast.error("Please login again!");
      } else {
        toast.error("Failed to fetch teams!");
      }
    }
  };

  useEffect(() => {
    if (selectedAuction) {
      fetchPlayers(selectedAuction.id);
    }
  }, [selectedAuction]);

  useEffect(() => {
    if (userData) {
      fetchAuctions();
    }
  }, [fetchAuctions, userData]);

  const copyAuctionId = () => {
    if (selectedAuction?.id) {
      navigator.clipboard.writeText(selectedAuction.id);
      toast.success("Auction ID copied to clipboard!");
    }
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
    if (!selectedAuction) return;

    setEditData({
      auction_name: selectedAuction.auction_name || "",
      auction_image: selectedAuction.auction_image || "",
      is_ipl_auction: selectedAuction.is_ipl_auction || false,
      auction_date: selectedAuction.auction_date
        ? selectedAuction.auction_date.split("T")[0]
        : "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedAuction) return;

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    try {
      setLoading(true);
      let imageUrl = editData.auction_image;
      let rfcTime;

      if (typeof editData.auction_image === "object") {
        imageUrl = await handleImageUpload(editData.auction_image);
      }

      if (regex.test(editData.auction_date)) {
        rfcTime = new Date(editData.auction_date).toISOString();
      } else {
        rfcTime = editData.auction_date;
      }

      const updateData = {
        id: selectedAuction.id,
        auction_name: editData.auction_name,
        auction_image: imageUrl,
        is_ipl_auction: editData.is_ipl_auction,
        auction_date: rfcTime,
      };

      // Handle players file upload if provided
      if (uploadedPlayers.length !== 0) {
        const res = await instance.post(
          `/players/save?isIPLAuction=${selectedAuction.is_ipl_auction}`,
          {"players": uploadedPlayers, "auction_id": selectedAuction.id},
          {
            headers: {
              Authorization: localStorage.getItem("auction"),
            },
          }
        );
        if (res.status === 200) {
          toast.success("Players added successfully!!");
          await fetchPlayers(selectedAuction.id);
        }
      }

      const response = await instance.patch("/auction/update", updateData, {
        headers: { Authorization: localStorage.getItem("auction") },
      });

      if (response.status === 200) {
        toast.success("Auction updated successfully!");
        const updatedAuction = { ...selectedAuction, ...updateData };
        setSelectedAuction(updatedAuction);
        setAuctions((prev) =>
          prev.map((a) => (a.id === selectedAuction.id ? updatedAuction : a))
        );
        setEditModalOpen(false);
        setUploadedPlayers(null);
      }
    } catch (error) {
      toast.error("Failed to update auction!");
    } finally {
      setLoading(false);
    }
  };

  const openTeamModal = (team = null) => {
    if (!selectedAuction) return;

    if (team) {
      setEditingTeam(team);
      setTeamData({
        team_name: team.team_name || "",
        team_image: team.team_image || "",
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
    setOwnerSearch("");
    setShowOwnerDropdown(false);
    setTeamModalOpen(true);
  };

  const handleTeamSubmit = async () => {
    if (!selectedAuction) return;

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
        const response = await instance.patch(
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
        const response = await instance.post("/auction/team", teamPayload, {
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
    if (!selectedAuction) return;

    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        setLoading(true);
        const response = await instance.delete("/auction/team", {
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

  const addOwnerToTeam = (email) => {
    if (!teamData.team_owners.includes(email)) {
      setTeamData((prev) => ({
        ...prev,
        team_owners: [...prev.team_owners, email],
      }));
    }
    setOwnerSearch("");
  };

  const removeOwnerFromTeam = (email) => {
    setTeamData((prev) => ({
      ...prev,
      team_owners: prev.team_owners.filter((owner) => owner !== email),
    }));
  };

  // Fixed filteredUsers calculation with proper null checks
  let filteredUsers = [];
  if (selectedAuction && selectedAuction.user_names) {
    filteredUsers = selectedAuction.user_names
      .filter((user) => {
        const emailMatch =
          user.email?.toLowerCase().includes(ownerSearch.toLowerCase()) ||
          false;
        const nameMatch =
          user.name?.toLowerCase().includes(ownerSearch.toLowerCase()) || false;
        return emailMatch || nameMatch;
      })
      .filter((user) => !teamData.team_owners.includes(user.email));
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  if (loading && auctions.length === 0) {
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

  const handleFileUpload = async (file) => {
    try {
      const jsonData = await parseExcel(file);
      console.log("JSON Data:", jsonData);
      setUploadedPlayers(jsonData);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
    }
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
                <>
                  <button className="edit-auction-button" onClick={() => {
                    navigate('/auction/live', { state: { auctionId: selectedAuction.id, auctionName: selectedAuction.auction_name } });
                  }}>
                    <PlayArrowIcon />
                  </button>
                  <button className="edit-auction-button" onClick={openEditModal}>
                    <BorderColorIcon />
                  </button>
                </>
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
                  <span className="info-value">{players}</span>
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
                                team.team_owners.map((owner, idx) => {
                                  const person =
                                    selectedAuction.user_names?.find(
                                      (user) => user.email === owner
                                    );
                                  return (
                                    <span key={idx} className="owner-tag">
                                      {person?.name || owner}
                                    </span>
                                  );
                                })
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
                        if (e.target.files?.[0]) {
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
                    <FileUpload onFileUpload={handleFileUpload} players={uploadedPlayers} />
                  </div>
                  <label>
                    Note: Make sure the excel sheet in this format.{" "}
                    <a
                      target="_blank"
                      href="https://docs.google.com/spreadsheets/d/1meJNbCnBgrs8cpQbqm4LhShY60fY16RlWcaBVc7gqa0/edit?usp=drivesdk"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </label>
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
                        if (e.target.files?.[0]) {
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
                  <label>Team Owners</label>

                  {/* Selected owners display */}
                  {teamData.team_owners.length > 0 && (
                    <div className="selected-owners-container">
                      {teamData.team_owners.map((owner, index) => {
                        const person = selectedAuction?.user_names?.find(
                          (user) => user.email === owner
                        );
                        return (
                          <div key={index} className="selected-owner-tag">
                            <span>{person?.name || owner}</span>
                            <button
                              type="button"
                              onClick={() => removeOwnerFromTeam(owner)}
                              className="remove-owner-button"
                            >
                              <CloseIcon />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Search input */}
                  <div className="owner-search-container">
                    <input
                      type="text"
                      value={ownerSearch}
                      onChange={(e) => {
                        setOwnerSearch(e.target.value);
                      }}
                      onFocus={() => setShowOwnerDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowOwnerDropdown(false);
                        }, 300);
                      }}
                      placeholder="Search and add owners by email or name"
                      className="owner-search-input"
                    />

                    {/* Dropdown */}
                    {showOwnerDropdown && (
                      <div className="owner-dropdown">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user, index) => (
                            <div
                              key={index}
                              className="owner-option"
                              onClick={() => addOwnerToTeam(user.email)}
                            >
                              <div className="owner-option-content">
                                <span className="owner-email">
                                  {user.email}
                                </span>
                                {user.name && (
                                  <span className="owner-name">
                                    {user.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-users-found">
                            No users found matching "{ownerSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
