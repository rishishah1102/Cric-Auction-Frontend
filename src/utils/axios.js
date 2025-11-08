import axios from "axios";

const instance = axios.create({
  baseURL: "http://0.0.0.0:5000/api/v1",
  // baseURL: "https://cricket-auction-backend.vercel.app/api/v1",
});

export { instance };
