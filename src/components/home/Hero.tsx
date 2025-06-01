import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-accent to-transparent -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-22">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 max-w-xl animate-fade-up">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-accent text-accent-foreground rounded-full">
              Eco-friendly. Odor Control. Happy Cats.
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Better litter for your <span className="text-primary">feline friend</span>
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Sustainable cat litter that's kind to your cat, your home, and our planet. Exceptional odor control with all-natural ingredients.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/products"
                className={cn(
                  "inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "transition-colors duration-200"
                )}
              >
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              
              <Link
                to="/why-eco-litter"
                className={cn(
                  "inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg",
                  "bg-accent text-accent-foreground hover:bg-accent/90",
                  "transition-colors duration-200"
                )}
              >
                Learn More
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-4">
              {[
                { label: 'Eco-Friendly', value: '100%' },
                { label: 'Happy Cats', value: '10K+' },
                { label: 'Reviews', value: '4.9/5' }
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative lg:h-[600px] animate-fade-up animate-delay-200">
            <img
              src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=60"
              alt="Happy cat with eco-friendly litter"
              className="rounded-2xl shadow-2xl object-cover w-full h-full"
            />
            
            <div className="absolute -top-12 right-16 w-40 h-40 bg-accent rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-20 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10" />
          </div>
        </div>
        
        <div className="mt-24 md:mt-32 py-8 flex flex-wrap justify-between items-center gap-8 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                  <img
                    src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i + 20}.jpg`}
                    alt={`Customer ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">10,000+</span> happy cats & owners
            </p>
          </div>
          
          <div className="flex flex-wrap gap-8 text-center">
            {['100% Eco-Friendly', 'Superior Odor Control', 'Dust-Free Formula', 'Compostable'].map((item, i) => (
              <div key={i} className="text-sm text-muted-foreground font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
