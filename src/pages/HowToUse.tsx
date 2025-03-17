import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import React from 'react';

const HowToUse = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      
      <main className="pt-24">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">How to Use Kittyp Cat Litter</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Expert guidance for both new cats and transitioning from other litters
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-12">
              {/* Training New Cat Section */}
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-kitty-600 dark:text-kitty-400">
                  Training a New Cat
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <ol className="space-y-6 list-decimal list-inside">
                    {[
                      {
                        title: "Choose the Right Location",
                        content: "Place the litter box in a quiet, accessible area away from food and water bowls"
                      },
                      {
                        title: "Introduce the Litter Box",
                        content: "Gently place your cat in the box after meals and naps. Let them explore and dig"
                      },
                      {
                        title: "Positive Reinforcement",
                        content: "Praise and treat your cat when they use the box successfully"
                      },
                      {
                        title: "Maintain Cleanliness",
                        content: "Scoop waste daily and completely change Kittyp litter weekly"
                      },
                      {
                        title: "Be Patient",
                        content: "Kittens may need 3-6 weeks to fully train. Stay consistent with routine"
                      }
                    ].map((step, index) => (
                      <li key={index} className="text-gray-900 dark:text-gray-100">
                        <strong className="text-gray-900 dark:text-white">{step.title}</strong>
                        <p className="mt-1 text-gray-600 dark:text-gray-400 ml-4">
                          {step.content}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* Transitioning Section */}
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-kitty-600 dark:text-kitty-400">
                  Transitioning to Kittyp
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <ol className="space-y-6 list-decimal list-inside">
                    {[
                      {
                        title: "Start Gradually",
                        content: "Mix 25% Kittyp with 75% old litter for 2-3 days"
                      },
                      {
                        title: "Increase Proportion Slowly",
                        content: "50/50 mix for next 2 days, then 75% Kittyp for 2 more days"
                      },
                      {
                        title: "Monitor Behavior",
                        content: "Watch for signs of avoidance or discomfort. Slow transition if needed"
                      },
                      {
                        title: "Full Transition",
                        content: "After 7-10 days, use 100% Kittyp litter"
                      },
                      {
                        title: "Maintain Routine",
                        content: "Keep same cleaning schedule and box location during transition"
                      }
                    ].map((step, index) => (
                      <li key={index} className="text-gray-900 dark:text-gray-100">
                        <strong className="text-gray-900 dark:text-white">{step.title}</strong>
                        <p className="mt-1 text-gray-600 dark:text-gray-400 ml-4">
                          {step.content}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
                <p>
                  Always consult your veterinarian if your cat shows persistent litter box avoidance
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowToUse;