import React, { useState, useRef, useEffect } from "react";
import "../style/auth.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";

// Custom Components
import Input from "../components/auth/Input";
import Otp from "../components/auth/Otp";
import Knob from "../components/auth/Knob";
import ParaFooter from "../components/auth/ParaFooter";

// Axios
import { authAPI } from "../utils/axios";

// Toast
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(true);
  const [formData, setFormData] = useState({ email: "", mobile: "" });
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [showOtpField, setShowOtpField] = useState(false);

  const otpRefs = useRef([]);

  useEffect(() => {
    document.title = "Register";
    document.body.classList.remove("scroll-enabled");
    return () => {
      document.body.classList.add("scroll-enabled");
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    let emailValidation;
    let mobileValidation;

    const emailSchema = yup
      .string()
      .email("Invalid email")
      .required("Email is required");
    const mobileSchema = yup
      .string()
      .matches(/^\d{10}$/, "Mobile number must be 10 digits")
      .required("Mobile number is required");

    try {
      emailValidation = await emailSchema.validate(formData.email, {
        abortEarly: false,
      });
      mobileValidation = await mobileSchema.validate(formData.mobile, {
        abortEarly: false,
      });

      if (emailValidation && mobileValidation) {
        const requestData = {
          email: formData.email,
          mobile: formData.mobile,
        };
        const response = await authAPI.post(
          "/register",
          requestData
        );
        if (response.status === 201) {
          toast.success("OTP has been sent to your E-Mail");
          setShowOtpField(true);
        }
      }
    } catch (err) {      
      if (err.response === undefined) {
        toast.error(err.message);
      } else {
        switch (err.response.status) {
          case 400:
            toast.error("Invalid email or mobile number!");
            break;
          case 409:
            toast.error("User already exists!");
            break;
          default:
            toast.error("Internal Server Error!");
            break;
        }
      }
    }
  };

  const handleOtpChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < otp.length - 1) {
        otpRefs.current[index + 1].focus();
      }
    }
  };

  const verifyOtp = async (e) => {
    try {
      e.preventDefault();
      let enteredOTp = Number(otp.join(""));

      let res = await authAPI.post("/rotp", {
        email: formData.email,
        mobile: formData.mobile,
        otp: enteredOTp,
      });
      if (res.status === 201) {
        toast.success("OTP Verified Successfully!");
        setOtp(new Array(6).fill(""));
        setShowOtpField(false);
        setFormData({ email: "", mobile: "" });
        localStorage.setItem("auction", res.data.token);
        navigate("/profile");
      }
    } catch (error) {
      if (error.response.status === 401) {
        toast.error("Invalid OTP!");
      } else {
        toast.error("Internal Server Error!");
      }
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="auth-motion-container"
        >
          <div className="auth-card">
            <h2>Register</h2>
            <hr className="auth-divider" />

            <form className="form-container">
              <Input
                animate={-50}
                fieldName="Mobile Number"
                fieldType="number"
                placeholder="Enter Mobile Number"
                formData={formData}
                handleChange={handleChange}
                nameAttribute="mobile"
                disabled={showOtpField}
              />
              <Input
                animate={50}
                fieldName="Email"
                fieldType="email"
                placeholder="Enter Email"
                formData={formData}
                handleChange={handleChange}
                nameAttribute="email"
                disabled={showOtpField}
              />

              {showOtpField && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <Otp
                    handleOtpChange={handleOtpChange}
                    otpRefs={otpRefs}
                    otp={otp}
                    closeOtpSection={() => setShowOtpField(false)}
                  />
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showOtpField ? (
                  <Knob handleClick={verifyOtp} buttonName={"Verify OTP"} />
                ) : (
                  <Knob handleClick={handleRegister} buttonName={"Register"} />
                )}
              </motion.div>

              <ParaFooter
                paraName="Already have an account?"
                spanName="Login"
                handleClick={() => {
                  setIsRegistering(!isRegistering);
                  setShowOtpField(false);
                  navigate("/login");
                }}
              />
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
