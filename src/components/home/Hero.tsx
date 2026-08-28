import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
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

const trustChips = ['Appointments', 'Consults', 'Invoices', 'Pet records'];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute top-[10%] left-[5%] w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"
          initial={{ y: -50, x: -50 }}
          animate={{ y: 0, x: 0 }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"
          initial={{ y: 50, x: 50 }}
          animate={{ y: 0, x: 0 }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            className="space-y-8 max-w-xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              className="inline-block px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-full shadow-sm"
              variants={itemVariants}
            >
              Veterinary operating system for India
            </motion.span>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-foreground tracking-tight"
              variants={itemVariants}
            >
              Clinic CRM that keeps the{' '}
              <span className="text-primary">pet</span> at the centre.
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-muted-foreground max-w-prose"
              variants={itemVariants}
            >
              Book the visit, chart the consult, collect payment — one loop, no paper.
              History stays with the pet, not locked in a clinic drawer.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-3" variants={itemVariants}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/signup/clinic-admin"
                  className={cn(
                    'inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold rounded-full',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'transition-colors duration-200 shadow-lg'
                  )}
                >
                  Register your clinic
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/signup/doctor"
                  className={cn(
                    'inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold rounded-full',
                    'bg-secondary text-secondary-foreground hover:bg-secondary/90',
                    'transition-colors duration-200'
                  )}
                >
                  Join as a veterinarian
                </Link>
              </motion.div>
            </motion.div>

            <motion.p className="text-sm text-muted-foreground" variants={itemVariants}>
              Pet parent?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Keep your pet&apos;s records in one place
              </Link>
            </motion.p>

            <motion.div
              className="grid grid-cols-3 gap-4 pt-2"
              variants={itemVariants}
            >
              {[
                { label: 'Replace paper', value: '1 visit' },
                { label: 'One login', value: 'Many roles' },
                { label: 'Built for', value: 'India' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className="text-center sm:text-left p-3 rounded-lg"
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                >
                  <div className="text-xl sm:text-2xl font-extrabold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-[4rem] blur-3xl opacity-50" />
            </div>
            <motion.img
              src="/home/hero-consult.png"
              alt="Veterinarian examining a golden retriever during a clinic visit"
              className="relative z-10 rounded-3xl lg:rounded-[2.5rem] shadow-2xl object-cover w-full aspect-[4/5] max-h-[420px] sm:max-h-[480px] lg:max-h-[560px] transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 ease-in-out"
              whileHover={{ rotate: 0 }}
              loading="eager"
              decoding="async"
            />
            <div className="absolute bottom-4 left-4 sm:-bottom-6 sm:left-6 z-20 rounded-2xl bg-card/95 backdrop-blur-sm shadow-xl border border-border px-4 py-3 sm:px-5 sm:py-4 max-w-[220px] sm:max-w-[240px]">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                The loop
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground leading-snug">
                Check-in → consult → invoice → paid
              </p>
            </div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/30 blur-2xl z-0" />
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-accent/30 blur-2xl z-0" />
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-border mt-16 md:mt-20">
        <p className="text-sm sm:text-base text-muted-foreground font-medium text-center md:text-left">
          Built for clinics, visiting doctors, and pet parents — one product, three doors in.
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-center justify-center md:justify-end">
          {trustChips.map((item, i) => (
            <motion.div
              key={item}
              className="text-sm font-semibold text-muted-foreground"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.08 + 0.8 }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
