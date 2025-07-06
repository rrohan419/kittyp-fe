import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google";
// import { Root } from 'vaul';
import CustomRoot from './Root.tsx';

// createRoot(document.getElementById("root")!).render(<App />);
createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="554859125201-1t3dbale4g7ar10fk3ljfkmkm0p7fav1.apps.googleusercontent.com">
    <CustomRoot />
  </GoogleOAuthProvider>)