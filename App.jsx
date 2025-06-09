import { useState } from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NavBar from './Componentes/NavBar'
import Footer from './Componentes/Footer'
import Devocionales from './Componentes/Devocionales'
import EliminarDevocional from './Componentes/EliminarDevocional'
import CrearDevocional from './Componentes/CrearDevocional'
import ModificarDevocional from './Componentes/ModificarDevocional'
import RegistrarUsuario from './Componentes/RegistrarUsuario'
import Login from './Componentes/Login'
import Perfil from './Componentes/Perfil'
import PerfilUsuario from './Componentes/PerfilUsuario'
import Prueba from './Componentes/Prueba'
import Mensajeria from './Componentes/Mensajeria'
import Conversaciones from './Componentes/Conversaciones'
import Devocional from './Componentes/Devocional'
import ConfiguracionUsuario from './Componentes/ConfiguracionUsuario'
import Notificaciones from './Componentes/Notificaciones'



function App() {

  return (
    <>
      <BrowserRouter>
      <NavBar/>
      <Routes>
      <Route path="/" element={<Devocionales />} />
      <Route path="/devocional/:id" element={<Devocional />} />
      <Route path="/prueba" element={<Prueba />} />
      <Route path="/devocionales/crear" element={<CrearDevocional />} />
      <Route path="/devocionales/modificar/:id" element= { <ModificarDevocional/> } />
      <Route path="/devocionales/eliminar/:id" element= { <EliminarDevocional/> } />
      <Route path="/usuario/registro" element= { <RegistrarUsuario/> } />
      <Route path="/usuario/perfil" element={<Perfil/>} />
      <Route path="/usuario/perfil/:idUsuario" element={<PerfilUsuario/>} />
      <Route path="/usuario/configuracion" element={<ConfiguracionUsuario />} />
      <Route path="/usuario/notificaciones" element={ <Notificaciones /> } />
      <Route path="/conversaciones/:usuarioActualId" element={<Conversaciones />} />
      <Route path="/mensajeria/:usuarioId/:usuarioActualId" element={<Mensajeria/>} />
      <Route path="/login" element= { <Login/> } />
      </Routes>
      <Footer/>
      </BrowserRouter>
      
    </>  
  )
}

export default App