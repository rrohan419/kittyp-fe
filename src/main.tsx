import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google";

// createRoot(document.getElementById("root")!).render(<App />);
createRoot(document.getElementById("root")!).render(
<GoogleOAuthProvider clientId="954024777360-lju1esfmeo6vuovpfv03604vs600uc1i.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>)