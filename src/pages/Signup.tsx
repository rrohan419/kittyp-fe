import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from "framer-motion";
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
import { toast } from "sonner";
import { UserPlus, Mail, Lock, User, CheckCircleIcon } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { signup, socialSso } from '@/services/authService';
import ErrorDialog from '@/components/ui/error-dialog';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/module/store/store';
import { validateAndSetUser } from '@/module/slice/AuthSlice';
import { initializeUserAndCart } from '@/module/slice/CartSlice';

const Signup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const handleGoogleSignup = () => googleLogin();
  const dispatch = useDispatch<AppDispatch>();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure your passwords match."
      });
      return;
    }

    setLoading(true);

    try {
      const response = await signup({ firstName, lastName, email, password });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }

      // Show success dialog first
      setShowSuccessDialog(true);

      // Wait for dialog animation and user acknowledgment
      setTimeout(() => {
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        // Show success toast
        toast.success("Account created successfully", {
          description: "Please login with your new account",
          duration: 3000,
        });

        // Navigate to login
        navigate("/login");
      }, 2000);

    } catch (error: any) {
      console.error("Signup Error:", error.message);
      setErrorMessage(error.message);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
     
      await socialSso(tokenResponse);

      await dispatch(validateAndSetUser()).unwrap();

      // Initialize cart state (this will trigger background sync if needed)
      await dispatch(initializeUserAndCart()).unwrap();

      // Show success message
      toast.success("Google login successful!");
      navigate("/");
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
              Create an Account
            </h1>
            <p className="text-muted-foreground mb-12 text-center">
              Join kittyp to access eco-friendly cat litter products and exclusive offers.
            </p>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-center">Sign Up</CardTitle>
                <CardDescription className="text-center">
                  Create your account to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        className="pl-10"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        className="pl-10"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

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
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {loading ? 'Creating Account...' : 'Create Account'}
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
                  onClick={() => handleGoogleSignup()}
                  disabled={loading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:text-primary/90 font-medium">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Success Dialog */}
      {/* <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Created!</DialogTitle>
            <DialogDescription>
              This is a demo signup. In a real application, you would receive a verification email and be redirected to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="p-6 max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-bold">Account Created!</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Your account has been successfully created. You will be redirected to login.
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                navigate("/login");
              }}
              className="mt-4 w-full"
              variant="default"
            >
              Continue to Login
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <ErrorDialog showErrorDialog={showErrorDialog} setShowErrorDialog={setShowErrorDialog} errorMessage={errorMessage} />

      <Footer />
    </div>
  );
};

export default Signup;