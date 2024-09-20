import React from 'react';
import { createRoot } from 'react-dom/client';
// 如果你不需要全局样式，可以注释掉或删除下面这行
// import './index.css';
import App from './components/App';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);