import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Animation variants for a staggered fade-in effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background blobs for a dynamic, subtle effect */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute top-[10%] left-[5%] w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"
          initial={{ y: -50, x: -50 }}
          animate={{ y: 0, x: 0 }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"
          initial={{ y: 50, x: 50 }}
          animate={{ y: 0, x: 0 }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-2 lg:px-4  md:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side: Content */}
          <motion.div
            className="space-y-8 max-w-xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              className="inline-block px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-full shadow-lg"
              variants={itemVariants}
            >
              <span className="animate-pulse mr-2">✨</span>
              Complete Pet Care. AI-Powered. Premium Quality.
            </motion.span>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight text-foreground tracking-tight"
              variants={itemVariants}
            >
              Caring for your <span className="text-primary">pets</span>, effortlessly.
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-muted-foreground max-w-prose"
              variants={itemVariants}
            >
              Premium pet care products and AI-powered recommendations. Starting with our signature pine wood litter—exceptional quality that's kind to your pets and our planet.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/products"
                  className={cn(
                    "inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "transition-colors duration-200 shadow-xl"
                  )}
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/ai-assistant"
                  className={cn(
                    "inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full",
                    "bg-secondary text-secondary-foreground hover:bg-secondary/90",
                    "transition-colors duration-200"
                  )}
                >
                  AI Pet Assistant
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="grid grid-cols-3 gap-6 pt-4"
              variants={itemVariants}
            >
              {[
                { label: 'Eco-Friendly', value: '100%' },
                { label: 'Happy Pets', value: '1K+' },
                { label: 'Reviews', value: '4.9/5' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center p-4 rounded-lg"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <div className="text-2xl font-extrabold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Right Side: Image and Visuals */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-[4rem] blur-3xl opacity-50 animate-pulse-slow" />
            </div>
            <motion.img
              src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop&q=80"
              alt="Happy cat with eco-friendly litter"
              className="relative z-10 rounded-[4rem] shadow-2xl object-cover w-full h-auto transform rotate-3 hover:rotate-0 transition-transform duration-500 ease-in-out"
              whileHover={{ rotate: 0 }}
            />
            {/* Adding subtle decorative elements */}
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/30 blur-2xl z-0" />
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-accent/30 blur-2xl z-0" />
          </motion.div>
        </div>
      </div>
      
      {/* Footer/Trust Section - Refined layout */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-border mt-16 md:mt-24">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-background overflow-hidden shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 + 1 }}
              >
                <img
                  src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i + 20}.jpg`}
                  alt={`Customer ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Join <span className="font-bold text-primary">1000+ happy pets & owners</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-8 text-center justify-center md:justify-end">
          {['Eco-Friendly', 'Odor Control', 'Dust-Free', 'Compostable'].map((item, i) => (
            <motion.div
              key={i}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 + 1.2 }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}