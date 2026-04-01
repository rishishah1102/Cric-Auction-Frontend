import React from "react";

function Otp({ handleOtpChange, otpRefs, otp, closeOtpSection }) {

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    // Extract only digits
    const digits = pasted.replace(/\D/g, "").split("").slice(0, otp.length);
    if (digits.length === 0) return;

    const newOtp = [...otp];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    // Update all digits at once via the parent handler
    digits.forEach((d, i) => {
      handleOtpChange(i, d);
    });
    // Focus the next empty field or the last field
    const focusIndex = Math.min(digits.length, otp.length - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleKeyDown = (index, e) => {
    // Backspace on empty field → go to previous
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    // Arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleInput = (index, e) => {
    // On mobile, `e.target.value` can have multiple chars if autocomplete fires.
    // Take only the last digit typed.
    const val = e.target.value;
    const digit = val.replace(/\D/g, "").slice(-1);
    handleOtpChange(index, digit);
    if (digit && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  return (
    <>
      <div className="otp-container">
        {otp.map((digit, index) => (
          <input
            key={index}
            className="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength="1"
            value={digit}
            onChange={(e) => handleInput(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
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
