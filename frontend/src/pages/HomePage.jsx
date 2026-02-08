import Layout from "../components/Layout.jsx";
import { motion } from "framer-motion";
import ChatList from "./chat/ChatList.jsx";
import { useEffect, useState } from "react";
import { getContacts } from "../services/user.service.js";

const Home = () => {
  const setSelectedContet = useLayoutStore((state) => state.selectedContet);
  const [allUsers, setAllUsers] = useState([]);

  const getContact = async () => {
    try {
      const result = await getContacts();
      if (result?.success) {
        // /////////////////////////////
        setAllUsers(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getContact();
  }, []);
  console.log(allUsers);
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList
          constacts={allUsers}
          setSelectedContet={setSelectedContet}
        ></ChatList>
      </motion.div>
    </Layout>
  );
};

export default Home;
