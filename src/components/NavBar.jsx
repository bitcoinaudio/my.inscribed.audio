import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import ConnectWallet from './ConnectWallet';
import ConnectMobile from './ConnectMobile';
import { useDeviceContext } from "../utils/DeviceStore";
import iaLogo from '/images/ia-bg3.png';
import { useWallet } from '../context/WalletContext';
import { applyThemeConfig, loadAdminThemeConfig, resolveInitialTheme } from "../utils/themeConfig";

const THEME_KEY = "myinscribed-theme-mode";

const getStoredTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;

  const legacy = localStorage.getItem("theme");
  if (legacy === "light" || legacy === "dark") return legacy;

  return "dark";
};


const basenavigation = [
  { name: "My Inscribed Audio", href: "/" },
  { name: "Collections", href: "/collections" },
  ];


const NavBar = () => {
  const { walletItems, isWalletConnected, address } = useWallet();
  const hasContent = walletItems.length > 0;
  const { isMobile } = useDeviceContext();
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [theme, setTheme] = useState(getStoredTheme);


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const config = await loadAdminThemeConfig();
      if (!active || !config) return;

      applyThemeConfig(config);
      const nextTheme = resolveInitialTheme(config);
      setTheme(nextTheme);

      if (config.allowUserOverride === false) {
        localStorage.setItem(THEME_KEY, nextTheme);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  const navigation = [
    ...basenavigation,
    ...(isWalletConnected && hasContent ? [{ name: "My Media", href: "/mymedia" }] : []),
    ...(isWalletConnected ? [{ name: "NK-1", href: "/nk-1" }] : [])
  ];

  const navLinkClass = ({ isActive }) =>
    `btn btn-ghost font-urbanist text-sm font-medium ${isActive ? "bg-base-100 text-primary" : "text-base-content/75"}`;

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const shortAddress = address ? `${address.slice(0, 5)}...${address.slice(-5)}` : "";

  //  console.log("isWalletConnected NavBar", isWalletConnected);

  return (
    <div className={`sticky top-0 z-50 flex flex-col items-center gap-2 py-3 transition-transform duration-300 ${showNav ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="navbar w-full max-w-7xl rounded-box bg-base-200/95 px-3 py-2 backdrop-blur">
        <div className="navbar-start">
        <a href="https://inscribed.audio" className="btn btn-ghost font-urbanist text-lg font-semibold gap-4 lg:hidden">
           <img src={iaLogo} alt="inscribed audio" className="w-10 h-10" />
          </a>
          <div className="dropdown">
            {/* Mobile Menu */}
            
            <div tabIndex={0} role="button" className="btn btn-circle btn-ghost lg:hidden ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            {/* Mobile Menu */}

            <ul className="menu dropdown-content menu-md z-[1] mt-3 w-52 gap-2 rounded-box bg-base-100 p-2 shadow">
              {navigation.map((item) => (
                <li key={item.href}>
                  <NavLink to={item.href} end={item.href === "/"} className="font-urbanist text-xs">
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
         
        </div>
        {/* Desktop Menu */}
        <div className="navbar-center ml-4 hidden lg:flex">
            <a href="https://inscribed.audio" className="btn btn-ghost font-urbanist text-lg font-semibold gap-4 ">
           <img src={iaLogo} alt="inscribed audio" className="w-10 h-10" /><span className="text-sm font-semibold">Inscribed.Audio</span>
          </a>
          {navigation.map((item) => (
            <nav key={item.href} className="menu menu-horizontal px-1">
              <NavLink
                to={item.href}
                end={item.href === "/"}
                className={navLinkClass}
              >
                {item.name}
              </NavLink>
               
            </nav>
          ))}
        </div>

        <div className="navbar-end items-center gap-2">
          <div className="flex min-h-[2.0rem] flex-col justify-center gap-1">
          {isMobile ? <ConnectMobile /> : <ConnectWallet />}
          {isWalletConnected && !hasContent ? (
            <span className="text-[10px] text-base-content/70 text-center">No ordinals found in connected wallet</span>
          ) : null}
          </div>

          <button
            className="btn btn-sm btn-outline"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {theme === "light" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              )}
            </svg>
            <span className="text-xs font-medium uppercase tracking-wide">{theme === "light" ? "Dark" : "Light"}</span>
          </button>
        </div>
      </div>
      {isWalletConnected && shortAddress ? (
        <div className="w-full max-w-7xl rounded-box border border-base-300 bg-base-100 px-4 py-2 text-center text-xs text-base-content">
          Hi, your current address is {shortAddress}
        </div>
      ) : null}
    </div>
  );
};

export default NavBar;
