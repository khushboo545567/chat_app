import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { motion } from "framer-motion";
import ChatList from "./chat/ChatList.jsx";
import { getContacts } from "../services/user.service.js";

const Home = () => {
  const [allUsers, setAllUsers] = useState([]);

  const getContact = async () => {
    try {
      const result = await getContacts();
      if (result?.success) {
        setAllUsers(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getContact();
  }, []);

  console.log("from home get contacts", allUsers);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList contacts={allUsers} />
      </motion.div>
    </Layout>
  );
};

export default Home;
