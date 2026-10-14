import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  Clock,
  FileText,
  HeartPulse,
  LayoutDashboard,
  MessageCircle,
  Package,
  PawPrint,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  User,
  UserRound,
  Users,
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isEcommerceEnabled } from '@/config/features';
import { cn } from '@/lib/utils';
import { fadeIn, fadeUp, staggerContainer } from '@/utils/animations';

type RoleId = 'user' | 'doctor' | 'clinic';

type Step = {
  icon: LucideIcon;
  title: string;
  body: string;
};

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const quickEase: [number, number, number, number] = [0.19, 1, 0.22, 1];

const userFlow: Step[] = [
  { icon: User, title: 'Create Account', body: 'Sign up for Kittyp.' },
  { icon: PawPrint, title: 'Add Your Pet', body: 'Add your pet and a few details.' },
  { icon: Calendar, title: 'Book Appointment', body: 'Pick a doctor or clinic and a time.' },
  { icon: Stethoscope, title: 'Visit Doctor', body: 'Meet the doctor for the visit.' },
  { icon: FileText, title: 'View Records', body: "Find the visit on your pet's page later." },
];

const doctorFlow: Step[] = [
  { icon: User, title: 'Sign Up', body: 'Create your doctor account.' },
  { icon: Stethoscope, title: 'Complete Profile', body: 'Add your practice details.' },
  { icon: Clock, title: 'Set Availability', body: 'Choose when you can see pets.' },
  { icon: Calendar, title: 'Manage Appointments', body: 'See who is coming in.' },
  { icon: Users, title: 'Manage Patients', body: 'Keep track of the pets you see.' },
  { icon: FileText, title: 'Complete Visits', body: 'Finish the visit and save the notes.' },
];

const clinicFlow: Step[] = [
  { icon: Building2, title: 'Register Clinic', body: 'Create your clinic on Kittyp.' },
  { icon: Users, title: 'Add Doctors & Staff', body: 'Invite the people who work with you.' },
  { icon: Calendar, title: 'Manage Appointments', body: 'Booked visits and walk-ins.' },
  { icon: PawPrint, title: 'Manage Clients & Patients', body: 'Pets and the people who bring them.' },
  { icon: LayoutDashboard, title: 'Run Your Clinic', body: 'Look after the day from one place.' },
];

const userStart: Step[] = [
  { icon: User, title: 'Create your account', body: 'Sign up for Kittyp.' },
  { icon: PawPrint, title: 'Add your pet', body: 'Add your pet and basic details.' },
  { icon: Calendar, title: 'Start using Kittyp', body: "Book appointments and manage your pet's information." },
];

const doctorStart: Step[] = [
  { icon: User, title: 'Sign up as a doctor', body: 'Create your doctor account.' },
  { icon: Stethoscope, title: 'Complete your practice profile', body: 'Add the details people will see.' },
  { icon: Clock, title: 'Set your availability', body: 'Choose the times you can see pets.' },
  { icon: Users, title: 'Accept a clinic invitation or work independently', body: 'Join a clinic, or see pets on your own.' },
  { icon: FileText, title: 'Start managing visits', body: 'Open a visit and finish it.' },
];

const clinicStart: Step[] = [
  { icon: Building2, title: 'Register your clinic', body: 'Create your clinic account.' },
  { icon: FileText, title: 'Complete the clinic information', body: 'Add your clinic name and details.' },
  { icon: Users, title: 'Invite doctors and staff', body: 'Ask your team to join.' },
  { icon: Calendar, title: 'Manage appointments and walk-ins', body: 'Booked visits and people who walk in.' },
  { icon: LayoutDashboard, title: 'Run your daily clinic operations', body: 'Use Kittyp to run the day.' },
];

const bookSteps = [
  'Open Appointments.',
  'Choose a doctor or clinic.',
  'Select your pet.',
  'Choose a date and time.',
  'Confirm your appointment.',
];

const afterVisit = [
  'Visit history',
  'Health information',
  'Prescriptions',
  'Vaccines',
  'Invoice',
  'Payment',
];

const petFacts = ['Name', 'Type', 'Breed', 'Age', 'Weight', 'Photo', 'Health notes'];

const finders: { icon: LucideIcon; prompt: string; place: string }[] = [
  { icon: PawPrint, prompt: 'See my pet', place: 'My Pets' },
  { icon: Calendar, prompt: 'Book a visit', place: 'Appointments' },
  { icon: HeartPulse, prompt: 'Check health information', place: 'Health' },
  { icon: FileText, prompt: 'Learn about pet care', place: 'Articles' },
  { icon: UserRound, prompt: 'Change my account details', place: 'Profile' },
];

const userFeatures: Feature[] = [
  { icon: Calendar, title: 'Appointments', body: 'See upcoming visits and book a new one.' },
  { icon: PawPrint, title: 'My Pets', body: "Keep each pet's details in one place." },
  { icon: HeartPulse, title: 'Health', body: 'Open a pet to see visits, vaccines, and notes.' },
  { icon: Apple, title: 'Nutrition', body: 'Follow a feeding plan and log meals.' },
  { icon: FileText, title: 'Articles', body: 'Read simple pet care articles.' },
  { icon: Bell, title: 'Reminders', body: 'Get a nudge for visits, vaccines, and checkups.' },
  { icon: UserRound, title: 'Profile', body: 'Update your account.' },
];

const shopFeatures: Feature[] = [
  { icon: ShoppingCart, title: 'Cart', body: 'Items you plan to buy.' },
  { icon: ShoppingBag, title: 'Orders', body: 'Orders you have placed.' },
];

const doctorFeatures: Feature[] = [
  { icon: LayoutDashboard, title: 'Dashboard', body: "See today's visits." },
  { icon: Calendar, title: 'Appointments', body: 'Open and update visits.' },
  { icon: Clock, title: 'Availability', body: 'Choose when you can see pets.' },
  { icon: Users, title: 'Patients', body: 'Pets you have seen.' },
  { icon: PawPrint, title: 'Clients', body: 'The pet parents you care for.' },
  { icon: Apple, title: 'Nutrition', body: 'Write a feeding plan.' },
  { icon: FileText, title: 'Blog', body: 'Share a short article.' },
  { icon: Receipt, title: 'Invoices', body: 'Send a bill for a visit.' },
  { icon: MessageCircle, title: 'WhatsApp', body: 'Connect WhatsApp for your practice.' },
  { icon: Settings, title: 'Settings', body: 'Update your practice details.' },
];

const clinicFeatures: Feature[] = [
  { icon: LayoutDashboard, title: 'Dashboard', body: "See today's clinic schedule." },
  { icon: Calendar, title: 'Appointments', body: 'Manage booked visits and walk-ins.' },
  { icon: PawPrint, title: 'Clients', body: 'Pets and the people who bring them.' },
  { icon: Stethoscope, title: 'Doctors', body: 'Doctors who work at your clinic.' },
  { icon: Package, title: 'Inventory', body: 'Keep track of clinic stock.' },
  { icon: Users, title: 'Staff', body: 'Add the people who help run the clinic.' },
  { icon: FileText, title: 'Articles', body: 'Share clinic articles.' },
  { icon: Receipt, title: 'Billing', body: 'Bills and payments.' },
  { icon: MessageCircle, title: 'WhatsApp', body: 'Connect WhatsApp for the clinic.' },
  { icon: Settings, title: 'Settings', body: 'Update clinic details.' },
];

const petNodes: { icon: LucideIcon; label: string }[] = [
  { icon: Calendar, label: 'Visits' },
  { icon: HeartPulse, label: 'Health' },
  { icon: FileText, label: 'Records' },
];

const ctas: Record<RoleId, { title: string; body: string; button: string; to: string }> = {
  user: {
    title: "Ready to manage your pet's care?",
    body: 'Create your Kittyp account and get started.',
    button: 'Get Started',
    to: '/signup',
  },
  doctor: {
    title: 'Ready to manage your practice?',
    body: 'Create your doctor account and set your schedule.',
    button: 'Create Doctor Account',
    to: '/signup/doctor',
  },
  clinic: {
    title: 'Ready to manage your clinic?',
    body: 'Register your clinic and invite your team.',
    button: 'Register Your Clinic',
    to: '/signup/clinic-admin',
  },
};

