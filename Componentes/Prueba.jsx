import React, { useState, useEffect } from 'react';
import logo from './OsoPolar.jpeg';
import '../css/PerfilUsuario.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function Prueba() {
  const [user, setUser] = useState(null);
  const [imagenPerfil, setImagenPerfil] = useState(null);

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <div className="cover-photo">
          <img src="https://via.placeholder.com/600x200" alt="Cover Photo"/>
        </div>
        <div className="perfil-info">
          <div className="perfil-main">
            <img className="profile-picture" src={logo} alt="Imagen de Perfil"/>
            <div className="perfil-details">
              <h2>Dylan</h2>
              <p className="username">@dynezel54350</p>
            </div>
          </div>
          <div className="perfil-bio">
            <p className="bio">biogreafi, relleno puro asdkfmñsdm</p>
          </div>
        </div>
      </div>
      <div className="perfil-body">
        <div className="perfil-stats">
          <p><strong>Email:</strong> dylan50xd@gmail.com</p>
          <p><strong>Celular:</strong> 1126578841</p>
        </div>
      </div>
    </div>
  );
}