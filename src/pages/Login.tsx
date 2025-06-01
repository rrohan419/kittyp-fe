import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock, EyeOff, Eye, EyeOffIcon } from 'lucide-react';
import { authConfig } from '@/config/auth';
import { useGoogleLogin } from '@react-oauth/google';
import { login } from '@/services/authService';
import ErrorDialog from '@/components/ui/error-dialog';
import { LoginResponse } from './Interface/PagesInterface';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store';
import { initializeUserAndCart } from '@/module/slice/CartSlice';
// import { useCart } from '@/context/CartContext';

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const hasGuestCartItems = useSelector((state: RootState) => 
    state.cartReducer.items.length > 0 && state.cartReducer.isGuestCart
  );
  // const { initializeUserAndCart } = useCart();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, perform the login
      const loginResponse = await login({ email, password });
      
      // Navigate immediately after successful login
      navigate("/");
      
      // Handle cart sync and other non-critical operations asynchronously
      Promise.all([
        dispatch(initializeUserAndCart()),
        // Add any other non-critical operations here
      ]).then(() => {
        // Show success message if guest cart was synced
        if (hasGuestCartItems) {
          toast({
            title: "Cart Synced",
            description: "Your cart items have been saved to your account",
            duration: 1000,
          });
        }
      }).catch((error) => {
        console.error("Error in background operations:", error);
        toast({
          title: "Background Sync Warning",
          description: "Some features may take a moment to update",
          duration: 3000,
        });
      });

    } catch (error: any) {
      console.error("Signin Error:", error);
      setErrorMessage(error.message || 'Login failed');
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }

    console.log('Login attempted with:', { email });
  };


  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("Google Login Success:", tokenResponse);
      try {
        const response = await fetch("http://localhost:8001/public/v1/social-sso", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: tokenResponse.code, // The authorization code
            provider: "GOOGLE",
          }),
        });

        if (!response.ok) {
          throw new Error("Backend response: " + (await response.text()));
        }

        const data = await response.json();
        console.log("Backend Response:", data);
        // setShowSuccessDialog(true);

        // Access the tokens if returned by your backend
        const { access_token, id_token } = data;
        console.log("Access Token:", access_token);
        console.log("ID Token:", id_token);

        // Optionally store tokens (e.g., in localStorage or a state management solution)
        // localStorage.setItem("access_token", access_token);
        // localStorage.setItem("id_token", id_token);
      } catch (error) {
        console.error("Error during token exchange:", error);
        toast({
          title: "Signup Failed",
          description: "Could not complete Google signup. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (errorResponse) => {
      console.error("Google Login Error:", errorResponse);
      toast({
        title: "Google Signup Failed",
        description: "Authentication error. Please try again.",
        variant: "destructive",
      });
    },
    flow: "auth-code",
    scope: "email profile", // Ensure you request necessary scopes
    redirect_uri: "http://localhost:8080/home", // Explicitly set redirect URI
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-foreground">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mb-12 text-center">
              Sign in to your kittyp account to manage your eco-friendly cat litter orders.
            </p>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-center">Sign In</CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/90">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    Sign In
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:text-primary/90 font-medium">
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <ErrorDialog showErrorDialog={showErrorDialog} setShowErrorDialog={setShowErrorDialog} errorMessage={errorMessage} />

      <Footer />
    </div>
  );
};

export default Login;
