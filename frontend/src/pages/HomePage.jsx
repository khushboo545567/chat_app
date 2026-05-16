import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { motion } from "framer-motion";
import ChatList from "./chat/ChatList.jsx";
import { getContacts } from "../services/user.service.js";
import useChatStore from "../store/useChatStore.js";

const Home = () => {
  const { getConversations, conversations, messages } = useChatStore();

  useEffect(() => {
    const fetchData = async () => {
      await getConversations();
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
