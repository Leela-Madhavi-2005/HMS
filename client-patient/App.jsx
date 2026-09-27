import { useEffect, useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppRouter from "./router/AppRouter";
import logoImg from "./assets/logo.png";

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAppReady(true), 250);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
      {!appReady ? (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            width: "140px",
            height: "140px",
            marginBottom: "24px",
            animation: "pulse-logo 1.8s infinite ease-in-out",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <img src={logoImg} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "16px" }} />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "3px solid #E2E8F0",
              borderTopColor: "#0A58A3",
              borderRadius: "50%",
              animation: "spin-loader 0.8s linear infinite"
            }}></div>
            <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0A58A3", letterSpacing: "0.5px" }}>
              Loading...
            </span>
          </div>

          <style>{`
            @keyframes pulse-logo {
              0%, 100% { transform: scale(1); opacity: 0.95; }
              50% { transform: scale(1.05); opacity: 1; }
            }
            @keyframes spin-loader {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <AppRouter />
      )}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
