import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CalendarClock, FileText, Heart, PawPrint, Receipt, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PUBLIC_SIGNUP_PATHS } from '@/utils/roles';

const petParentSignup = PUBLIC_SIGNUP_PATHS[0];
const veterinarianSignup = PUBLIC_SIGNUP_PATHS[1];
const clinicSignup = PUBLIC_SIGNUP_PATHS[2];

const buildingItems = [
  {
    icon: CalendarClock,
    title: 'A Smoother Clinic Workflow',
    content: 'Bring appointments, walk-ins, check-ins, and daily clinic operations into one organised workflow.',
  },
  {
    icon: Receipt,
    title: 'Connected Consultations and Billing',
    content:
      'Connect consultations, treatment details, invoices, and payments so clinic teams can manage a visit with less duplicate work.',
  },
  {
    icon: Heart,
    title: 'Healthcare Records Built Around the Pet',
    content:
      'Keep medical notes, vaccination history, and visit records organised around the pet, helping care teams build on previous visits.',
  },
  {
    icon: FileText,
    title: 'Better Visibility for Pet Parents',
    content:
      "Help pet parents stay informed about appointments, healthcare records, and the next steps in their pets' care.",
  },
] as const;

const values = [
  {
    icon: PawPrint,
    title: 'Pet First',
    content:
      'The pet is at the centre of the healthcare journey. Records and care should be organised around the patient, not scattered across disconnected processes.',
  },
  {
    icon: Stethoscope,
    title: 'Simplicity in Everyday Work',
    content:
      'Technology should reduce administrative friction. We aim to make essential workflows practical for veterinarians and clinic teams.',
  },
  {
    icon: FileText,
    title: 'Connected Care',
    content:
      'Appointments, consultations, billing, and medical history are parts of one healthcare journey. We build to bring those parts closer together.',
  },
  {
    icon: Receipt,
    title: 'Transparency and Trust',
    content:
      'Clear records and accessible information can help clinics and pet parents understand what happened during a visit and what comes next.',
  },
] as const;

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About Kittyp | Built for Vets. Designed Around Pets.</title>
        <meta
          name="description"
          content="Kittyp is building a more connected way to manage veterinary healthcare, bringing clinics, veterinarians, and pet parents together around what matters most: the pet."
        />
        <link rel="canonical" href="https://kittyp.in/about" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="About Kittyp | Built for Vets. Designed Around Pets." />
        <meta
          property="og:description"
          content="A more connected way to manage veterinary healthcare, bringing clinics, veterinarians, and pet parents together around the pet."
        />
        <meta property="og:url" content="https://kittyp.in/about" />
        <meta property="og:image" content="https://kittyp.in/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Kittyp | Built for Vets. Designed Around Pets." />
        <meta
          name="twitter:description"
          content="A more connected way to manage veterinary healthcare, bringing clinics, veterinarians, and pet parents together around the pet."
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
              Built for Vets. Designed Around Pets.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground animate-fade-up animate-delay-100">
              We're building a more connected way to manage veterinary healthcare — bringing clinics,
              veterinarians, and pet parents together around what matters most: the pet.
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="bg-muted">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
              <img
                src="https://kittyp-site-images.s3.ap-south-1.amazonaws.com/pokey.png"
                alt="Pokey, featured alongside the Kittyp story"
                className="h-auto w-full max-w-md rounded-2xl object-contain shadow-sm"
              />
            </div>
            <div className="flex items-center px-4 py-12 sm:px-8 sm:py-16 lg:px-14 lg:py-20">
              <div className="mx-auto w-full max-w-xl">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Our Story</h2>
                <h3 className="mt-4 text-xl font-semibold text-foreground">
                  Better Care Begins with a Better Way.
                </h3>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                  <p>
                    Every pet has a healthcare journey. Every veterinarian has a responsibility to provide
                    the best possible care. And every clinic has a daily operation to manage alongside it.
                  </p>
                  <p>
                    But appointments, consultations, medical records, invoices, and follow-ups can become
                    disconnected across different processes and tools.
                  </p>
                  <p>
                    We started Kittyp with a simple belief:{' '}
                    <strong className="font-semibold text-foreground">
                      technology should make veterinary care easier to manage, not more complicated.
                    </strong>
                  </p>
                  <p>
                    Kittyp brings essential clinic workflows together, helping veterinary professionals
                    manage their day-to-day operations while giving pet parents better visibility into
                    their pets' healthcare.
                  </p>
                  <p>
                    We're building around the pet — so healthcare information can remain organised across
                    visits, and every new consultation can build on the history that came before it.
                  </p>
                  <p className="font-semibold text-foreground">
                    Because better-managed care creates more room for what matters most: caring for pets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-xl font-semibold leading-relaxed text-foreground">
              To make veterinary healthcare more connected, organised, and transparent for everyone involved.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              We want to help veterinary professionals spend less time managing disconnected workflows and
              give pet parents a clearer view of their pets' healthcare journey.
            </p>
          </div>
        </section>

        <section className="bg-muted py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold text-foreground">What We're Building</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {buildingItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
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
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">What Guides Us</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
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
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Our Team</h2>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                Kittyp is being built by a team that believes technology can improve the way veterinary
                care is managed and experienced.
              </p>
            </div>

            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { name: 'Rohan Shrivastava', role: 'Founder', initials: 'RS' },
                { name: 'Swapnil Wankhede', role: 'Co-Founder', initials: 'SW' },
              ].map((member) => (
                <div
                  key={member.name}
                  className="flex items-center gap-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
                >
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground"
                    aria-hidden="true"
                  >
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">{member.role}</p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{member.name}</h3>
                  </div>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center leading-relaxed text-muted-foreground">
              We're working to turn that belief into practical tools for veterinary professionals and
              better-connected experiences for pet parents.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Our Vision</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              We envision a future where every pet's healthcare journey is easier to understand, every
              veterinarian has better tools to deliver care, and every clinic can manage its work with
              greater clarity.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              We're starting with the everyday workflows of veterinary practices and working toward a
              more connected pet healthcare ecosystem.
            </p>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Let's Build Better Care Together</h2>
            <p className="text-lg text-primary-foreground/90 mb-4 max-w-3xl mx-auto">
              We're working with veterinary professionals to understand their challenges and build Kittyp
              around real clinic workflows.
            </p>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Whether you're a veterinarian, clinic owner, or pet parent, we'd love to connect.
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
