import React, { useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import AddIcon from "@mui/icons-material/Add";
import GavelIcon from "@mui/icons-material/Gavel";
import auctionContext from "../context/auctionContext";
import { auctionAPI } from "../utils/axios";
import { toast } from "react-toastify";
import TabButton from "../components/home/HomeBtn";
import AuctionCard from "../components/home/HomeAuctionCard";
import JoinAuctionModal from "../components/home/JoinAuctionModal";
import CreateAuctionModal from "../components/home/CreateAuctionModal";

function Home() {
  const [activeTab, setActiveTab] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [auctions, setAuctions] = useState([]);
  const [filteredAuctions, setFilteredAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userAuctions } = useContext(auctionContext);

  useEffect(() => {
    document.title = "Home";
    document.body.classList.add("scroll-enabled");
    
    if (userAuctions.length > 0) {
      setAuctions(userAuctions)
      setFilteredAuctions(userAuctions)
      setLoading(false)
    } else{
      fetchAllAuctions();
    }

    return () => document.body.classList.remove("scroll-enabled");
  }, [userAuctions]);

  // Fetch all auctions
  const fetchAllAuctions = async () => {
    try {
      setLoading(true);
      const res = await auctionAPI.get("/auction/all", {
        headers: { Authorization: localStorage.getItem("auction") },
      });
      
      if (res.status === 200) {
        const allAuctions = res.data.auctions || [];
        setAuctions(allAuctions);
        setFilteredAuctions(allAuctions);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Unauthorized, Please login again!");
      } else {
        toast.error("Failed to fetch auctions!");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle closing filter dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterOpen &&
        !event.target.closest(".filter-dropdown") &&
        !event.target.closest(".filter-button")
      ) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterOpen]);

  const handleTabClick = async (tab) => {
    setActiveTab(tab);
    setFilterOpen(false);

    try {
      setLoading(true);
      let endpoint = "/auction/all";
      
      if (tab === "created") {
        endpoint = "/auction/all?type=create";
      } else if (tab === "joined") {
        endpoint = "/auction/all?type=join";
      }

      const res = await auctionAPI.get(endpoint, {
        headers: { Authorization: localStorage.getItem("auction") },
      });
      
      if (res.status === 200) {
        const filtered = res.data.auctions || [];
        setFilteredAuctions(filtered);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Unauthorized, Please login again!");
      } else {
        toast.error("Failed to fetch auctions!");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAuctionCards = filteredAuctions.filter((card) =>
    card?.auction_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleJoinAuction = async (auctionId) => {
    try {
      setLoading(true);
      const reqData = {
        auction_id: auctionId,
      };

      const res = await auctionAPI.post("/auction/join", reqData, {
        headers: { Authorization: localStorage.getItem("auction") },
      });

      if (res.status === 200) {
        // Refresh the specific tab data instead of all auctions
        await handleTabClick(activeTab);
        toast.success("Auction joined successfully!");
      }
    } catch (error) {
      if (error.response?.status === 400) {
        if (error.response.data.error === "Invalid auction id") {
          toast.error("Invalid auction ID format");
        } else {
          toast.error(error.response.data.error);
        }
      } else if (error.response?.status === 401) {
        toast.error("Unauthorized, Please login again!");
      } else if (error.response?.status === 404) {
        toast.error("Auction not found");
      } else {
        toast.error("Failed to join auction");
      }
    } finally {
      setLoading(false);
      setJoinModalOpen(false);
    }
  };

  const handleCreateAuction = async (auctionData) => {
    try {
      let auctionObj = {
        "auction_name": auctionData.auctionName,
        "auction_image": auctionData.auctionImg,
        "auction_date": auctionData.auction_date,
        "is_ipl_auction": auctionData.isIPLAuction,
      }

      setLoading(true);
      const res = await auctionAPI.post("/auction/create", auctionObj, {
        headers: { Authorization: localStorage.getItem("auction") },
      });

      if (res.status === 201) {
        // Refresh the specific tab data instead of all auctions
        await handleTabClick(activeTab);
        toast.success("Auction created successfully!");
      }
    } catch (error) {
      toast.error("Failed to create auction");
    } finally {
      setLoading(false);
      setCreateModalOpen(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
    exit: { opacity: 0 },
  };

  const filterDropdownVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="home-container"
    >
      <div className="home-section">
        {/* Desktop Navigation */}
        <div className="desktop-nav">
          <div className="tab-buttons">
            <TabButton
              label="All Auctions"
              isActive={activeTab === "all"}
              onClick={() => handleTabClick("all")}
            />
            <div className="horizontalBar">|</div>
            <TabButton
              label="Created Auctions"
              isActive={activeTab === "created"}
              onClick={() => handleTabClick("created")}
            />
            <div className="horizontalBar">|</div>
            <TabButton
              label="Joined Auctions"
              isActive={activeTab === "joined"}
              onClick={() => handleTabClick("joined")}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="mobile-nav">
          <div className="active-tab-indicator">
            {activeTab === "all"
              ? "All Auctions"
              : activeTab === "created"
              ? "Created Auctions"
              : "Joined Auctions"}
          </div>
          <button
            className="filter-button"
            onClick={() => setFilterOpen(!filterOpen)}
            aria-label="Filter options"
          >
            <TuneIcon />
          </button>
        </div>

        {/* Filter Dropdown for Mobile */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              className="filter-dropdown"
              variants={filterDropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TabButton
                label="All Auctions"
                isActive={activeTab === "all"}
                onClick={() => handleTabClick("all")}
              />
              <TabButton
                label="Created Auctions"
                isActive={activeTab === "created"}
                onClick={() => handleTabClick("created")}
              />
              <TabButton
                label="Joined Auctions"
                isActive={activeTab === "joined"}
                onClick={() => handleTabClick("joined")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search auctions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search auctions"
            />
          </div>
        </div>

        {/* Auction Grid */}
        <div className="auctions-grid">
          {loading ? (
            <div className="loading-state">
              <div className="hammer-container">
                <GavelIcon className="hammer-icon" />
                <div className="impact" />
              </div>
              <p>Loading auctions...</p>
            </div>
          ) : filteredAuctionCards.length > 0 ? (
            <AnimatePresence>
              {filteredAuctionCards.map((auction, idx) => (
                <AuctionCard key={idx} auction={auction} />
              ))}
            </AnimatePresence>
          ) : (
            <div className="no-auctions">
              <p>No auctions available</p>
              {activeTab !== "all" && (
                <button
                  className="create-auction-btn"
                  onClick={() =>
                    activeTab === "created"
                      ? setCreateModalOpen(true)
                      : setJoinModalOpen(true)
                  }
                >
                  {activeTab === "created" ? "Create Auction" : "Join Auction"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        {(activeTab === "created" || activeTab === "joined") &&
          filteredAuctionCards.length > 0 && (
            <motion.button
              className="fab"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                activeTab === "created"
                  ? setCreateModalOpen(true)
                  : setJoinModalOpen(true)
              }
              aria-label={
                activeTab === "created" ? "Create auction" : "Join auction"
              }
            >
              <AddIcon />
            </motion.button>
          )}

        {/* Modals */}
        <CreateAuctionModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreateAuction={handleCreateAuction}
        />

        <JoinAuctionModal
          isOpen={joinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          onJoinAuction={handleJoinAuction}
        />
      </div>
    </motion.div>
  );
}

export default Home;
