import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/userLogin/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PublicRoute, ProctedRoute } from "./ProtectedRoute";
import Home from "./pages/HomePage";
import UserDetails from "./pages/userDetailsPage";
import Setting from "./pages/settings/Setting";
import Status from "./pages/status/Status";
import useUserStore from "./store/useUserStore";
import useChatStore from "./store/useChatStore.js";
import useLayoutStore from "./store/useLayoutStore.js";

import { initializeSocket } from "./services/chat.service";
import { disconnectSocket } from "./services/chat.service";

function App() {
  const { user } = useUserStore();
  const { setCurrenctUser, initSocketListeners, cleanup } = useChatStore();
  const { setSelectedContact } = useLayoutStore();

  useEffect(() => {
    if (!user?._id) return;

    const socketInstance = initializeSocket();

    if (socketInstance) {
      setCurrenctUser(user);
      initSocketListeners();
    }

    return () => {
      cleanup();
      setSelectedContact(null);
      disconnectSocket();
    };
  }, [user?._id]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<ProctedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/settings" element={<Setting />} />
            <Route path="/status" element={<Status />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
