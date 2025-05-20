import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { sendPasswordResetCode, verifyPasswordResetCode } from '@/services/authService';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from '@/components/ui/input-otp';

const VerifyResetCode = () => {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

useEffect(() => {
  const performPasswordReset = async () => {
    try {

    //   await sendPasswordResetCode();
      
      // Get email from session storage
      const resetEmail = sessionStorage.getItem('resetEmail');
      if (!resetEmail) {
        toast({
          title: "Error",
          description: "No email found. Please restart the password reset process.",
          variant: "destructive"
        });
        navigate('/forgot-password');
      } else {
        setEmail(resetEmail);
      }
    } catch (error) {
      // Optional: Handle any errors from sendPasswordResetCode
      toast({
        title: "Error! Please try again",
        description: "Failed to send password reset code",
        variant: "destructive",

      });
    }
  };

  performPasswordReset();
}, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter all 6 digits of your verification code.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await verifyPasswordResetCode(code, email);
      
      if (success) {
        toast({
          title: "Code verified",
          description: "You can now set your new password.",
        });

        sessionStorage.setItem('resetCode', code);
        navigate('/reset-password');
      } else {
        toast({
          title: "Invalid code",
          description: "The code you entered is incorrect. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    toast({
      title: "Code resent",
      description: "A new verification code has been sent to your email.",
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <Link to="/forgot-password" className="inline-flex items-center text-kitty-600 mb-6 hover:text-kitty-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forgot Password
            </Link>

            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Verify Code
            </h1>
            
            <Card>
              <CardHeader>
                <CardTitle>Enter verification code</CardTitle>
                <CardDescription>
                  We've sent a 6-digit code to your email address. Enter the code below to continue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-center py-4">
                      <InputOTP maxLength={6} value={code} onChange={setCode}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-kitty-600 hover:bg-kitty-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Verifying..." : "Verify Code"}
                  </Button>

                  <div className="text-center">
                    <Button 
                      variant="link" 
                      type="button" 
                      onClick={handleResend}
                      className="text-kitty-600 hover:text-kitty-700"
                    >
                      Didn't receive a code? Resend
                    </Button>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your password?{" "}
                  <Link to="/login" className="text-kitty-600 hover:text-kitty-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyResetCode;