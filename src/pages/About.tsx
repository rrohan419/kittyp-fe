import React from 'react';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Heart, Leaf, Shield, Users, Award, MapPin } from 'lucide-react';
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

        {/* Our Mission Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-xl text-muted-foreground">
              We're on a mission to revolutionize pet care by creating products that are healthier for pets, 
              more convenient for owners, and kinder to our planet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart className="h-10 w-10 text-primary" />,
                title: "Healthier for Cats",
                content: "Our dust-free, chemical-free formulas are gentle on sensitive paws and respiratory systems."
              },
              {
                icon: <Leaf className="h-10 w-10 text-primary" />,
                title: "Better for the Planet",
                content: "Made from sustainable plant materials that biodegrade naturally, reducing landfill waste."
              },
              {
                icon: <Shield className="h-10 w-10 text-primary" />,
                title: "Safer for Homes",
                content: "Non-toxic ingredients mean a healthier environment for your entire family."
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

        {/* Values Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Values</h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything we do at Kittyp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <Leaf className="h-8 w-8 text-primary" />,
                title: "Sustainability First",
                content: "We prioritize eco-friendly materials and processes in every product decision."
              },
              {
                icon: <Award className="h-8 w-8 text-primary" />,
                title: "Quality Without Compromise",
                content: "We never sacrifice performance for sustainability – our products must excel at both."
              },
              {
                icon: <Users className="h-8 w-8 text-primary" />,
                title: "Community Focused",
                content: "We build lasting relationships with customers, partners, and environmental organizations."
              },
              {
                icon: <Shield className="h-8 w-8 text-primary" />,
                title: "Transparency",
                content: "We're honest about our ingredients, manufacturing processes, and environmental impact."
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Visit Us</h2>
                <div className="flex items-start space-x-3 mb-6">
                  <MapPin className="h-6 w-6 text-kitty-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Headquarters
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      123 Eco Way, Portland, OR 97205<br />
                      United States
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Our production facility is powered by 100% renewable energy and features
                  state-of-the-art water conservation systems.
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
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44973.31093277012!2d-122.70146092009178!3d45.51126952467321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54950a0cc25f5703%3A0x60bdc4ca9be8b4a4!2sPortland%2C%20OR%2097205!5e0!3m2!1sen!2sus!4v1714488371026!5m2!1sen!2sus" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Kittyp Headquarters Location"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-kitty-600 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to make the switch?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of cat owners who've chosen a healthier, more sustainable option for their furry friends.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/products">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Shop Products
                </Button>
              </Link>
              <Link to="/why-eco-litter">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  Learn More
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