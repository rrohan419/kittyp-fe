import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/home/Hero';
import { ProductCard } from '@/components/ui/ProductCard';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  FileText,
  Heart,
  Receipt,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchFilteredProducts, ProductFilterRequest } from '@/services/productService';
import { ArticleSearchRequest, fetchArticles } from '@/services/articleService';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet';
import { isEcommerceEnabled } from '@/config/features';
import { PUBLIC_SIGNUP_PATHS } from '@/utils/roles';

const productDto: ProductFilterRequest = { isRandom: true, category: null, maxPrice: null, minPrice: null, name: null, status: null };
const articleDto: ArticleSearchRequest = { isRandom: true, name: null, articleStatus: 'PUBLISHED', tags: [] };

const capabilities = [
  {
    title: 'Front desk that actually moves',
    description:
      'Search owners by phone, book the slot, take a walk-in, and check the pet in — without a WhatsApp thread as the source of truth.',
    icon: CalendarClock,
  },
  {
    title: 'Consult once. Bill once.',
    description:
      'The visit is the centre of the day. Finish the consult and a draft invoice is ready for reception — no retyping clinical work into a blank bill.',
    icon: Stethoscope,
  },
  {
    title: 'Invoices clinics can hand over',
    description:
      'Collect payment, print or share a PDF, keep a GST-ready line. Reception closes the loop; the doctor stays in the chart.',
    icon: Receipt,
  },
  {
    title: 'Records that follow the pet',
    description:
      'The pet is the clinical subject. Owners keep a lifelong timeline — so history is not trapped when they change clinics or cities.',
    icon: Heart,
  },
];

const loopSteps = [
  {
    step: '01',
    title: 'Book or walk in',
    body: 'Reception finds the owner, adds the pet if needed, and parks them on today\'s list.',
    image: '/home/clinic-reception.png',
    imageAlt: 'Clinic reception with a pet parent and dog waiting at the front desk',
  },
  {
    step: '02',
    title: 'Chart the consult',
    body: 'The doctor works the visit — notes, vaccines, prescriptions — against that encounter, not a loose Excel row.',
    image: '/home/veterinarian.png',
    imageAlt: 'Veterinarian examining a cat on the clinic table',
  },
  {
    step: '03',
    title: 'Invoice and close',
    body: 'A draft bill is waiting. Reception adjusts, collects, and the owner leaves with a record — not a slip of paper that gets lost.',
    image: '/home/after-visit.png',
    imageAlt: 'Pet parents leaving the clinic with their dog after the visit',
  },
];

