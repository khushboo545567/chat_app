import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { motion } from "framer-motion";
import ChatList from "./chat/ChatList.jsx";
import { getContacts } from "../services/user.service.js";
import useChatStore from "../store/useChatStore.js";

const Home = () => {
  const conversations = useChatStore((state) => state.conversations);
  const getUserContact = useChatStore((state) => state.getUserContact);

  useEffect(() => {
    const fetchData = async () => {
      await getUserContact();
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList contacts={conversations} />
      </motion.div>
    </Layout>
  );
};

export default Home;
