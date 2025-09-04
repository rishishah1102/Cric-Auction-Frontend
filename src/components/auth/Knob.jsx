import React from 'react';

function Knob({handleClick, buttonName}) {
    return (
        <button
            className="auth-button"
            onClick={handleClick}
            type="button"
        >
            {buttonName}
        </button>
    );
}

export default Knob;