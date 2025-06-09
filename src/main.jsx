import React from 'react';
import ReactDOM from 'react-dom';

import { UserProvider } from './context/UserContext';
import './index.css';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <UserProvider>
      <App  />
    </UserProvider>
  </React.StrictMode>,
  document.getElementById('root')
);