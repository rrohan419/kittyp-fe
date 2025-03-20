import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight, ArrowLeft, Check, Cat, Recycle } from 'lucide-react';
import React, { useState } from 'react';

const HowToUse = () => {
  const [newCatStep, setNewCatStep] = useState(0);
  const [transitionStep, setTransitionStep] = useState(0);

  const newCatSteps = [
    {
      title: "Choose the Right Location",
      content: "Place the litter box in a quiet, accessible area away from food and water bowls. Cats prefer privacy when using their litter box.",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80",
      tip: "Consider a corner location that offers your cat two sides of protection."
    },
    {
      title: "Fill with Kittyp Eco-Friendly Litter",
      content: "Pour 2-3 inches (5-7.5 cm) of Kittyp litter into the clean litter box. Our eco-friendly formula is designed to be gentle on sensitive paws.",
      image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&auto=format&fit=crop&q=80",
      tip: "Don't overfill - cats prefer digging in 2-3 inches of litter."
    },
    {
      title: "Introduce Your Cat to the Box",
      content: "Gently place your cat in the box after meals and naps. Allow them to sniff and explore. Their natural instincts will usually take over.",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80",
      tip: "Never force your cat to stay in the box - this can create negative associations."
    },
    {
      title: "Demonstrate Digging (Optional)",
      content: "For kittens or hesitant cats, you can gently take their front paws and mimic a digging motion in the litter to help them understand.",
      image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&auto=format&fit=crop&q=80",
      tip: "Be very gentle and stop if your cat seems stressed by this process."
    },
    {
      title: "Positive Reinforcement",
      content: "When your cat successfully uses the box, offer praise, gentle pets, or a small treat. This creates positive associations with the litter box.",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80",
      tip: "Keep treats near the litter box area for quick rewards."
    },
    {
      title: "Maintain Cleanliness",
      content: "Scoop waste daily and completely change Kittyp litter weekly. Our eco-friendly formula reduces odors naturally without harsh chemicals.",
      image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&auto=format&fit=crop&q=80",
      tip: "Set a regular cleaning schedule to maintain litter box hygiene."
    },
  ];

  const transitionSteps = [
    {
      title: "Set Up a Second Box",
      content: "Place a new litter box with Kittyp eco-friendly litter near the existing box with the old litter. This gives your cat a choice.",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80",
      tip: "Don't remove the old box immediately - gradual transition is key."
    },
    {
      title: "Mix a Small Amount",
      content: "In the new box, mix a small amount (about 20%) of the old litter with 80% Kittyp eco-friendly litter to maintain a familiar scent.",
      image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&auto=format&fit=crop&q=80",
      tip: "The familiar scent helps create a comfortable transition."
    },
    {
      title: "Gradually Adjust the Ratio",
      content: "Over the course of a week, gradually reduce the amount of old litter and increase the amount of Kittyp litter in the new box.",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80",
      tip: "Day 1-2: 80/20 Kittyp/old, Day 3-4: 90/10, Day 5-7: 100% Kittyp"
    },
    {
      title: "Maintain Both Boxes Initially",
      content: "Keep both litter boxes available, but make the Kittyp box more appealing by keeping it exceptionally clean and in a preferred location.",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80",
      tip: "Clean the Kittyp box more frequently during transition to increase appeal."
    },
    {
      title: "Monitor Usage Patterns",
      content: "Pay attention to which box your cat prefers. Once they consistently choose the Kittyp box, you can begin to phase out the old one.",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80",
      tip: "Look for signs of comfort like thorough burying of waste in the new litter."
    },
    {
      title: "Complete the Transition",
      content: "When your cat is consistently using the Kittyp litter box, you can remove the old box. Continue to maintain regular cleaning routines.",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80",
      tip: "The entire transition typically takes 1-2 weeks for most cats."
    },
  ];

  const nextNewCatStep = () => {
    if (newCatStep < newCatSteps.length - 1) {
      setNewCatStep(newCatStep + 1);
    }
  };

  const prevNewCatStep = () => {
    if (newCatStep > 0) {
      setNewCatStep(newCatStep - 1);
    }
  };

  const nextTransitionStep = () => {
    if (transitionStep < transitionSteps.length - 1) {
      setTransitionStep(transitionStep + 1);
    }
  };

  const prevTransitionStep = () => {
    if (transitionStep > 0) {
      setTransitionStep(transitionStep - 1);
    }
  };

  const Progress = ({ current, total, onClick }) => (
    <div className="flex items-center justify-center gap-2 my-4">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onClick(i)}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i === current
              ? "bg-kitty-600 scale-125"
              : i < current
              ? "bg-kitty-400"
              : "bg-gray-300 dark:bg-gray-700"
          }`}
          aria-label={`Go to step ${i + 1}`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 animate-fade-up">
              How to Use <span className="text-kitty-600">Kittyp</span> Cat Litter
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-fade-up animate-delay-100">
              Follow our simple, step-by-step guide to introduce our eco-friendly cat litter to your feline friend
            </p>
          </div>

          <Tabs defaultValue="new-cat" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="new-cat" className="text-base py-3">
                <Cat className="mr-2 h-4 w-4" />
                For New Cats
              </TabsTrigger>
              <TabsTrigger value="transition" className="text-base py-3">
                <ArrowRight className="mr-2 h-4 w-4" />
                Transitioning Cats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-cat" className="bg-gradient-to-br from-white to-kitty-50 dark:from-gray-900 dark:to-kitty-950 p-6 rounded-lg shadow-lg animate-fade-in">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-kitty-700 dark:text-kitty-300 text-center">
                  Introducing Kittyp to a New Cat
                </h2>

                <Card className="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-kitty-200 dark:border-kitty-800 transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6">
                        <div className="flex items-center mb-4">
                          <span className="flex items-center justify-center w-8 h-8 bg-kitty-600 text-white rounded-full mr-3">
                            {newCatStep + 1}
                          </span>
                          <h3 className="text-xl font-semibold text-kitty-700 dark:text-kitty-300">
                            {newCatSteps[newCatStep].title}
                          </h3>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                          {newCatSteps[newCatStep].content}
                        </p>
                        
                        <div className="bg-kitty-50 dark:bg-kitty-900/30 p-4 rounded-md flex items-start mb-6">
                          <CheckCircle className="w-5 h-5 text-kitty-600 dark:text-kitty-400 mr-2 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">Pro Tip:</span> {newCatSteps[newCatStep].tip}
                          </p>
                        </div>
                        
                        <Progress 
                          current={newCatStep} 
                          total={newCatSteps.length} 
                          onClick={setNewCatStep} 
                        />
                        
                        <div className="flex justify-between mt-6">
                          <Button 
                            variant="outline" 
                            onClick={prevNewCatStep} 
                            disabled={newCatStep === 0}
                            className="gap-2"
                          >
                            <ArrowLeft className="h-4 w-4" /> Previous
                          </Button>
                          
                          <Button 
                            onClick={nextNewCatStep} 
                            disabled={newCatStep === newCatSteps.length - 1}
                            className="gap-2"
                          >
                            Next <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="relative h-full min-h-[300px] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <img 
                          src={newCatSteps[newCatStep].image} 
                          alt={newCatSteps[newCatStep].title}
                          className="w-full h-full object-cover rounded-b-lg md:rounded-r-lg md:rounded-bl-none"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <div className="flex items-center gap-2">
                            <Check className="text-green-400 h-5 w-5" />
                            <p className="text-white text-sm">Step {newCatStep + 1} of {newCatSteps.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transition" className="bg-gradient-to-br from-white to-kitty-50 dark:from-gray-900 dark:to-kitty-950 p-6 rounded-lg shadow-lg animate-fade-in">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-kitty-700 dark:text-kitty-300 text-center">
                  Transitioning from Another Litter to Kittyp
                </h2>

                <Card className="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-kitty-200 dark:border-kitty-800 transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6">
                        <div className="flex items-center mb-4">
                          <span className="flex items-center justify-center w-8 h-8 bg-kitty-600 text-white rounded-full mr-3">
                            {transitionStep + 1}
                          </span>
                          <h3 className="text-xl font-semibold text-kitty-700 dark:text-kitty-300">
                            {transitionSteps[transitionStep].title}
                          </h3>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                          {transitionSteps[transitionStep].content}
                        </p>
                        
                        <div className="bg-kitty-50 dark:bg-kitty-900/30 p-4 rounded-md flex items-start mb-6">
                          <Recycle className="w-5 h-5 text-kitty-600 dark:text-kitty-400 mr-2 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">Helpful Hint:</span> {transitionSteps[transitionStep].tip}
                          </p>
                        </div>
                        
                        <Progress 
                          current={transitionStep} 
                          total={transitionSteps.length} 
                          onClick={setTransitionStep} 
                        />
                        
                        <div className="flex justify-between mt-6">
                          <Button 
                            variant="outline" 
                            onClick={prevTransitionStep} 
                            disabled={transitionStep === 0}
                            className="gap-2"
                          >
                            <ArrowLeft className="h-4 w-4" /> Previous
                          </Button>
                          
                          <Button 
                            onClick={nextTransitionStep} 
                            disabled={transitionStep === transitionSteps.length - 1}
                            className="gap-2"
                          >
                            Next <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="relative h-full min-h-[300px] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <img 
                          src={transitionSteps[transitionStep].image} 
                          alt={transitionSteps[transitionStep].title}
                          className="w-full h-full object-cover rounded-b-lg md:rounded-r-lg md:rounded-bl-none"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <div className="flex items-center gap-2">
                            <Check className="text-green-400 h-5 w-5" />
                            <p className="text-white text-sm">Step {transitionStep + 1} of {transitionSteps.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-12 max-w-2xl mx-auto text-center">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300 mb-2">Important Note</h3>
              <p className="text-amber-700 dark:text-amber-400">
                If your cat consistently refuses to use the litter box or shows signs of distress, please consult your veterinarian, as this could indicate a health issue.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowToUse;