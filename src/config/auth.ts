interface AuthConfig {
    googleSsoUrl: string;
  }
  
  // Get environment-specific configuration
  const getAuthConfig = (): AuthConfig => {
    // Check if we're in a development environment (localhost)
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    return {
      googleSsoUrl: isLocalDev
        ? import.meta.env.VITE_GOOGLE_SSO_URL_LOCAL || 'https://accounts.google.com/o/oauth2/v2/auth'
        : import.meta.env.VITE_GOOGLE_SSO_URL_DEV || 'https://accounts.google.com/o/oauth2/v2/auth',
    };
  };
  
  export const authConfig = getAuthConfig();