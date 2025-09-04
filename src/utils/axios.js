import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:5000",
  // baseURL: "https://cricket-auction-backend.vercel.app/",
});

const authAPI = axios.create({
  baseURL: "http://127.0.0.1:7001/api/v1/auth",
});

const profileAPI = axios.create({
  baseURL: "http://127.0.0.1:7002/api/v1",
});

const auctionAPI = axios.create({
  baseURL: "http://127.0.0.1:7003/api/v1",
});

export { instance, authAPI, profileAPI, auctionAPI };
