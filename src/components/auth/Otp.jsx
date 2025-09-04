import React from "react";

function Otp({handleOtpChange, otpRefs, otp, closeOtpSection}) {
  return (
    <>
      <div className="otp-container">
        {otp.map((digit, index) => (
          <input
            key={index}
            className="otp-input"
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            ref={(el) => (otpRefs.current[index] = el)}
          />
        ))}
      </div>
      <div className="otp-action">
        <button type="button" onClick={closeOtpSection}>
          Re-enter Email
        </button>
      </div>
    </>
  );
}

export default Otp;