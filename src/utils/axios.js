import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://cricket-auction-backend.vercel.app/api/v1",
});

export { instance };
