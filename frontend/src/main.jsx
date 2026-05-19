import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import data from './data.json';

createRoot(document.getElementById('root')).render(<App data={data} />);
