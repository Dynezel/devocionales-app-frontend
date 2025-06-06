import React, { useEffect, useState } from "react";
import LogoImg from "../Images/DevocionalesWebIconBlack2.png";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ChatDropdown from "./ChatDropdown";
import NotificationDropdown from "./NotificationDropdown";
import iconoChat from '../Images/chat-icon3.png'; 

export default function NavBar({ handleConversacionClick }) {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth); 
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8080/logout", null, { withCredentials: true });
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:8080/usuario/perfil", { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user", error);
      }
    };
    fetchUser();

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Alternar el estado de visibilidad del menú al hacer clic en la imagen de perfil
  };

  return (
    <header className="header">
      <div className="nav-container">
        <Link className="icon" to={"/"}>
          <img src={LogoImg} alt="Logo" className={`logo ${user ? "logged-in" : ""}`} />
        </Link>

        {/* Mostrar solo la imagen de perfil en pantallas pequeñas si está logeado */}
        {user && windowWidth < 768 ? (
          <div className="user-profile" onClick={toggleMenu}>
            <img
              src={`http://localhost:8080/imagen/perfil/${user.idUsuario}`}
              alt="Foto de perfil"
              className="profile-image"
            />
            {menuOpen && (
              <div className="user-menu">
                <Link to={"/usuario/perfil"}>
                  <button className="boton-menu-navbar">Perfil</button>
                </Link>
                <button onClick={handleLogout}>Cerrar Sesión</button>
              </div>
            )}
          </div>
        ) : (
          <nav className={`links ${hamburgerOpen ? "nav-items-mobile" : ""}`}>
            {user ? (
              <div className="nav-items">
                <Link to={"/devocionales/crear"}><strong>Crear Devocional</strong></Link>
                {hamburgerOpen ? (
                  <Link to={`/conversaciones/${user.idUsuario}`}>
                    <img src={iconoChat} className="chat-icon" alt="Chat Icon" />
                  </Link>
                ) : (
                  <ChatDropdown handleConversacionClick={handleConversacionClick} user={user} />
                )}
                <NotificationDropdown user={user} />
                <div className="user-profile" onClick={toggleMenu}>
                  <div>{user.nombre}</div>
                  <img
                    src={`http://localhost:8080/imagen/perfil/${user.idUsuario}`}
                    alt="Foto de perfil"
                    className="profile-image"
                  />
                  {menuOpen && (
                    <div className="user-menu">
                      <Link to={"/usuario/perfil"}>
                        <button className="boton-menu-navbar">Perfil</button>
                      </Link>
                      <button onClick={handleLogout}>Cerrar Sesión</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="nav-items">
                {windowWidth < 768 ? (
                  <div className="hamburger-menu" onClick={() => setHamburgerOpen(!hamburgerOpen)}>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                ) : (
                  <>
                    <Link to={"/usuario/registro"}>Regístrate</Link>
                    <Link to={"/login"}>Inicia Sesión</Link>
                  </>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}