const audiences = [
  {
    icon: Building2,
    title: 'Clinics',
    body: 'Replace paper for a single consultation first. Appointments, clients, roster, and billing in one practice login.',
    to: PUBLIC_SIGNUP_PATHS[2].to,
    cta: 'Register your clinic',
    image: '/home/clinic-reception.png',
    imageAlt: 'Veterinary clinic reception desk',
  },
  {
    icon: UserRound,
    title: 'Veterinarians',
    body: 'Onboard with your own identity. Work independently or across practices without a second account for each clinic.',
    to: PUBLIC_SIGNUP_PATHS[1].to,
    cta: 'Join as a veterinarian',
    image: '/home/veterinarian.png',
    imageAlt: 'Veterinarian with a cat during a consult',
  },
  {
    icon: Heart,
    title: 'Pet parents',
    body: 'Book visits and keep vaccines, notes, and invoices on the pet — not scattered across clinics you no longer visit.',
    to: PUBLIC_SIGNUP_PATHS[0].to,
    cta: 'Create a pet parent account',
    image: '/home/pet-parent.png',
    imageAlt: 'Pet parent at home with a cat',
  },
];

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);

  const handleToggleFavorite = (uuid: string) => {
    setFavoriteProductIds((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      if (!isEcommerceEnabled()) {
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetchFilteredProducts({
          page: 1,
          size: 4,
          body: productDto,
        });
        setFeaturedProducts(response.data.models);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const blogPosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetchArticles({
          page: 1,
          size: 3,
          body: articleDto,
        });

        setFeaturedArticle(response.data.models);
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
    blogPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Kittyp — Veterinary clinic CRM for India</title>
        <meta
          name="description"
          content="Kittyp is the veterinary operating system for Indian clinics: appointments, consults, invoices, and a pet health record that stays with the pet."
        />
        <meta
          name="keywords"
          content="veterinary CRM, clinic software India, vet practice management, pet health records, veterinary invoices, clinic appointments"
        />
        <link rel="canonical" href="https://kittyp.in/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Kittyp — Veterinary clinic CRM for India" />
        <meta
          property="og:description"
          content="Replace paper for one consultation. Appointments, consults, invoices — history stays with the pet."
        />
        <meta property="og:url" content="https://kittyp.in/" />
        <meta property="og:image" content="https://kittyp.in/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kittyp — Veterinary clinic CRM for India" />
        <meta
          name="twitter:description"
          content="Clinic CRM for Indian veterinary practices. Book, chart, bill — keep the pet's record portable."
        />
        <meta name="twitter:image" content="https://kittyp.in/og-image.jpg" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Kittyp',
          url: 'https://kittyp.in/',
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Kittyp',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: 'https://kittyp.in/',
          description:
            'Veterinary clinic CRM for Indian practices: appointments, encounters, invoices, and pet-centric health records.',
        })}</script>
      </Helmet>
      <main className="pt-8">
        <Hero />

        <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-sm font-medium text-primary">Why clinics switch</span>
            <h2 className="mt-2 text-3xl font-bold text-foreground">
              Practice operations, not another spreadsheet
            </h2>
            <p className="mt-4 text-muted-foreground">
              Phase one is deliberately small: can a practice completely replace paper for one
              consultation? Everything else waits until that loop is daily habit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {capabilities.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex gap-5 bg-card p-7 rounded-2xl shadow-sm border border-border/60"
                  style={{ animationDelay: `${index * 80 + 200}ms` }}
                >
                  <div className="shrink-0 p-3 bg-accent rounded-full h-fit">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <span className="text-sm font-medium text-primary">The paper-replacement loop</span>
              <h2 className="mt-2 text-3xl font-bold text-foreground">
                One consultation, end to end
              </h2>
              <p className="mt-4 text-muted-foreground">
                Appointment → check-in → encounter → draft invoice → payment → PDF. Reception
                and the doctor share the same visit — they just do different work on it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loopSteps.map((item) => (
                <div key={item.step} className="relative">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 shadow-sm">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-sm font-bold tracking-widest text-primary">{item.step}</span>
                  <h3 className="mt-3 text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-sm font-medium text-primary">Who Kittyp is for</span>
            <h2 className="mt-2 text-3xl font-bold text-foreground">
              One account. The right door.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Clinics run the practice. Doctors practise across practices or independently. Pet
              parents keep visibility for life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              return (
                <div
                  key={audience.title}
                  className="flex flex-col bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={audience.image}
                      alt={audience.imageAlt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col flex-grow p-8">
                  <div className="p-3 bg-accent rounded-full w-fit mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{audience.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-grow">
                    {audience.body}
                  </p>
                  <Link
                    to={audience.to}
                    className="mt-6 inline-flex items-center text-primary hover:text-primary/90 font-medium text-sm"
                  >
                    {audience.cta}
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {isEcommerceEnabled() && (
          <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
              <div className="max-w-lg">
                <span className="text-sm font-medium text-primary">Shop</span>
                <h2 className="mt-2 text-3xl font-bold text-foreground">Pet products</h2>
                <p className="mt-4 text-muted-foreground">
                  Adjacent to the clinic — supplies for pet parents who already trust Kittyp for care.
              </p>
            </div>
            <Link
              to="/products"
              className="mt-6 md:mt-0 inline-flex items-center text-primary hover:text-primary/90 font-medium"
            >
              View all products
              <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={`home-product-card-product-uuid-${product.uuid}`}
                product={product}
                index={index}
                className="animate-fade-up"
                isFavorite={favoriteProductIds.includes(product.uuid)}
                onToggleFavorite={() => handleToggleFavorite(product.uuid)}
              />
            ))}
          </div>
        </section>
        )}

        <section className="py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
              <div className="max-w-lg">
                <span className="text-sm font-medium text-primary">From the journal</span>
                <h2 className="mt-2 text-3xl font-bold text-foreground">Practice &amp; pet care</h2>
                <p className="mt-4 text-muted-foreground">
                  Notes on running a clinic, keeping records honest, and caring for pets between visits.
                </p>
              </div>
              <Link
                to="/articles"
                className="mt-6 md:mt-0 inline-flex items-center text-primary hover:text-primary/90 font-medium"
              >
                View all articles
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>

            {featuredArticle.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredArticle.map((post, index) => (
                <Link
                  key={`post.id-${post.slug}`}
                  to={`/article/${post.slug}`}
                  className={cn(
                      'group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300'
                  )}
                  style={{ animationDelay: `${index * 100 + 200}ms` }}
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                        src={post.coverImage || '/home/pet-parent.png'}
                      alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-sm text-muted-foreground">{post.date}</span>
                    <h3 className="mt-2 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                      <p className="mt-3 text-muted-foreground">{post.excerpt}</p>
                    <div className="mt-4 inline-flex items-center text-primary font-medium">
                      Read more
                        <ArrowRight
                          size={14}
                          className="ml-1 transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </div>
                  </div>
                </Link>
              ))}
            </div>
            ) : (
              !isLoading && (
                <p className="text-muted-foreground text-sm">New articles will show up here.</p>
              )
            )}
          </div>
        </section>

        <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-accent rounded-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 bg-noise" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 md:p-12 lg:p-16 items-center">
              <div className="space-y-6">
                <span className="text-sm font-medium text-primary">Start with one practice</span>
                <h2 className="text-3xl font-bold text-foreground">
                  Ready to put the paper away?
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Register the clinic, invite doctors, and run tomorrow&apos;s first consult on
                  Kittyp. Pet parents and visiting vets join the same graph — with their own login.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/signup/clinic-admin"
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 font-semibold transition-colors"
                  >
                    Register your clinic
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center px-6 py-3 bg-background text-foreground rounded-full hover:bg-background/80 font-medium transition-colors"
                  >
                    Talk to us
                  </Link>
                </div>
              </div>
              <div className="relative">
                <img
                  src="/home/after-visit.png"
                  alt="Pet parents leaving the clinic with their dog after a paid visit"
                  className="rounded-2xl shadow-lg object-cover w-full aspect-[16/10] max-h-80"
                  loading="lazy"
                />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-background/90 backdrop-blur-sm border border-border p-4 shadow-sm">
                  <FileText className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm font-semibold text-foreground">Owner walks out with a PDF</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    The visit is closed, the bill is paid, and the record sits on the pet — not in a
                    cupboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
