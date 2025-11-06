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
import { instance } from "../utils/axios";

// Toast
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "" });
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [showOtpField, setShowOtpField] = useState(false);

  useEffect(() => {
    document.title = "Login";
    document.body.classList.remove("scroll-enabled");
    return () => {
      document.body.classList.add("scroll-enabled");
    };
  }, []);

  const otpRefs = useRef([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    let emailValidation;

    const emailSchema = yup
      .string()
      .email("Invalid email")
      .required("Email is required");

    try {
      emailValidation = await emailSchema.validate(formData.email, {
        abortEarly: false,
      });

      if (emailValidation) {
        const requestData = {
          email: formData.email,
        };
        const response = await instance.post("/auth/login", requestData);
        if (response.status === 200) {
          toast.success("OTP has been sent to your E-Mail");
          setShowOtpField(true);
        } 
      }
    } catch (err) {
      console.log(err);
      
      if (err?.response?.status === 404) {
        toast.error("User not found! Please register first");
      } else {
        toast.error("Internal Server Error!");
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
      const requestData = {
        email: formData.email,
        otp: enteredOTp,
      };
      let res = await instance.post("/auth/lotp", requestData);
      if (res.status === 200) {
        toast.success("OTP Verified Successfully!");
        setOtp(new Array(6).fill(""));
        setShowOtpField(false);
        setFormData({ email: "" });
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
            <h2>Login</h2>
            <hr className="auth-divider" />

            <form className="form-container">
              <Input
                animate={-50}
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
                  <Knob handleClick={handleLogin} buttonName={"Login"} />
                )}
              </motion.div>

              <ParaFooter
                paraName="New Player?"
                spanName="Register"
                handleClick={() => {
                  setIsLogin(!isLogin);
                  setShowOtpField(false);
                  navigate("/register");
                }}
              />
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
