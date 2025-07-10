import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("https://devocionales-app-backend.onrender.com/usuario/perfil", { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user", error);
      }
    };

    fetchUser();

    const sessionInterval = setInterval(async () => {
      try {
        const response = await axios.get("https://devocionales-app-backend.onrender.com/api/session-status", { withCredentials: true });
        if (response.data.status === "unauthenticated" || (response.data.status === "active" && !response.data.active)) {
          setSessionExpired(true);
        } else {
          setSessionExpired(false);
        }
      } catch (error) {
        console.error("Error checking session status", error);
      }
    }, 7200000);

    return () => clearInterval(sessionInterval);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, sessionExpired, setSessionExpired }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);