import axios from "axios";

const instance = axios.create({
  baseURL: "https://cricket-auction-backend.vercel.app/api/v1",
});

export { instance };
