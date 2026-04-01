import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../../style/bottomnav.css";

// Icons
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import PeopleIcon from "@mui/icons-material/People";
import ScoreboardIcon from "@mui/icons-material/Scoreboard";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";

const lobbyTabs = [
  { path: "/", label: "Home", icon: HomeIcon, key: "home" },
  { path: "/profile", label: "Profile", icon: PersonIcon, key: "profile" },
];

const workspaceTabs = [
  { path: "", label: "Overview", icon: DashboardIcon, key: "overview" },
  { path: "players", label: "Players", icon: SportsCricketIcon, key: "players" },
  { path: "squads", label: "Squads", icon: PeopleIcon, key: "squads" },
  { path: "points", label: "Points", icon: ScoreboardIcon, key: "points" },
  { path: "live", label: "Live", icon: PlayArrowIcon, key: "live" },
];

// ── Particle system ──
function useParticles() {
  const [particles, setParticles] = useState([]);
  const idRef = useRef(0);

  const emit = useCallback((x, y) => {
    const count = 3;
    const newParticles = Array.from({ length: count }, () => {
      idRef.current += 1;
      return {
        id: idRef.current,
        x,
        y,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60 - 20,
        size: Math.random() * 5 + 3,
        life: 1,
        color: ["#3b82f6", "#60a5fa", "#93c5fd", "#f59e0b", "#fbbf24"][Math.floor(Math.random() * 5)],
      };
    });
    setParticles(prev => [...prev.slice(-30), ...newParticles]); // cap at ~30
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    const raf = requestAnimationFrame(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx * 0.06,
            y: p.y + p.vy * 0.06,
            vy: p.vy + 30 * 0.06, // gravity
            life: p.life - 0.04,
            size: p.size * 0.97,
          }))
          .filter(p => p.life > 0)
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [particles]);

  return { particles, emit };
}

function BottomNav({ mode = "lobby" }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { particles, emit } = useParticles();

  const isWorkspace = mode === "workspace" || mode === "live";
  const tabs = isWorkspace ? workspaceTabs : lobbyTabs;
  const auctionId = params.auctionId;
  const basePath = isWorkspace ? `/auction/${auctionId}` : "";

  // ── Draggable FAB state ──
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0 });
  const emitThrottle = useRef(0);
  const [fabPos, setFabPos] = useState(() => {
    const saved = sessionStorage.getItem("fabPos");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { x: (window.innerWidth - 56) / 2, y: window.innerHeight - 80 };
  });

  // Persist position
  useEffect(() => {
    sessionStorage.setItem("fabPos", JSON.stringify(fabPos));
  }, [fabPos]);

  // Keep in bounds on resize
  useEffect(() => {
    const handleResize = () => {
      setFabPos(prev => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Drag handlers ──
  const onPointerDown = useCallback((e) => {
    dragState.current = { isDragging: false, startX: e.clientX, startY: e.clientY };

    const onMove = (ev) => {
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      if (!dragState.current.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragState.current.isDragging = true;
      }
      if (dragState.current.isDragging) {
        setFabPos(prev => {
          const fabSize = mode === "live" ? 44 : 56;
          return {
            x: Math.max(0, Math.min(window.innerWidth - fabSize, prev.x + dx)),
            y: Math.max(0, Math.min(window.innerHeight - fabSize, prev.y + dy)),
          };
        });
        dragState.current.startX = ev.clientX;
        dragState.current.startY = ev.clientY;

        // Emit particles while dragging (throttled)
        const now = Date.now();
        if (now - emitThrottle.current > 50) {
          emit(ev.clientX, ev.clientY);
          emitThrottle.current = now;
        }
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      // NO snap-to-edge — stays wherever user drops it
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [mode, emit]);

  const handleFabClick = () => {
    if (!dragState.current.isDragging) {
      setIsOpen(!isOpen);
    }
    dragState.current.isDragging = false;
  };

  // Close menu on route change
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const getFullPath = (tab) => {
    if (!isWorkspace) return tab.path;
    return tab.path ? `${basePath}/${tab.path}` : basePath;
  };

  const isActive = (tab) => {
    const fullPath = getFullPath(tab);
    if (tab.path === "/" || (tab.path === "" && isWorkspace)) {
      return location.pathname === fullPath || location.pathname === fullPath + "/";
    }
    return location.pathname.startsWith(fullPath) && fullPath !== "/";
  };

  const handleNav = (tab) => {
    navigate(getFullPath(tab));
    setIsOpen(false);
  };

  // Idle floating animation — smooth y bob + glow pulse via CSS
  const idleFloat = {
    y: [0, -6, 0],
  };

  // Menu direction based on FAB position
  const fabSize = mode === "live" ? 44 : 56;
  const fabCenterX = fabPos.x + fabSize / 2;
  const fabCenterY = fabPos.y + fabSize / 2;
  const isOnRight = fabCenterX > window.innerWidth / 2;
  const isOnBottom = fabCenterY > window.innerHeight / 2;

  return (
    <>
      {/* Drag particles */}
      {particles.length > 0 && (
        <svg className="fab-particles" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99 }}>
          {particles.map(p => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={p.color}
              opacity={p.life}
            />
          ))}
        </svg>
      )}

      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fab-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Diagonal menu items */}
      <AnimatePresence>
        {isOpen && (
          <div className="fab-menu" style={{ left: fabPos.x, top: fabPos.y }}>
            {[...tabs].reverse().map((tab, index) => {
              const Icon = tab.icon;
              const active = isActive(tab);
              const spacing = 68;
              const xDir = isOnRight ? -1 : 1;
              const yDir = isOnBottom ? -1 : 1;
              const x = (index + 1) * spacing * 0.55 * xDir;
              const y = (index + 1) * spacing * yDir;

              return (
                <motion.button
                  key={tab.key}
                  className={`fab-menu-item ${active ? "active" : ""} ${tab.key === "live" ? "live-item" : ""}`}
                  style={{ flexDirection: isOnRight ? "row-reverse" : "row" }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                  animate={{ opacity: 1, x, y, scale: 1 }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 22,
                    delay: index * 0.045,
                  }}
                  onClick={() => handleNav(tab)}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="fab-menu-icon">
                    <Icon sx={{ fontSize: 20 }} />
                  </span>
                  <span className="fab-menu-label">{tab.label}</span>
                  {tab.key === "live" && <span className="fab-live-dot" />}
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* FAB Button — draggable */}
      <motion.button
        className={`fab-button ${isOpen ? "open" : ""} ${mode === "live" ? "fab-live-mode" : ""}`}
        style={{ left: fabPos.x, top: fabPos.y, right: "auto", bottom: "auto" }}
        onPointerDown={onPointerDown}
        onClick={handleFabClick}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        animate={isOpen
          ? { rotate: 135, scale: 1, y: 0 }
          : { rotate: 0, scale: 1, ...idleFloat }
        }
        transition={isOpen
          ? { type: "spring", stiffness: 400, damping: 20 }
          : { y: { duration: 2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } }
        }
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}>
              <CloseIcon sx={{ fontSize: 26 }} />
            </motion.div>
          ) : (
            <motion.div key="open"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}>
              <SportsCricketIcon sx={{ fontSize: 26 }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

export default BottomNav;
