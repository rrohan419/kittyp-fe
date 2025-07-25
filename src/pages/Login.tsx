import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
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
import { toast } from "sonner";
import { LogIn, Mail, Lock, EyeOff, Eye, EyeOffIcon } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { login, socialSso } from '@/services/authService';
import ErrorDialog from '@/components/ui/error-dialog';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { validateAndSetUser } from '@/module/slice/AuthSlice';
import { initializeUserAndCart } from '@/module/slice/CartSlice';

const Login = () => {
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

      // Validate token and set user in AuthSlice
      await dispatch(validateAndSetUser()).unwrap();

      // Initialize cart state (this will trigger background sync if needed)
      await dispatch(initializeUserAndCart()).unwrap();

      // Show a notification about cart syncing if there are guest items
      if (hasGuestCartItems) {
        toast.success("Logging you in", {
          description: "Your cart items will be synced in the background",
          duration: 3000,
        });
      }

      // Navigate immediately after login
      navigate("/");

    } catch (error: any) {
      console.error("Signin Error:", error);
      setErrorMessage(error.message || 'Login failed');
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }

    // console.log('Login attempted with:', { email });
  };


  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        await socialSso(tokenResponse);

        await dispatch(validateAndSetUser()).unwrap();

        // Initialize cart state (this will trigger background sync if needed)
        await dispatch(initializeUserAndCart()).unwrap();

        // Show success message
        toast.success("Google login successful!", {
          description: "Welcome back!",
        });

        // Navigate to home page
        navigate("/");
      } catch (error: any) {
        console.error("Google Login Error:", error);
        toast.error("Google Signup Failed", {
          description: "Authentication error. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error("Google Login Error:", errorResponse);
      toast.error("Google Signup Failed", {
        description: "Authentication error. Please try again.",
      });
    },
    flow: "implicit", // Use implicit flow to prevent redirects
    scope: "email profile", // Ensure you request necessary scopes
  });

  return (
    <div className="min-h-screen bg-background">

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
                  onClick={() => handleGoogleLogin()}
                  disabled={loading}
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
