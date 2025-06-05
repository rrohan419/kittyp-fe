import React from 'react';
import { Footer } from '@/components/layout/Footer';
import { Leaf, Recycle, Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const WhyEcoLitter = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-up">
              Why Choose <span className="text-primary">Eco-Friendly</span> Cat Litter?
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-up animate-delay-100">
              Discover how our sustainable cat litter is revolutionizing pet care while protecting our planet
            </p>
          </div>

          {/* Benefits Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">
                Benefits for Your Cat, Your Home, and Our Planet
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Our eco-friendly cat litter offers multiple advantages over traditional clay litter
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <Leaf className="h-10 w-10 text-primary" />,
                  title: "Eco-Friendly Materials",
                  description: "Made from renewable plant resources that are biodegradable and compostable, reducing landfill waste."
                },
                {
                  icon: <Shield className="h-10 w-10 text-primary" />,
                  title: "Healthier for Cats",
                  description: "Dust-free formula that's gentler on sensitive paws and respiratory systems than clay litters."
                },
                {
                  icon: <Sparkles className="h-10 w-10 text-primary" />,
                  title: "Superior Odor Control",
                  description: "Natural formulas that trap and neutralize odors better than traditional clay litters."
                },
                {
                  icon: <Recycle className="h-10 w-10 text-primary" />,
                  title: "Sustainable Packaging",
                  description: "Packaged in recycled and recyclable materials to minimize environmental impact."
                }
              ].map((benefit, index) => (
                <div 
                  key={`eco-litter-benefit-index-no-${index}`}
                  className={cn(
                    "flex flex-col items-center text-center p-6 rounded-xl",
                    "bg-card border border-border",
                    "animate-fade-up"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-4 p-3 bg-accent rounded-full">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="bg-accent/20 rounded-2xl p-8 md:p-12 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Environmental Impact
                </h2>
                <p className="text-muted-foreground mb-6">
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
                      <span className="mr-2 text-primary font-bold">•</span>
                      <span className="text-muted-foreground">{point}</span>
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
                <div className="absolute -bottom-6 -right-6 bg-card rounded-lg shadow-lg p-4 max-w-xs">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-primary">Did you know?</span> Switching one cat to eco-friendly litter can save up to 900 pounds of clay from landfills each year.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              How We Compare
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-accent/20">
                    <th className="p-4 text-left text-foreground font-semibold border border-border">Feature</th>
                    <th className="p-4 text-left text-foreground font-semibold border border-border">Our Eco Litter</th>
                    <th className="p-4 text-left text-foreground font-semibold border border-border">Traditional Clay Litter</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: "Environmental Impact",
                      eco: "Biodegradable, renewable resources",
                      traditional: "Non-biodegradable, strip-mined"
                    },
                    {
                      feature: "Dust Level",
                      eco: "99% dust-free",
                      traditional: "High dust content"
                    },
                    {
                      feature: "Odor Control",
                      eco: "Natural enzymes, 7+ days",
                      traditional: "Chemical additives, 3-5 days"
                    },
                    {
                      feature: "Weight",
                      eco: "50% lighter than clay",
                      traditional: "Heavy, difficult to carry"
                    },
                    {
                      feature: "Tracking",
                      eco: "Minimal tracking",
                      traditional: "Significant tracking"
                    }
                  ].map((row, index) => (
                    <tr key={`eco-litter-compare-index-no-${index}`} className={cn(
                      index % 2 === 0 ? "bg-background" : "bg-muted",
                      "transition-colors hover:bg-accent/5"
                    )}>
                      <td className="p-4 border border-border font-medium text-foreground">{row.feature}</td>
                      <td className="p-4 border border-border text-muted-foreground">{row.eco}</td>
                      <td className="p-4 border border-border text-muted-foreground">{row.traditional}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-foreground text-center mb-4">
              What Cat Parents Are Saying
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have made the switch to our eco-friendly cat litter
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah M.",
                  location: "California",
                  image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=60",
                  content: "The best cat litter I've ever used. No dust, great odor control, and I feel good about using an eco-friendly product."
                },
                {
                  name: "Michael R.",
                  location: "New York",
                  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60",
                  content: "My cats adapted immediately, and I love how light it is compared to clay litter. Win-win for everyone!"
                },
                {
                  name: "Emily L.",
                  location: "Texas",
                  image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60",
                  content: "Finally, a sustainable option that actually works! The odor control is amazing, and it's so much cleaner."
                }
              ].map((testimonial, index) => (
                <div 
                  key={`eco-litter-testimonial-index-no-${index}`}
                  className={cn(
                    "bg-card border border-border rounded-xl p-6",
                    "animate-fade-up"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{testimonial.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WhyEcoLitter;
