import React from 'react';

function ParaFooter({paraName, handleClick, spanName}) {
    return (
        <p className="auth-footer">
            {paraName}{" "}
            <span onClick={handleClick}>
                {spanName}
            </span>
        </p>
    );
}

export default ParaFooter;