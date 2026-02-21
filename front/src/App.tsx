import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import { reportPageView } from "./metrics/prometheus";

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handleNavigation = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  useEffect(() => {
    reportPageView(path);
  }, [path]);

  if (path === "/login") return <LoginPage />;
  if (path === "/register") return <RegisterPage />;
  return <LandingPage />;
}
