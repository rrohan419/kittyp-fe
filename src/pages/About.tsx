import React from 'react';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Calendar, ClipboardList, Receipt, Stethoscope, Shield, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const About = () => {
  return (
    <div className="min-h-screen bg-background">

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12 md:mb-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-up">
              About <span className="text-primary">Kittyp</span>
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-up animate-delay-100">
              The veterinary operating system for Indian clinics — built so your front desk,
              your doctors, and your pet parents stay on the same record.
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="bg-muted pb-16 md:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 animate-fade-up">
                <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
                <p className="text-muted-foreground mb-4">
                  Kittyp started with a simple observation: India's veterinary clinics run on overflowing
                  paper registers, scattered WhatsApp messages, and handwritten receipts. Doctors were
                  spending more time on admin than on animals.
                </p>
                <p className="text-muted-foreground mb-4">
                  We built Kittyp to replace all of that with one clean workflow — appointments, consults,
                  GST-ready invoices, and a pet health record that stays with the pet across clinics.
                </p>
                <p className="text-muted-foreground">
                  Today, clinics use Kittyp to run their front desk to discharge in a single screen, so
                  every visit is faster and every record is where it should be.
                </p>
              </div>
              <div className="order-1 md:order-2 animate-fade-up animate-delay-100">
                <img
                  src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                  alt="Veterinarian consulting with a pet owner"
                  className="rounded-lg shadow-xl w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-xl text-muted-foreground">
              We're on a mission to modernise Indian veterinary care — giving every clinic a digital
              practice, and every pet a health record that moves with them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="h-10 w-10 text-primary" />,
                title: "Front desk to discharge",
                content: "Appointments, reminders, and check-in managed end to end — no more paper registers."
              },
              {
                icon: <Stethoscope className="h-10 w-10 text-primary" />,
                title: "Clinical records that persist",
                content: "Every consult, prescription, and vaccine logged against the pet, not lost in a book."
              },
              {
                icon: <Receipt className="h-10 w-10 text-primary" />,
                title: "GST-ready billing",
                content: "Invoices generated in one click, compliant with Indian GST from day one."
              }
            ].map((item, index) => (
              <div
                key={item.title}
                className={cn(
                  "flex flex-col items-center text-center p-8 rounded-xl",
                  "bg-card border border-border",
                  "animate-fade-up"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-3 bg-accent rounded-full mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{item.title}</h3>
                <p className="text-muted-foreground">{item.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Values</h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide how we build Kittyp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <ClipboardList className="h-8 w-8 text-primary" />,
                title: "Clinicians first",
                content: "Workflows designed around how Indian clinics actually run, not how software vendors wish they ran."
              },
              {
                icon: <Shield className="h-8 w-8 text-primary" />,
                title: "Patient records stay secure",
                content: "Pet and owner data is treated as medical data — least-privilege access and end-to-end protection."
              },
              {
                icon: <Users className="h-8 w-8 text-primary" />,
                title: "Pet parents in the loop",
                content: "Owners see their pet's history and appointments, building trust and repeat visits."
              },
              {
                icon: <Receipt className="h-8 w-8 text-primary" />,
                title: "Transparent pricing",
                content: "Honest clinic-first plans with no hidden per-record charges — contact us for details."
              }
            ].map((value, index) => (
              <div
                key={value.title}
                className={cn(
                  "flex items-start p-6 rounded-xl",
                  "bg-card border border-border",
                  "animate-fade-up"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-2 bg-accent rounded-lg mr-4">
                  {value.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Location Section */}
        <section className="bg-gray-50 dark:bg-gray-900 py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Based in India</h2>
                <div className="flex items-start space-x-3 mb-6">
                  <MapPin className="h-6 w-6 text-kitty-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Built for Indian clinics
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Serving veterinary practices across India, with a team that understands
                      the local market — from GST to WhatsApp-first communication.
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Our platform is cloud-hosted with the security and uptime veterinary clinics depend on.
                </p>
                <Link to="/contact">
                  <Button>
                    Contact Us
                  </Button>
                </Link>
              </div>
              <div className="md:pl-8">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123950.23007762828!2d77.4777359!3d12.9715987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Kittyp — India"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-kitty-600 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to modernise your clinic?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join Indian veterinary clinics running their practice on Kittyp — from front desk to discharge.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Contact Us
                </Button>
              </Link>
              <Link to="/signup/clinic-admin">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  Start Free Pilot
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;