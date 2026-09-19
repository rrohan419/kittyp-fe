import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { isEcommerceEnabled } from '@/config/features';

const Sitemap = () => {
  const ecommerceOn = isEcommerceEnabled();

  const sitemapSections = [
    {
      title: 'Main Pages',
      links: [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Articles', path: '/articles' },
        { name: 'Contact Us', path: '/contact' },
      ],
    },
    {
      title: 'Get Started',
      links: [
        { name: 'Log in', path: '/login' },
        { name: 'Sign up', path: '/signup' },
        { name: 'Sign up as pet parent', path: '/signup/parent' },
        { name: 'Sign up as doctor', path: '/signup/doctor' },
        { name: 'Sign up as clinic admin', path: '/signup/clinic-admin' },
        { name: 'Forgot password', path: '/forgot-password' },
      ],
    },
    ...(ecommerceOn
      ? [
          {
            title: 'Shop',
            links: [
              { name: 'All Products', path: '/products' },
              { name: 'How to Use', path: '/how-to-use' },
              { name: 'Why Eco Litter', path: '/why-eco-litter' },
              { name: 'Cart', path: '/cart' },
              { name: 'Checkout', path: '/checkout' },
            ],
          },
        ]
      : []),
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
        { name: 'Sitemap', path: '/sitemap' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
              Sitemap
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-12 text-center">
              Find public pages on Kittyp organised by category
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sitemapSections.map((section, index) => (
                <Card key={`site-map-section-index-${index}`} className="h-full">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                    <Separator className="mb-4" />
                    <ul className="space-y-3">
                      {section.links.map((link, linkIndex) => (
                        <li key={`site-map-link-index-${linkIndex}`}>
                          <Link
                            to={link.path}
                            className="text-kitty-1600 dark:text-white hover:text-kitty-800 dark:hover:text-primary/90 transition-colors"
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                Need help finding something?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Visit our{' '}
                <Link to="/contact" className="text-kitty-600 dark:text-kitty-400 hover:underline">
                  contact page
                </Link>{' '}
                or email us at{' '}
                <a
                  href="mailto:contact@kittyp.in"
                  className="text-kitty-600 dark:text-kitty-400 hover:underline"
                >
                  contact@kittyp.in
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sitemap;
