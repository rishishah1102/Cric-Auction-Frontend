import React, { useCallback, useState } from 'react'
import "../style/navbar.css"
import { Navigate } from "react-router-dom";
import Navbar from "./navigation/Navbar";

const PrivateRoute = ({ element, headerText }) => {
    const [isOpen, setIsOpen] = useState(true)

    // Memoize handleOpen to prevent unnecessary re-renders
    const handleOpen = useCallback((open) => {
        setIsOpen(open);
    }, []);

    // If the auction token is present, render the element (component)
    if (localStorage.getItem("auction")) {
        return (
            <div>
                <Navbar onOpen={handleOpen} />
                <div
                    className="home_content"
                    style={{
                        width: isOpen ? `calc(100% - 240px)` : `calc(100% - 72px)`,
                        left: isOpen ? "240px" : "72px"
                    }}
                >
                    <div className="text"><h4>{ headerText ? headerText : `Auction Web`}</h4></div>
                    <>
                        {element}
                    </>
                </div>
            </div>
        );
    } else {
        // If there's no auction token, redirect to the /auth route
        return <Navigate to="/login" />;
    }
};

export default PrivateRoute;
