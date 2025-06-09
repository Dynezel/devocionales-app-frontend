import React, { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('contrasenia', contrasenia);

      const response = await axios.post('http://localhost:8080/logincheck', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true, // Asegura que las cookies de sesión se envíen y reciban
      });

      if (response.status === 200) {
        // Redirigir a la página principal
        window.location.href = '/';
      }
      console.log('SE INICIO SESION, GRACIAS');
    } catch (error) {
      console.error('Error durante el inicio de sesión', error);
    }
  };

  return (
    <form className='login' onSubmit={handleSubmit}>
      <div>
        <label htmlFor='email'>Correo Electrónico:</label>
        <input
          type='email'
          id='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor='contrasenia'>Contraseña:</label>
        <input
          type='password'
          id='contrasenia'
          value={contrasenia}
          onChange={(e) => setContrasenia(e.target.value)}
          required
        />
      </div>
      <div>
        <button type='submit'>Login</button>
      </div>
    </form>
  );
}
