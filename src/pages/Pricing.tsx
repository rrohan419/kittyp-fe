import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const plans = [
  {
    name: 'Clinic',
    price: 'Custom',
    blurb: 'For single-location practices ready to leave paper behind.',
    highlights: [
      'Appointments & front desk',
      'Doctor consults & pet records',
      'GST-ready invoices & WhatsApp receipts',
      'Staff & doctor invites',
    ],
    cta: 'Register your clinic',
    to: '/signup/clinic-admin',
    featured: true,
  },
  {
    name: 'Doctor',
    price: 'Included',
    blurb: 'Personal practice or join clinics without a second identity.',
    highlights: [
      'Online & in-clinic availability',
      'Patient history on the pet',
      'Invoices for personal practice',
      'Works across affiliated clinics',
    ],
    cta: 'Sign up as doctor',
    to: '/signup/doctor',
    featured: false,
  },
  {
    name: 'Pet parent',
    price: 'Free',
    blurb: 'Book visits and keep lifelong records with your pets.',
    highlights: [
      'Book appointments',
      'Vaccines & visit timeline',
      'Invoices in one place',
      'History that moves with the pet',
    ],
    cta: 'Sign up as pet parent',
    to: '/signup/parent',
    featured: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pricing — Kittyp</title>
        <meta
          name="description"
          content="Kittyp pricing for veterinary clinics, doctors, and pet parents in India."
        />
        <link rel="canonical" href="https://kittyp.in/pricing" />
      </Helmet>

      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12 md:mb-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              Start with the role that fits you. Clinic plans are tailored to your practice —
              talk to us and we&apos;ll set you up.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-xl border p-6 ${
                  plan.featured
                    ? 'border-primary/40 bg-primary/5 shadow-sm'
                    : 'border-border bg-card'
                }`}
              >
                <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{plan.price}</p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.blurb}</p>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 w-full" variant={plan.featured ? 'default' : 'outline'} asChild>
                  <Link to={plan.to}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted-foreground">
            Need a multi-branch rollout or a walkthrough?{' '}
            <Link to="/contact" className="text-primary hover:underline">
              Contact us
            </Link>{' '}
            or email{' '}
            <a href="mailto:support@kittyp.in" className="text-primary hover:underline">
              support@kittyp.in
            </a>
            .
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
