// App.js
import React, { createContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Ishikawa from './components/Ishikawa/Ishikawa';
import Login from './components/Login/login';
import Diagrama from './components/DiagramaRe/Diagrama';
import AuthProvider from './AuthProvider';
import ProtectedRoute from './ProtectedRoute';

export const UserContext = createContext(null);

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/ishikawavacio"
              element={
                <ProtectedRoute>
                  <Ishikawa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diagramas"
              element={
                <ProtectedRoute>
                  <Diagrama />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