const tabClass =
  'rounded-full py-2 text-base text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm';

function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-32px' }}
      transition={{ duration: 0.35, ease: quickEase }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
      {children}
    </h2>
  );
}

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative flex flex-col lg:flex-row lg:items-start">
      <div
        className="absolute bottom-4 left-6 top-6 w-px bg-primary/50 dark:bg-primary/40 lg:bottom-auto lg:left-10 lg:right-10 lg:top-6 lg:h-px lg:w-auto"
        aria-hidden
      />
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <li
            key={step.title}
            className="relative flex min-w-0 flex-1 gap-4 pb-5 last:pb-0 lg:flex-col lg:items-center lg:px-1.5 lg:pb-0 lg:text-center"
          >
            <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-white text-primary dark:border-primary/30 dark:bg-secondary">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 pt-1 lg:pt-3">
              <p className="text-sm font-semibold text-primary">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-0.5 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-base leading-relaxed text-foreground/80">{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StartWithKittyp({ role, steps }: { role: RoleId; steps: Step[] }) {
  const cta = ctas[role];
  return (
    <section
      aria-labelledby={`${role}-start-here`}
      className="rounded-2xl border border-border bg-white px-4 py-4 shadow-sm dark:border-primary/30 dark:bg-secondary dark:shadow-none sm:px-5"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          <h2 id={`${role}-start-here`} className="text-xl font-bold tracking-tight text-foreground dark:font-semibold sm:text-2xl">
            Start with Kittyp
          </h2>
          <ol className="relative mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
            <div
              className="absolute bottom-3 left-4 top-4 w-px bg-primary/40 lg:bottom-auto lg:left-8 lg:right-8 lg:top-4 lg:h-px lg:w-auto"
              aria-hidden
            />
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="relative flex min-w-0 flex-1 gap-3 lg:flex-col lg:items-center lg:px-1 lg:text-center"
                >
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-primary dark:border-primary/30 dark:bg-secondary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 lg:pt-2">
                    <p className="text-sm font-semibold text-primary">{String(index + 1).padStart(2, '0')}</p>
                    <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="text-base leading-snug text-foreground/80">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <Button asChild className="shrink-0 self-start xl:self-center">
          <Link to={cta.to}>{cta.button}</Link>
        </Button>
      </div>
    </section>
  );
}

function StepCards({ steps }: { steps: Step[] }) {
  return (
    <ol className={cn('grid gap-3', steps.length > 3 ? 'sm:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-3')}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <li key={step.title}>
            <article className="h-full rounded-lg border border-border bg-white px-3 py-3 shadow-sm dark:border-border/70 dark:bg-secondary/70 dark:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary dark:bg-background/70">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-xl font-semibold text-foreground/40 dark:text-foreground/30">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-base leading-snug text-foreground/80">{step.body}</p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

function FeatureGrid({ features }: { features: Feature[] }) {
  const reduce = useReducedMotion();
  const cards = features.map((feature) => {
    const Icon = feature.icon;
    const card = (
      <>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary dark:bg-background/60">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h3 className="mt-2 text-base font-semibold text-foreground">{feature.title}</h3>
        <p className="mt-0.5 text-base leading-snug text-foreground/80">{feature.body}</p>
      </>
    );
    const className =
      'h-full rounded-lg border border-border bg-white px-3 py-3 shadow-sm dark:border-border/60 dark:bg-secondary/60 dark:shadow-none';
    if (reduce) {
      return (
        <article key={feature.title} className={className}>
          {card}
        </article>
      );
    }
    return (
      <motion.article
        key={feature.title}
        variants={fadeUp}
        transition={{ duration: 0.3, ease: quickEase }}
        className={className}
      >
        {card}
      </motion.article>
    );
  });

  if (reduce) {
    return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>;
  }

  return (
    <motion.div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      variants={staggerContainer(0.05)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-24px' }}
    >
      {cards}
    </motion.div>
  );
}

function PetCluster() {
  return (
    <div className="mx-auto w-full max-w-sm text-center">
      <PawPrint className="mx-auto h-7 w-7 text-primary" aria-hidden />
      <p className="mt-1 text-base font-semibold text-foreground">Your Pet</p>
      <ul className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-white shadow-sm dark:border-border/80 dark:bg-transparent dark:shadow-none">
        {petNodes.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className="border-r border-border px-2 py-2.5 last:border-r-0 dark:border-border/80">
              <Icon className="mx-auto h-4 w-4 text-primary dark:text-primary/80" aria-hidden />
              <p className="mt-1 text-base font-medium text-foreground dark:font-normal">{item.label}</p>
            </li>
          );
        })}
      </ul>
      <div className="mx-auto mt-2 h-4 w-px bg-primary/40" aria-hidden />
      <p className="text-base font-medium text-foreground">Appointments</p>
      <div className="mx-auto mt-1 h-4 w-px bg-primary/40" aria-hidden />
      <p className="text-base font-medium text-foreground">Invoice</p>
      <p className="mt-3 text-base leading-relaxed text-foreground/80">Everything stays connected to your pet.</p>
    </div>
  );
}

function ClosingCta({ role }: { role: RoleId }) {
  const cta = ctas[role];
  return (
    <section className="rounded-2xl border border-border bg-white px-5 py-6 text-center shadow-sm dark:bg-secondary dark:shadow-none">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{cta.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-foreground/80">{cta.body}</p>
      <Button asChild size="lg" className="mt-5">
        <Link to={cta.to}>{cta.button}</Link>
      </Button>
    </section>
  );
}

function UserGuide({ ecommerceOn }: { ecommerceOn: boolean }) {
  const features = ecommerceOn ? [...userFeatures, ...shopFeatures] : userFeatures;
  return (
    <div className="space-y-8">
      <StartWithKittyp role="user" steps={userStart} />

      <Reveal>
        <section aria-labelledby="how-kittyp-works">
          <SectionTitle id="how-kittyp-works">How Kittyp Works</SectionTitle>
          <div className="mt-6">
            <Timeline steps={userFlow} />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="pet-information" className="grid items-center gap-6 lg:grid-cols-2">
          <div>
            <SectionTitle id="pet-information">Your Pet&apos;s Information</SectionTitle>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-foreground/80">
              My Pets keeps your pet&apos;s information in one place, so you can easily find it when you need it.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {petFacts.map((item) => (
                <li key={item} className="rounded-full border border-border bg-white px-3 py-1 text-base text-foreground/80 dark:border-border/70 dark:bg-transparent">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <PetCluster />
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="getting-started">
          <SectionTitle id="getting-started">Getting Started</SectionTitle>
          <div className="mt-5">
            <StepCards steps={userStart} />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="book-appointment">
          <SectionTitle id="book-appointment">Book an Appointment</SectionTitle>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {bookSteps.map((step, index) => (
              <li key={step} className="rounded-xl border border-border bg-white px-3 py-3 shadow-sm dark:bg-secondary dark:shadow-none">
                <p className="text-lg font-semibold text-primary">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-1 text-base font-medium text-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="after-visit">
          <SectionTitle id="after-visit">After Your Visit</SectionTitle>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-foreground/80">
            After your visit, information from the consultation can remain connected to your pet so you can find it later.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {afterVisit.map((item) => (
              <li key={item} className="rounded-full border border-border/50 px-3 py-1 text-base text-foreground/80 dark:border-border/60">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="where-to-find">
          <SectionTitle id="where-to-find">What do you want to do?</SectionTitle>
          <ul className="mt-5 grid gap-2">
            {finders.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.place}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm transition-colors hover:bg-secondary/70 dark:bg-secondary dark:shadow-none dark:hover:bg-background"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary dark:bg-background">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="min-w-0 text-left text-base text-foreground/80">{item.prompt}</p>
                  </div>
                  <p className="flex shrink-0 items-center gap-2 text-base font-semibold text-foreground">
                    {item.place}
                    <ArrowRight
                      className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                      aria-hidden
                    />
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="other-features">
          <SectionTitle id="other-features">Other Features</SectionTitle>
          <div className="mt-5">
            <FeatureGrid features={features} />
          </div>
        </section>
      </Reveal>

      <ClosingCta role="user" />
    </div>
  );
}

function PracticeGuide({
  role,
  title,
  steps,
  start,
  features,
  note,
}: {
  role: 'doctor' | 'clinic';
  title: string;
  steps: Step[];
  start: Step[];
  features: Feature[];
  note?: string;
}) {
  return (
    <div className="space-y-8">
      <StartWithKittyp role={role} steps={start} />

      <Reveal>
        <section aria-labelledby={`${role}-how`}>
          <SectionTitle id={`${role}-how`}>{title}</SectionTitle>
          <div className="mt-6">
            <Timeline steps={steps} />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby={`${role}-start`}>
          <SectionTitle id={`${role}-start`}>Getting Started</SectionTitle>
          <div className="mt-5">
            <StepCards steps={start} />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby={`${role}-features`}>
          <SectionTitle id={`${role}-features`}>Main Features</SectionTitle>
          <div className="mt-5">
            <FeatureGrid features={features} />
          </div>
          {note && <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80">{note}</p>}
        </section>
      </Reveal>

      <ClosingCta role={role} />
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div>{children}</div>;
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ duration: 0.28, ease: quickEase }}>
      {children}
    </motion.div>
  );
}

export default function Guide() {
  const [role, setRole] = useState<RoleId>('user');
  const ecommerceOn = isEcommerceEnabled();

  return (
    <div className="bg-background">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/[0.06] to-transparent dark:from-primary/10" aria-hidden />
        <header className="relative container mx-auto px-4 pb-8 pt-6 text-center sm:px-6 sm:pt-8 lg:px-8">
          <PawPrint className="pointer-events-none absolute left-1/2 top-4 h-28 w-28 -translate-x-1/2 text-primary/10" aria-hidden />
          <h1 className="relative text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">How to use Kittyp</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-foreground sm:text-xl">
            Manage your pet&apos;s care in one place.
          </p>
          <p className="mx-auto mt-2 max-w-lg text-base leading-relaxed text-foreground/80">
            Book visits, manage your pet and find important information easily.
          </p>
          <p className="mt-4 text-base font-semibold text-foreground">Who are you?</p>

          <Tabs value={role} onValueChange={(value) => setRole(value as RoleId)} className="mt-3">
            <TabsList className="mx-auto grid h-auto w-full max-w-md grid-cols-3 rounded-full border border-border bg-white p-1 dark:bg-secondary">
              <TabsTrigger value="user" className={tabClass}>
                User
              </TabsTrigger>
              <TabsTrigger value="doctor" className={tabClass}>
                Doctor
              </TabsTrigger>
              <TabsTrigger value="clinic" className={tabClass}>
                Clinic
              </TabsTrigger>
            </TabsList>

            <div className="mx-auto mt-6 max-w-6xl text-left">
              <TabsContent value="user" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Panel>
                  <UserGuide ecommerceOn={ecommerceOn} />
                </Panel>
              </TabsContent>
              <TabsContent value="doctor" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Panel>
                  <PracticeGuide
                    role="doctor"
                    title="How it works"
                    steps={doctorFlow}
                    start={doctorStart}
                    features={doctorFeatures}
                  />
                </Panel>
              </TabsContent>
              <TabsContent value="clinic" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Panel>
                  <PracticeGuide
                    role="clinic"
                    title="How it works"
                    steps={clinicFlow}
                    start={clinicStart}
                    features={clinicFeatures}
                    note="Clinic staff can see appointments, clients, doctors, and billing based on their access."
                  />
                </Panel>
              </TabsContent>
            </div>
          </Tabs>
        </header>
      </div>
      <Footer />
    </div>
  );
}
