import { useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { toast } from "sonner";

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would send the form data to your backend
        // console.log('Form submitted:', formData);

        // Show success toast
        toast.success("Message Sent!", {
            description: "We'll get back to you as soon as possible."
        });

        // Reset form
        setFormData({
            name: '',
            email: '',
            subject: '',
            message: ''
        });
    };

    return (
        <div className="min-h-screen bg-background">

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl font-bold mb-8 text-center text-foreground">
                            Contact Us
                        </h1>
                        <p className="text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
                            Have questions about our eco-friendly cat litter? Want to become a retailer?
                            We'd love to hear from you!
                        </p>

                        <div className="grid gap-8 md:grid-cols-2 mb-12">
                            <div className="space-y-6">
                                <Card>
                                    <CardContent className="p-6 flex items-start space-x-4">
                                        <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-medium text-lg mb-1 text-foreground">Email Us</h3>
                                            <p className="text-muted-foreground mb-2">
                                                For customer support and inquiries:
                                            </p>
                                            <a
                                                href="mailto:support@kittyp.com"
                                                className="text-primary hover:text-primary/90 transition-colors"
                                            >
                                                support@kittyp.in
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6 flex items-start space-x-4">
                                        <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-medium text-lg mb-1 text-foreground">Call Us</h3>
                                            <p className="text-muted-foreground mb-2">
                                                Monday to Friday, 9am - 5pm EST:
                                            </p>
                                            <a
                                                href="tel:+1-800-KITTY-P"
                                                className="text-primary hover:text-primary/90 transition-colors"
                                            >
                                                1-800-KITTY-P
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6 flex items-start space-x-4">
                                        <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-medium text-lg mb-1 text-foreground">Visit Us</h3>
                                            <p className="text-muted-foreground mb-2">
                                                Our headquarters:
                                            </p>
                                            <address className="not-italic text-foreground">
                                                123 Eco Way<br />
                                                Portland, OR 97201<br />
                                                United States
                                            </address>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        Send a Message
                                    </CardTitle>
                                    <CardDescription>
                                        Fill out the form below and we'll get back to you as soon as possible.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Your Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Jane Smith"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="jane.smith@example.com"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input
                                                id="subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="Product question"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message</Label>
                                            <textarea
                                                id="message"
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                rows={4}
                                                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="How can we help you?"
                                                required
                                            ></textarea>
                                        </div>

                                        <Button type="submit" className="w-full">
                                            Send Message
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="text-center mt-12">
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">
                                Join Our Community
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Follow us on social media for updates, promotions, and cat care tips!
                            </p>

                            <div className="flex justify-center space-x-6">
                                <a
                                    href="https://www.fb.com/rrohan419"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/90 transition-colors"
                                >
                                    Facebook
                                </a>
                                <a
                                    href="https://www.instagram.com/rrohan419"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/90 transition-colors"
                                >
                                    Instagram
                                </a>
                                <a
                                    href="https://www.x.com/rrohan419"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/90 transition-colors"
                                >
                                    Twitter
                                </a>
                                <a
                                    href="https://www.youtube.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/90 transition-colors"
                                >
                                    YouTube
                                </a>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Contact;