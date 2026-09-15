import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const plans = [
  {
    name: 'Pilot',
    price: '₹0',
    period: '/ 21 days',
    blurb: 'Try Kittyp with your real clinic workflow — no card required.',
    highlights: [
      'Appointments & front desk',
      'Doctor charts & pet records',
      'Invoices (PDF)',
      'Staff & doctor invites',
    ],
    cta: 'Start pilot',
    to: '/signup/clinic-admin',
    featured: false,
  },
  {
    name: 'Starter',
    price: '₹1,999',
    period: '/ mo',
    blurb: 'Single-location practices leaving paper behind.',
    highlights: [
      'Everything in Pilot',
      'Unlimited appointments',
      'GST-ready invoices',
      'WhatsApp invitations & receipts',
      'Email support',
    ],
    cta: 'Register your clinic',
    to: '/signup/clinic-admin',
    featured: false,
  },
  {
    name: 'Clinic',
    price: '₹3,999',
    period: '/ mo',
    blurb: 'Growing clinics with multiple doctors on the floor.',
    highlights: [
      'Everything in Starter',
      'Multi-doctor roster',
      'Branch switcher',
      'Priority support',
    ],
    cta: 'Register your clinic',
    to: '/signup/clinic-admin',
    featured: true,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pricing — Kittyp</title>
        <meta
          name="description"
          content="Kittyp clinic CRM pricing in INR: Pilot ₹0/21d, Starter ₹1999/mo, Clinic ₹3999/mo. Pet parents are free."
        />
        <link rel="canonical" href="https://kittyp.in/pricing" />
      </Helmet>

      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12 md:mb-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Pricing</h1>
            <p className="text-lg text-muted-foreground">
              Monetize clinics. Pet parents book and pay invoices for free. All prices INR.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  plan.featured ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
                }`}
              >
                <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  {plan.period ? (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  ) : null}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{plan.blurb}</p>
                <ul className="mt-6 space-y-2 flex-1">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      {h}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={plan.featured ? 'default' : 'outline'}>
                  <Link to={plan.to}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
            Doctors joining a clinic or running personal practice are included with the clinic plan.
            Pet parent accounts stay free.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
