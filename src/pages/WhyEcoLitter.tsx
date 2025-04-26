import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Leaf, Recycle, Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const WhyEcoLitter = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      <main className="pt-24">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl mb-16">
            <div className="absolute inset-0 bg-gradient-to-r from-kitty-900/90 to-kitty-600/90 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1517458047551-6766fa5a9427?w=1200&auto=format&fit=crop&q=80" 
              alt="Cat with eco-friendly litter" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 px-8 py-16 md:py-24 md:px-16 max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Why Choose Eco-Friendly Cat Litter?
              </h1>
              <p className="text-lg text-white/90 mb-8">
                Our commitment to sustainable cat care doesn't compromise on performance. Discover why thousands of cat owners are making the switch to our eco-friendly litter.
              </p>
              <Link to="/products">
                <Button className="bg-white text-kitty-700 hover:bg-gray-100">
                  Shop Eco Litter
                </Button>
              </Link>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Benefits for Your Cat, Your Home, and Our Planet
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our eco-friendly cat litter offers multiple advantages over traditional clay litter
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <Leaf className="h-10 w-10 text-kitty-600" />,
                  title: "Eco-Friendly Materials",
                  description: "Made from renewable plant resources that are biodegradable and compostable, reducing landfill waste."
                },
                {
                  icon: <Shield className="h-10 w-10 text-kitty-600" />,
                  title: "Healthier for Cats",
                  description: "Dust-free formula that's gentler on sensitive paws and respiratory systems than clay litters."
                },
                {
                  icon: <Sparkles className="h-10 w-10 text-kitty-600" />,
                  title: "Superior Odor Control",
                  description: "Natural formulas that trap and neutralize odors better than traditional clay litters."
                },
                {
                  icon: <Recycle className="h-10 w-10 text-kitty-600" />,
                  title: "Sustainable Packaging",
                  description: "Packaged in recycled and recyclable materials to minimize environmental impact."
                }
              ].map((benefit, index) => (
                <div 
                  key={`eco-litter-benefit-index-no-${index}`}
                  className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800"
                >
                  <div className="mb-4 p-3 bg-kitty-50 dark:bg-kitty-900/30 rounded-full">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="bg-kitty-50 dark:bg-kitty-900/20 rounded-2xl p-8 md:p-12 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Environmental Impact
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Traditional clay cat litter is strip-mined, non-biodegradable, and contributes millions of tons to landfills annually. By switching to our eco-friendly alternatives, you're making a significant positive impact:
                </p>
                <ul className="space-y-4">
                  {[
                    "Reduces strip mining damage to natural landscapes",
                    "Biodegrades naturally, unlike clay that sits in landfills for decades",
                    "Uses sustainable, renewable resources rather than finite minerals",
                    "Lower carbon footprint in production and transportation",
                    "Can be composted in appropriate facilities, creating a circular economy"
                  ].map((point, index) => (
                    <li key={`eco-litter-environment-impact-no-${index}`} className="flex items-start">
                      <span className="mr-2 text-kitty-600 font-bold">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80" 
                  alt="Environmental impact of eco-friendly litter" 
                  className="rounded-xl shadow-lg"
                />
                <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-kitty-600">Did you know?</span> Switching one cat to eco-friendly litter can save up to 900 pounds of clay from landfills each year.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              How We Compare
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-kitty-100 dark:bg-kitty-900/50">
                    <th className="p-4 text-left text-gray-900 dark:text-white font-semibold border border-gray-200 dark:border-gray-700">Feature</th>
                    <th className="p-4 text-left text-gray-900 dark:text-white font-semibold border border-gray-200 dark:border-gray-700">Our Eco Litter</th>
                    <th className="p-4 text-left text-gray-900 dark:text-white font-semibold border border-gray-200 dark:border-gray-700">Traditional Clay Litter</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: "Environmental Impact",
                      eco: "Biodegradable and made from renewable resources",
                      traditional: "Strip-mined, non-biodegradable, fills landfills"
                    },
                    {
                      feature: "Dust Level",
                      eco: "Virtually dust-free",
                      traditional: "Often dusty, can cause respiratory issues"
                    },
                    {
                      feature: "Odor Control",
                      eco: "Natural odor neutralization",
                      traditional: "Chemical fragrances to mask odors"
                    },
                    {
                      feature: "Weight",
                      eco: "Lightweight",
                      traditional: "Heavy and difficult to carry"
                    },
                    {
                      feature: "Tracking",
                      eco: "Minimal tracking through the house",
                      traditional: "Often tracks throughout the home"
                    },
                    {
                      feature: "Safety if Ingested",
                      eco: "Made from natural materials",
                      traditional: "Can cause digestive blockages if ingested"
                    }
                  ].map((row, index) => (
                    <tr key={`eco-litter-compare-index-no-${index}`} className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}>
                      <td className="p-4 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white">{row.feature}</td>
                      <td className="p-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{row.eco}</td>
                      <td className="p-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{row.traditional}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
              What Cat Parents Are Saying
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have made the switch to our eco-friendly cat litter
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: "My cat took to this litter immediately! No transition period needed, and the odor control is amazing.",
                  author: "Sarah K.",
                  image: "https://randomuser.me/api/portraits/women/32.jpg"
                },
                {
                  quote: "As someone with allergies, the dust-free nature of this litter has been a game-changer for our household.",
                  author: "Michael T.",
                  image: "https://randomuser.me/api/portraits/men/54.jpg"
                },
                {
                  quote: "I love that I'm making an eco-friendly choice without sacrificing performance. My two cats approve too!",
                  author: "Jennifer L.",
                  image: "https://randomuser.me/api/portraits/women/68.jpg"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-4">
                    <div className="mr-3">
                      <img src={testimonial.image} alt={testimonial.author} className="w-12 h-12 rounded-full object-cover" />
                    </div>
                    <div>
                      <div className="flex gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={`eco-litter-testimonial-index-no-${i}`} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">{testimonial.author}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.quote}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-kitty-600 to-kitty-800 text-white rounded-2xl p-10 md:p-16">
            <h2 className="text-3xl font-bold mb-6">Ready to Make the Switch?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of cat owners who have made the eco-friendly choice. Your cat and the planet will thank you.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/products">
                <Button className="bg-white text-kitty-700 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                  Shop Eco Litter Now
                </Button>
              </Link>
              <Link to="/how-to-use">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto">
                  How to Use
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

export default WhyEcoLitter;
