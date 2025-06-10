import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";
import { ArrowLeft, Lock, Check, EyeOffIcon, Eye } from 'lucide-react';
import { resetPassword } from '@/services/authService';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Get email from session storage
        const resetEmail = sessionStorage.getItem('resetEmail');
        if (!resetEmail) {
            toast.error("Error", {
                description: "No email found. Please restart the password reset process."
            });
            navigate('/forgot-password');
        } else {
            setEmail(resetEmail);
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords don't match", {
                description: "Please make sure your passwords match."
            });
            return;
        }

        if (password.length < 8) {
            toast.error("Password too short", {
                description: "Password must be at least 8 characters long."
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const resetCode = sessionStorage.getItem('resetCode');
            const success = await resetPassword(resetCode, password, email);

            if (success) {
                toast.success("Password reset successful", {
                    description: "Your password has been reset. You can now login with your new password."
                });
                // Clear session storage
                sessionStorage.removeItem('resetEmail');
                sessionStorage.removeItem('resetCode');
                navigate('/login');
            }
        } catch (error) {
            toast.error("Error", {
                description: "Failed to reset password. Please try again."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md mx-auto">
                        <Link to="/verify-reset-code" className="inline-flex items-center text-kitty-600 mb-6 hover:text-kitty-700">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>

                        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                            Reset Password
                        </h1>

                        <Card>
                            <CardHeader>
                                <CardTitle>Create new password</CardTitle>
                                <CardDescription>
                                    Enter your new password below. Choose a strong password that you haven't used before.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pl-10"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={8}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pl-10"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-kitty-600 hover:bg-kitty-700 flex items-center justify-center gap-2 mt-4"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Resetting..." : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Reset Password
                                            </>
                                        )}
                                    </Button>
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

export default ResetPassword;