import React from 'react';
import "../../style/home.css";

const TabButton = ({ label, isActive, onClick }) => {
    return (
        <div
            className={`tab-button ${isActive ? 'active' : ''}`}
            onClick={onClick}
        >
            {label}
        </div>
    );
};

export default TabButton;