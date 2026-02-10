import { useState } from "react";
import useUserStore from "./store/useUserStore.js";
import { useEffect } from "react";
import { checkUserAuth } from "./services/user.service.js";
import { Navigate, Outlet } from "react-router-dom";
import React from "react";
import Loader from "./utils/Loder";
import { useLocation } from "react-router-dom";

export const ProctedRoute = () => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  const { isAuthenticated, setUser, clearUser } = useUserStore();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await checkUserAuth(); // backend checks token
        console.log("user data from protected routes", result.data);

        // ✅ if backend returned user, user is authenticated
        setUser(result.data);
      } catch (error) {
        console.log(error);
        clearUser();
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, []);

  if (isChecking) {
    return <Loader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  //   user auth render the protected route
  return <Outlet />;
};

export const PublicRoute = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
    // replace with the url
  }
  return <Outlet />;
};
