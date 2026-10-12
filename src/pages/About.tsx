import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CalendarClock, FileText, Heart, MapPin, PawPrint, Receipt, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PUBLIC_SIGNUP_PATHS } from '@/utils/roles';

const petParentSignup = PUBLIC_SIGNUP_PATHS[0];
const veterinarianSignup = PUBLIC_SIGNUP_PATHS[1];
const clinicSignup = PUBLIC_SIGNUP_PATHS[2];

const missionItems = [
  {
    icon: CalendarClock,
    title: 'A Smoother Front Desk',
    content:
      'Book the slot, take a walk-in, and check the pet in from one list, so reception can move the day without a separate thread for every visit.',
  },
  {
    icon: Receipt,
    title: 'From Consultation to Payment',
    content:
      'Finish the consult and a draft invoice is ready. Reception collects payment and can share a PDF, including a GST-ready line.',
  },
  {
    icon: Heart,
    title: 'Records That Stay With the Pet',
    content:
      'Vaccines, notes, and invoices stay on the pet, so the next visit starts from that record — including when the pet is seen at another clinic.',
  },
] as const;

const values = [
  {
    icon: PawPrint,
    title: 'Pet at the Centre',
    content: 'The visit, the bill, and the history are organised around the pet, not a loose row in a spreadsheet.',
  },
  {
    icon: Stethoscope,
    title: 'One Connected Visit',
    content: 'The consultation, the draft invoice, and the payment belong to the same visit. Reception and the doctor share it.',
  },
  {
    icon: FileText,
    title: 'Records That Travel With the Pet',
    content: 'Notes, vaccines, and invoices stay associated with the pet, so care can continue across visits and clinics.',
  },
  {
    icon: Receipt,
    title: 'Honest Clinic Operations',
    content: 'Clinics keep a clear operational record of the visit, including a GST-ready invoice line they can hand over.',
  },
] as const;

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About Kittyp | Veterinary Clinic Management Platform</title>
        <meta
          name="description"
          content="Kittyp is a veterinary clinic management platform for India. It connects appointments, consultations, invoicing, payments, and pet records, with the pet at the centre."
        />
        <link rel="canonical" href="https://kittyp.in/about" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="About Kittyp | Veterinary Clinic Management Platform" />
        <meta
          property="og:description"
          content="Appointments, consults, invoices, and pet records in one clinic workflow for veterinary practices in India."
        />
        <meta property="og:url" content="https://kittyp.in/about" />
        <meta property="og:image" content="https://kittyp.in/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Kittyp | Veterinary Clinic Management Platform" />
        <meta
          name="twitter:description"
          content="Veterinary clinic CRM for India. Book, consult, invoice, and keep the record with the pet."
        />
        <meta name="twitter:image" content="https://kittyp.in/og-image.jpg" />
      </Helmet>

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12 md:mb-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-up">
              About <span className="text-primary">Kittyp</span>
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-up animate-delay-100">
              Creating eco-friendly cat litter solutions that are better for your pet, 
              your home, and our planet.
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
                  Kittyp was founded in 2020 by a team of pet lovers and environmental scientists who believed 
                  cat litter could be better – for cats, for homes, and for our planet.
                </p>
                <p className="text-muted-foreground mb-4">
                  After two years of research and development, we created a revolutionary plant-based cat litter 
                  that outperforms traditional clay litters while reducing environmental impact.
                </p>
                <p className="text-muted-foreground">
                  Today, we're proud to offer products that thousands of cat owners trust, helping to divert 
                  tons of clay litter from landfills every year.
                </p>
              </div>
              <div className="order-1 md:order-2 animate-fade-up animate-delay-100">
                <img 
                  src="https://images.unsplash.com/photo-1570824105192-a7bb72b73141?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" 
                  alt="Cat with Kittyp products" 
                  className="rounded-lg shadow-xl w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              Help clinics, veterinarians, and pet parents share one visit — from the front desk to the record that stays with the pet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {missionItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex h-full flex-col rounded-xl border border-border bg-card p-6"
                >
                  <div className="mb-5 w-fit rounded-full bg-accent p-3">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.content}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Team Section */}
        <section className="bg-kitty-50 dark:bg-kitty-900/20 py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Team</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Meet the passionate experts behind Kittyp's innovative products.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  name: "Rohan Srivastava",
                  role: "Founder & CEO",
                  image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                  bio: "Environmental scientist with a passion for sustainable pet products."
                },
                {
                  name: "Monis Hassan",
                  role: "Head of Product",
                  image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                  bio: "Pet industry veteran focused on creating innovative, eco-friendly solutions."
                },
                {
                  name: "Prerna Lal",
                  role: "Lead Researcher",
                  image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                  bio: "Biologist specializing in plant-based materials and biodegradability."
                },
                {
                  name: "James Park",
                  role: "Head of Sustainability",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                  bio: "Environmental advocate ensuring our products meet the highest eco standards."
                }
              ].map((member, index) => (
                <div 
                  key={index} 
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 transition-transform hover:scale-105"
                >
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-64 object-cover object-center"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {member.name}
                    </h3>
                    <p className="text-kitty-600 dark:text-kitty-400 mb-3">
                      {member.role}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground">
              How Kittyp is built: one visit, one pet, and a record the clinic can stand behind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-6"
                >
                  <div className="shrink-0 rounded-lg bg-accent p-2">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-muted py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">Visit Us</h2>
                <div className="flex items-start gap-3 mb-6">
                  <MapPin className="h-6 w-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Headquarters</h3>
                    <p className="text-foreground">Pune, Maharashtra, India</p>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
              <div className="aspect-video overflow-hidden rounded-lg bg-card shadow-lg">
                <iframe
                  src="https://maps.google.com/maps?q=Pune,%20Maharashtra,%20India&z=12&output=embed"
                  width="100%"
                  height="100%"
                  className="border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Kittyp Headquarters Location"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Bring your clinic workflow together with Kittyp.</h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Kittyp connects the appointment, the consultation, the invoice, and the record that stays with the pet.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <Link to={petParentSignup.to}>{petParentSignup.label}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <Link to={veterinarianSignup.to}>{veterinarianSignup.label}</Link>
              </Button>
              <Button asChild size="lg" className="w-full sm:w-auto bg-background text-foreground hover:bg-background/90">
                <Link to={clinicSignup.to}>{clinicSignup.label}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
