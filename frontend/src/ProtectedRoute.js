import { useState } from "react";
import useUserStore from "../../store/useUserStore.js";
import { useEffect } from "react";
import { checkUserAuth } from "./services/user.service.js";
import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "zustand";

export const ProctedRoute = () => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  const { isAuthenticated, setUser, clearUser } = useUserStore();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await checkUserAuth();
        if (result?.isAuthenticated) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch (error) {
        console.log(error);
        clearUser();
      } finally {
        setIsChecking(false);
      }
    };
    verifyAuth();
  }, [setUser, clearUser]);

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
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
    // replace with the url
  }
  return <Outlet />;
};
