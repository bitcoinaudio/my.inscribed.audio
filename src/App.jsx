import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { WalletProvider } from "./context/WalletContext";
import { OrdinalsHostProvider } from "./context/OrdinalsHostContext";
import { DeviceProvider } from "./utils/DeviceStore";

import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Feature from "./pages/Feature";
import Collections from "./pages/Collections";
import MyMedia from "./pages/MyMedia";
import NK1 from "./pages/NK-1";
import NavBar from "./components/NavBar";
import FooterPage from "./pages/Footer";

const App = () => {
  return (
    <Router>
      <OrdinalsHostProvider>
        <WalletProvider>
          <DeviceProvider>
            <div className="p-2 md:px-10">
              <NavBar />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<Home />} />
                <Route path="/feature" element={<Feature />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/mymedia" element={<MyMedia />} />
                <Route path="/my-media" element={<Navigate to="/mymedia" replace />} />
                <Route path="/nk-1" element={<NK1 />} />
              </Routes>
            </div>
            <FooterPage />
          </DeviceProvider>
        </WalletProvider>
      </OrdinalsHostProvider>
    </Router>
  );
};

export default App;
