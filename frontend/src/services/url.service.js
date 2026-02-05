import axios from "axios";
import dotenv from "dotenv";

const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1`;

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

export default axiosInstance;
