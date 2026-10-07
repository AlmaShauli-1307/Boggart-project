import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// loaded after all component styles (UX findings section 3)
import './accessibility.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);