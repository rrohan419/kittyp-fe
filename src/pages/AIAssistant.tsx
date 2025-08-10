import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Brain, Stethoscope, Heart, Sparkles, ArrowRight, Cat, Scale, Activity, CheckCircle, Clock, Utensils, Apple, Zap, Shield, User, Plus, PawPrint, MessageCircle, Send, Bot, Wand2, Star, Crown, Gift, AlertTriangle, MapPin, Download, FileText } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { fadeIn, fadeUp, staggerContainer, scaleUp } from '@/utils/animations';
// import { downloadNutritionPlan, downloadNutritionPlanAsJSON } from '@/utils/downloadUtils';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import { PetProfile } from '@/services/authService';
import {
  generateNutritionRecommendation,
  generateVetTriageAssessment,
  sendAIChatMessage,
  createAIChatSession,
  getRemainingQuota,
  handleAIError,
  AIError,
  type PetCarePlan,
  type VetTriageAssessment,
  type AIChatMessage,
  type AIChatSession,
  type LocationData,
  defaultPetCarePlan,
  RecommendedProduct
} from '@/services/aiService';
import { toast } from 'sonner';
import UserLocationDisplay from '@/components/ui/UserLocationDisplay';
import { PetSelectionComponent } from '@/components/ui/PetSelectionComponent';

// Floating particles component for background effects
const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Vet Triage Component with enhanced chat functionality
const VetTriageTab: React.FC<{ savedPets: any[] }> = ({ savedPets }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [manualPetData, setManualPetData] = useState({
    name: '',
    type: '',
    breed: '',
    age: '',
    weight: ''
  });
  const [triageData, setTriageData] = useState({
    petId: '',
    emergencyLevel: '',
    symptoms: [] as string[],
    duration: '',
    severity: '',
    behaviorChanges: '',
    appetite: '',
    additionalInfo: ''
  });
  const [assessment, setAssessment] = useState<any>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  // Enhanced chat functionality
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dailyChatCount, setDailyChatCount] = useState(2); // Mock: user has used 2 chats today
  const [isPremium, setIsPremium] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const DAILY_FREE_LIMIT = 5;

  const selectedPet = savedPets.find(pet => pet.id === triageData.petId) ||
    (useManualEntry ? { ...manualPetData, id: 'manual' } : null);

  const emergencySymptoms = [
    'Difficulty breathing', 'Seizures', 'Unconsciousness', 'Severe bleeding',
    'Suspected poisoning', 'Extreme lethargy', 'Severe vomiting/diarrhea',
    'Signs of extreme pain', 'Bloated abdomen', 'Pale gums'
  ];

  const commonSymptoms = [
    'Vomiting', 'Diarrhea', 'Loss of appetite', 'Lethargy', 'Coughing',
    'Sneezing', 'Limping', 'Scratching/itching', 'Excessive drinking',
    'Frequent urination', 'Bad breath', 'Discharge from eyes/nose'
  ];

  const steps = [
    { title: 'Emergency Check', description: 'Quick assessment for urgent symptoms' },
    { title: 'Pet Selection', description: 'Choose which pet needs assessment' },
    { title: 'Symptoms', description: 'Describe current symptoms' },
    { title: 'Details', description: 'Additional information' },
    { title: 'Assessment', description: 'AI health evaluation' }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSymptomToggle = (symptom: string) => {
    setTriageData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleEmergencyCheck = (isEmergency: boolean) => {
    if (isEmergency) {
      setAssessment({
        urgencyLevel: 'EMERGENCY',
        recommendation: 'Seek immediate veterinary care',
        message: 'Based on your responses, your pet may be experiencing a medical emergency. Please contact your nearest emergency veterinary clinic immediately.',
        actions: [
          'Contact emergency vet immediately',
          'Do not wait - go to clinic now',
          'Keep pet calm during transport',
          'Bring medical records if available'
        ]
      });
      setCurrentStep(4);
    } else {
      setCurrentStep(1);
    }
  };

  const generateAssessment = async () => {
    setIsAssessing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const urgencyLevel = triageData.symptoms.length > 3 ? 'HIGH' :
      triageData.symptoms.length > 1 ? 'MEDIUM' : 'LOW';

    setAssessment({
      urgencyLevel,
      recommendation: urgencyLevel === 'HIGH' ? 'Schedule vet visit within 24 hours' :
        urgencyLevel === 'MEDIUM' ? 'Monitor and schedule vet visit within 3-5 days' :
          'Continue monitoring, schedule routine check-up',
      message: `Based on ${selectedPet?.name}'s symptoms and your responses, here's our assessment...`,
      symptoms: triageData.symptoms,
      actions: urgencyLevel === 'HIGH' ? [
        'Contact your veterinarian today',
        'Monitor symptoms closely',
        'Keep pet comfortable and calm',
        'Restrict activity if needed'
      ] : [
        'Continue to monitor symptoms',
        'Maintain normal feeding schedule',
        'Schedule routine vet visit',
        'Note any changes in behavior'
      ]
    });

    setIsAssessing(false);
    setCurrentStep(4);
  };

  const handleStartChat = () => {
    if (dailyChatCount >= DAILY_FREE_LIMIT && !isPremium) {
      return; // Will show upgrade prompt
    }

    setShowChat(true);
    if (chatMessages.length === 0) {
      // Add welcome message
      setChatMessages([{
        id: '1',
        type: 'ai',
        content: `Hello! I'm Dr. AI, your virtual veterinary assistant. I'm here to help with ${selectedPet?.name || 'your pet'}'s health concerns. What would you like to discuss today?`,
        timestamp: new Date()
      }]);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || dailyChatCount >= DAILY_FREE_LIMIT && !isPremium) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    setDailyChatCount(prev => prev + 1);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiResponse = {
      id: (Date.now() + 1).toString(),
      type: 'ai' as const,
      content: generateAIVetResponse(newMessage),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const generateAIVetResponse = (userMessage: string): string => {
    const responses = [
      "Based on what you've described, this could be a few different things. Can you tell me more about when this started and if there are any other symptoms?",
      "That's definitely something to keep an eye on. How is your pet's appetite and energy level? Any changes in behavior?",
      "I understand your concern. While I can't replace an in-person examination, I can help guide you on next steps. Have you noticed any pattern to these symptoms?",
      "Thank you for that information. Based on what you've shared, I'd recommend monitoring closely and considering a vet visit if symptoms persist or worsen.",
      "This sounds like it could benefit from professional examination. In the meantime, ensure your pet is comfortable and has access to fresh water."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <motion.div className="space-y-6" variants={staggerContainer(0.1)}>
      {!showChat ? (
        <>
          {/* Emergency Alert */}
          <motion.div variants={fadeUp}>
            <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Emergency Check</span>
                </CardTitle>
                <CardDescription>
                  Is your pet experiencing any life-threatening symptoms?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3 mb-6">
                  {emergencySymptoms.map((symptom, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-100"
                      variants={scaleUp}
                      whileHover={{ scale: 1.02 }}
                    >
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">{symptom}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="flex space-x-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleEmergencyCheck(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes - Emergency Symptoms Present
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleEmergencyCheck(false)}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    No - Continue Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Vet Chat Feature */}
          <motion.div variants={fadeUp}>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bot className="h-5 w-5 text-primary" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Chat with AI Vet
                  </span>
                </CardTitle>
                <CardDescription>
                  Get instant professional guidance from our AI veterinary assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">Free Daily Chats</h4>
                      <p className="text-sm text-primary/80">
                        {DAILY_FREE_LIMIT - dailyChatCount} of {DAILY_FREE_LIMIT} chats remaining today
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${dailyChatCount < DAILY_FREE_LIMIT ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium">
                      {dailyChatCount < DAILY_FREE_LIMIT ? 'Available' : 'Limit Reached'}
                    </span>
                  </div>
                </div>

                {dailyChatCount >= DAILY_FREE_LIMIT && !isPremium ? (
                  <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 text-center">
                    <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold text-primary mb-2">Upgrade to Premium</h3>
                    <p className="text-primary/80 mb-4">Get unlimited AI vet chats and priority support</p>
                    <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleStartChat}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Start Chat with AI Vet
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        // Chat Interface
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-card to-primary/5 h-[600px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    <AvatarFallback className="bg-white/20 text-white">
                      Dr
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">Dr. AI - Veterinary Assistant</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                      Online • Chats: {dailyChatCount}/{DAILY_FREE_LIMIT}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                  className="text-white hover:bg-white/20"
                >
                  ←
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${message.type === 'user'
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-primary-foreground/80' : 'text-gray-500'
                          }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-sm">
                      <div className="flex space-x-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t bg-gray-50">
                {dailyChatCount >= DAILY_FREE_LIMIT && !isPremium ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-2">Daily limit reached</p>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade for Unlimited Chats
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask Dr. AI about your pet's health..."
                      onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                      className="flex-1"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={sendChatMessage}
                      disabled={!newMessage.trim() || isTyping}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default function AIAssistant() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<PetCarePlan>(defaultPetCarePlan);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [quota, setQuota] = useState({ nutrition: 10, vetChat: 20, vetTriage: 5 });
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isSwitchingPet, setIsSwitchingPet] = useState(false);
  const { addItem } = useCart();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.authReducer);

  // Use real user pets data
  const savedPets = user?.ownerPets || [];

  // Clear recommendations when pet selection changes
  // useEffect(() => {
  //   if (selectedPetId) {
  //     // Check if there are existing recommendations that will be lost
  //     const hasExistingRecommendations = recommendations && (
  //       (recommendations.petProfileSummary && Object.keys(recommendations.petProfileSummary).some(key => recommendations.petProfileSummary[key])) ||
  //       (recommendations.dailyFeedingPlan && recommendations.dailyFeedingPlan.meals && recommendations.dailyFeedingPlan.meals.length > 0) ||
  //       (recommendations.specialConsiderations && recommendations.specialConsiderations.length > 0) ||
  //       (recommendations.recommendedProducts && recommendations.recommendedProducts.length > 0) ||
  //       (recommendations.longTermWellnessTips && recommendations.longTermWellnessTips.length > 0) ||
  //       (recommendations.environmentalImpact && (
  //         recommendations.environmentalImpact.climateConsiderations ||
  //         recommendations.environmentalImpact.hydrationNeeds ||
  //         recommendations.environmentalImpact.energyNeedsAdjustment
  //       ))
  //     );

  //     if (hasExistingRecommendations) {
  //       // Show confirmation dialog
  //       const currentPet = savedPets.find(pet => pet.uuid === selectedPetId);
  //       const previousPet = savedPets.find(pet => pet.uuid !== selectedPetId);
        
  //       if (currentPet && previousPet) {
  //         const confirmed = window.confirm(
  //           `You're switching from ${previousPet.name} to ${currentPet.name}.\n\n` +
  //           `This will clear the current nutrition plan for ${previousPet.name}.\n\n` +
  //           `Would you like to download the current plan before switching?\n\n` +
  //           `Click OK to download, Cancel to switch without downloading.`
  //         );
          
  //         if (confirmed) {
  //           // Download the plan for the previous pet
  //           downloadNutritionPlan(recommendations, previousPet.name);
  //           toast.success(`Nutrition plan for ${previousPet.name} has been downloaded!`);
  //         }
  //       }
  //     }

  //     setIsSwitchingPet(true);
  //     setRecommendations(defaultPetCarePlan);
  //     const selectedPet = savedPets.find(pet => pet.uuid === selectedPetId);
  //     if (selectedPet) {
  //       toast.info(`Switched to ${selectedPet.name}. Please generate new nutrition recommendations.`, {
  //         description: "Previous recommendations have been cleared."
  //       });
  //     }
  //     // Clear the switching state after a brief delay
  //     setTimeout(() => setIsSwitchingPet(false), 500);
  //   }
  // }, [selectedPetId, savedPets, recommendations]);

  const features = [
    {
      id: 'nutrition',
      title: 'Smart Nutrition Engine',
      description: 'AI-powered personalized nutrition plans tailored for your pet\'s unique needs',
      icon: Apple,
      gradient: 'from-primary via-primary/90 to-primary',
      accentColor: 'primary',
      benefits: ['Custom meal plans', 'Ingredient analysis', 'Health optimization', 'Weight management'],
      stats: '1k+ pets helped'
    },
    {
      id: 'vet-triage',
      title: 'AI Vet Assistant',
      description: 'Instant health assessments with professional veterinary AI guidance (Coming Soon)',
      icon: Stethoscope,
      gradient: 'from-primary via-primary/90 to-primary',
      accentColor: 'primary',
      benefits: ['24/7 availability', 'Instant assessment', 'Emergency guidance', 'Chat with AI vet'],
      stats: '',
      comingSoon: true
    }
  ];


  const handleGenerateNutritionRecommendation = async (manualPetData?: PetProfile) => {
    if (!user?.uuid) {
      toast.error('Please ensure you are logged in');
      return;
    }

    if (!selectedPetId) {
      toast.error('Please select a pet or enter pet details manually');
      return;
    }

    setIsGenerating(true);

    try {
      let selectedPet;
      if (selectedPetId === 'manual-entry') {
        if (manualPetData) {
          selectedPet = {
            ...manualPetData,
            uuid: 'manual-entry',
            createdAt: new Date().toISOString()
          };
        } else {
          toast.error('Manual pet data not found');
          setIsGenerating(false);
          return;
        }
      } else {
        selectedPet = savedPets.find(pet => pet.uuid === selectedPetId);
        if (!selectedPet) {
          toast.error('Selected pet not found');
          setIsGenerating(false);
          return;
        }
      }

      // Check quota
      const remainingQuota = getRemainingQuota(user.uuid);
      if (remainingQuota.nutrition <= 0) {
        toast.error('Daily nutrition generation limit reached. Please try again tomorrow or upgrade to premium.');
        return;
      }

      // Check if location is available
      if (!location) {
        setShowLocationPrompt(true);
        setIsGenerating(false);
        return;
      }

      const recommendation = await generateNutritionRecommendation(selectedPet, user.uuid, location);
      console.log('API Response received:', recommendation);
      console.log('Recommendations state before set:', recommendations);
      setRecommendations(recommendation);
      console.log('Recommendations state after set:', recommendation);
      setQuota(remainingQuota);

      toast.success('Nutrition recommendation generated successfully!');

    } catch (error: any) {
      const aiError = handleAIError(error);
      toast.error(aiError.userMessage || aiError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle location update
  const handleLocationUpdate = (locationData: any) => {
    setLocation(locationData);
    setShowLocationPrompt(false);
    toast.success('Location updated! You can now generate nutrition recommendations.');
  };

  // Handle location permission granted
  const handleLocationPermissionGranted = () => {
    setShowLocationPrompt(false);
  };

  // Handle location permission denied
  const handleLocationPermissionDenied = () => {
    toast.error('Location access is required for personalized nutrition recommendations.');
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg text-primary">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Brain className="w-24 h-24 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-primary mb-4">AI Assistant</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to access our AI-powered pet care features
            </p>
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
            >
              Login to Continue
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <FloatingParticles />
      <Navbar />

      <motion.div
        className="container mx-auto px-4 py-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer(0.1)}
      >
        {/* Hero Section */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              className="text-center mb-16 relative"
              variants={fadeUp}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.div
                className="absolute inset-0 -z-10"
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
                    "radial-gradient(circle at 40% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)"
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
              />

              <motion.div
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full mb-6"
                variants={scaleUp}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Pet Care</span>
                <Badge variant="secondary" className="text-xs">New</Badge>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent"
                variants={fadeUp}
              >
                Meet Your Pet's
                <br />
                <motion.span
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                  className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text"
                >
                  AI Assistant
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8"
                variants={fadeUp}
              >
                Revolutionary AI technology that understands your pet's unique needs.
                Get personalized nutrition plans, instant health assessments, and expert guidance.
              </motion.p>

              <motion.div
                className="flex flex-wrap justify-center gap-4 mb-8"
                variants={fadeUp}
              >
                <div className="flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary">1k+ Happy Pets</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary">Vet Approved</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary">Instant Results</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedFeature ? (
          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer(0.2)}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                variants={fadeUp}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card
                  className={`group relative overflow-hidden ${feature.comingSoon ? 'cursor-not-allowed' : 'cursor-pointer'} border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-card/50 backdrop-blur-sm ${feature.comingSoon ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (!feature.comingSoon) {
                      setSelectedFeature(feature.id);
                      setShowWelcome(false);
                    }
                  }}
                >
                  {/* Animated background gradient */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    animate={{
                      background: [
                        `linear-gradient(45deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.1))`,
                        `linear-gradient(225deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.1))`,
                        `linear-gradient(45deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.1))`
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />

                  <CardHeader className="relative pb-4">
                    <div className="flex items-start space-x-4">
                      <motion.div
                        className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className="h-8 w-8" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">
                            {feature.title}
                          </CardTitle>
                          {feature.comingSoon && (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative pt-0">
                    {/* Benefits grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <motion.div
                          key={benefitIndex}
                          className={`flex items-center space-x-2 text-sm p-2 rounded-lg transition-colors ${feature.comingSoon ? 'bg-muted/20 text-muted-foreground' : 'bg-muted/30 hover:bg-muted/50'}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: benefitIndex * 0.1 }}
                        >
                          <CheckCircle className={`h-4 w-4 ${feature.comingSoon ? 'text-muted-foreground' : 'text-primary'}`} />
                          <span>{benefit}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-muted/30">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className={`${feature.comingSoon ? 'bg-muted/10 text-muted-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                          <Bot className="h-3 w-3 mr-1" />
                          {feature.comingSoon ? 'Coming Soon' : 'AI Powered'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{feature.stats}</span>
                      </div>

                      <motion.div
                        whileHover={{ scale: feature.comingSoon ? 1 : 1.05 }}
                        whileTap={{ scale: feature.comingSoon ? 1 : 0.95 }}
                      >
                        <Button
                          className={`bg-gradient-to-r ${feature.gradient} border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${feature.comingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!feature.comingSoon) {
                              setSelectedFeature(feature.id);
                              setShowWelcome(false);
                            }
                          }}
                          disabled={feature.comingSoon}
                        >
                          {feature.comingSoon ? (
                            <>
                              <Clock className="h-4 w-4 mr-2" />
                              Coming Soon
                            </>
                          ) : (
                            <>
                              Start Now
                              <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </motion.div>
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header with back button */}
            <motion.div
              className="flex items-center mb-8 p-6 bg-card/50 backdrop-blur-sm rounded-xl border shadow-sm"
              variants={fadeUp}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedFeature(null);
                  setShowWelcome(true);
                }}
                className="mr-4 hover:bg-primary/10"
              >
                <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
                Back to Features
              </Button>

              <div className="flex items-center space-x-3">
                {(() => {
                  const feature = features.find(f => f.id === selectedFeature);
                  return feature ? (
                    <>
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.gradient} text-white`}>
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{feature.title}</h2>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
            </motion.div>

            {/* Feature content */}
            <motion.div variants={fadeUp}>
              {selectedFeature === 'nutrition' && (
                <PetSelectionComponent
                  selectedPetId={selectedPetId}
                  setSelectedPetId={setSelectedPetId}
                  savedPets={savedPets}
                  user={user}
                  onGenerateRecommendation={handleGenerateNutritionRecommendation}
                  isGenerating={isGenerating}
                  recommendations={recommendations}
                />
              )}

              {selectedFeature === 'vet-triage' && (
                <VetTriageTab savedPets={savedPets} />
              )}
            </motion.div>

            {/* Location Prompt */}
            <AnimatePresence>
              {showLocationPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <UserLocationDisplay
                    onLocationUpdate={handleLocationUpdate}
                    onPermissionGranted={handleLocationPermissionGranted}
                    onPermissionDenied={handleLocationPermissionDenied}
                    className="max-w-2xl mx-auto"
                  />

                  {/* <LocationPromptPopup
                    showLocationPrompt={showLocationPrompt}
                    setShowLocationPrompt={setShowLocationPrompt}
                    handleLocationUpdate={handleLocationUpdate}
                    handleLocationPermissionGranted={handleLocationPermissionGranted}
                    handleLocationPermissionDenied={handleLocationPermissionDenied}
                  /> */}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {recommendations && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="mt-8 border-0 shadow-xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-5 w-5 text-primary" />
                          </motion.div>
                          <span>AI Recommendations</span>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            Personalized
                          </Badge>
                        </CardTitle>
                        {/* <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const selectedPet = savedPets.find(pet => pet.uuid === selectedPetId);
                              if (selectedPet) {
                                downloadNutritionPlan(recommendations, selectedPet.name);
                              }
                            }}
                            className="border-primary/20 text-primary hover:bg-primary/5"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Plan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const selectedPet = savedPets.find(pet => pet.uuid === selectedPetId);
                              if (selectedPet) {
                                downloadNutritionPlanAsJSON(recommendations, selectedPet.name);
                              }
                            }}
                            className="border-primary/20 text-primary hover:bg-primary/5"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            JSON
                          </Button>
                        </div> */}
                      </div>
                    </CardHeader>
                    <CardContent>
                      
                      {/* Check if we have any meaningful data */}
                      {(() => {
                        const hasAnyData = (
                          (recommendations.petProfileSummary && Object.keys(recommendations.petProfileSummary).some(key => recommendations.petProfileSummary[key])) ||
                          (recommendations.dailyFeedingPlan && recommendations.dailyFeedingPlan.meals && recommendations.dailyFeedingPlan.meals.length > 0) ||
                          (recommendations.specialConsiderations && recommendations.specialConsiderations.length > 0) ||
                          (recommendations.recommendedProducts && recommendations.recommendedProducts.length > 0) ||
                          (recommendations.longTermWellnessTips && recommendations.longTermWellnessTips.length > 0) ||
                          (recommendations.environmentalImpact && (
                            recommendations.environmentalImpact.climateConsiderations ||
                            recommendations.environmentalImpact.hydrationNeeds ||
                            recommendations.environmentalImpact.energyNeedsAdjustment
                          ))
                        );
                        
                        if (!hasAnyData) {
                          const selectedPet = savedPets.find(pet => pet.uuid === selectedPetId);
                          return (
                            <div className="text-center py-8">
                              <div className="text-muted-foreground mb-4">
                                {isSwitchingPet ? (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center"
                                  >
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                    <p>Switching to {selectedPet?.name || 'selected pet'}...</p>
                                    <p className="text-sm text-primary/70">Clearing previous recommendations</p>
                                  </motion.div>
                                ) : (
                                                                      <>
                                      <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                      <p>No nutrition recommendations available for {selectedPet?.name || 'this pet'} yet.</p>
                                      <p className="text-sm">Click "Generate Recommendation" to create a personalized nutrition plan.</p>
                                      {selectedPet && (
                                        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                          <p className="text-xs text-primary/70">
                                            <strong>Selected Pet:</strong> {selectedPet.name} ({selectedPet.breed || 'Unknown breed'})
                                          </p>
                                        </div>
                                      )}
                                      
                                      {/* Show download option if there are recommendations for other pets */}
                                      {/* {(() => {
                                        const otherPetsWithRecommendations = savedPets.filter(pet => 
                                          pet.uuid !== selectedPetId && 
                                          recommendations && (
                                            (recommendations.petProfileSummary && Object.keys(recommendations.petProfileSummary).some(key => recommendations.petProfileSummary[key])) ||
                                            (recommendations.dailyFeedingPlan && recommendations.dailyFeedingPlan.meals && recommendations.dailyFeedingPlan.meals.length > 0) ||
                                            (recommendations.specialConsiderations && recommendations.specialConsiderations.length > 0) ||
                                            (recommendations.recommendedProducts && recommendations.recommendedProducts.length > 0) ||
                                            (recommendations.longTermWellnessTips && recommendations.longTermWellnessTips.length > 0) ||
                                            (recommendations.environmentalImpact && (
                                              recommendations.environmentalImpact.climateConsiderations ||
                                              recommendations.environmentalImpact.hydrationNeeds ||
                                              recommendations.environmentalImpact.energyNeedsAdjustment
                                            ))
                                          )
                                        );
                                        
                                        if (otherPetsWithRecommendations.length > 0) {
                                          return (
                                            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                                                <strong>Note:</strong> You have recommendations for other pets that will be cleared when switching.
                                              </p>
                                              <div className="flex flex-wrap gap-2">
                                                {otherPetsWithRecommendations.map(pet => (
                                                  <Button
                                                    key={pet.uuid}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadNutritionPlan(recommendations, pet.name)}
                                                    className="text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/20"
                                                  >
                                                    <Download className="h-3 w-3 mr-1" />
                                                    Download {pet.name}'s Plan
                                                  </Button>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()} */}
                                    </>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return (
                        <motion.div 
                          className="space-y-6"
                          variants={staggerContainer(0.1, 0.1)}
                          initial="hidden"
                          animate="visible"
                        >

                          {/* Pet Profile Summary */}
                          {recommendations?.petProfileSummary && Object.keys(recommendations.petProfileSummary).length > 0 && (
                            <motion.div variants={fadeUp} className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-xl border">
                              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                                <PawPrint className="h-4 w-4 text-primary" />
                                <span>Pet Profile Summary</span>
                              </h4>
                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div><strong>Name:</strong> {recommendations.petProfileSummary.name || 'N/A'}</div>
                                <div><strong>Type:</strong> {recommendations.petProfileSummary.type || 'N/A'}</div>
                                <div><strong>Breed:</strong> {recommendations.petProfileSummary.breed || 'N/A'}</div>
                                <div><strong>Age:</strong> {recommendations.petProfileSummary.age || 'N/A'}</div>
                                <div><strong>Weight:</strong> {recommendations.petProfileSummary.weight || 'N/A'}</div>
                                <div><strong>Activity:</strong> {recommendations.petProfileSummary.activityLevel || 'N/A'}</div>
                              </div>
                            </motion.div>
                          )}

                          {recommendations?.dailyFeedingPlan && recommendations.dailyFeedingPlan.meals && recommendations.dailyFeedingPlan.meals.length > 0 && (
                            <motion.div variants={fadeUp}>
                              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                                <Utensils className="h-4 w-4 text-primary" />
                                <span>Daily Feeding Plan</span>
                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                  {recommendations.dailyFeedingPlan.caloriesPerDay} cal/day
                                </Badge>
                              </h4>
                              <div className="grid gap-4">
                                {recommendations.dailyFeedingPlan.meals.map((meal: any, index: number) => (
                                  <motion.div
                                    key={index}
                                    className="p-4 border rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-all duration-300"
                                    variants={scaleUp}
                                    >
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-primary">{meal.time}</h5>
                                      <Badge variant="outline" className="text-xs">
                                        {meal.portionSizeGrams}g
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{meal.foodType}</p>
                                    <p className="text-xs text-muted-foreground">{meal.notes}</p>
                                  </motion.div>
                                ))}
                              </div>

                              {/* Supplements */}
                              {recommendations?.dailyFeedingPlan.supplements && (
                                <div className="mt-4">
                                  <h5 className="font-medium mb-2 text-secondary-foreground">Supplements</h5>
                                  {recommendations.dailyFeedingPlan.supplements.map((supplement: any, index: number) => (
                                    <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                                      <div className="font-medium text-blue-700 dark:text-blue-300">{supplement.name}</div>
                                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">{supplement.purpose}</div>
                                      <div className="text-xs text-blue-500 dark:text-blue-500">{supplement.dosage}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}

                          {/* Environmental Impact */}
                          {recommendations?.environmentalImpact && 
                           (recommendations.environmentalImpact.climateConsiderations || 
                            recommendations.environmentalImpact.hydrationNeeds || 
                            recommendations.environmentalImpact.energyNeedsAdjustment) && (
                            <motion.div variants={fadeUp} className="bg-green-50 dark:bg-green-950/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                              <h4 className="font-semibold mb-4 flex items-center space-x-2 text-green-700 dark:text-green-300">
                                <Activity className="h-4 w-4" />
                                <span>Environmental Considerations</span>
                              </h4>
                              <div className="space-y-3 text-sm">
                                {recommendations.environmentalImpact.climateConsiderations && (
                                  <div>
                                    <strong className="text-green-600 dark:text-green-400">Climate:</strong>
                                    <p className="text-green-700 dark:text-green-300 mt-1">{recommendations.environmentalImpact.climateConsiderations}</p>
                                  </div>
                                )}
                                {recommendations.environmentalImpact.hydrationNeeds && (
                                  <div>
                                    <strong className="text-green-600 dark:text-green-400">Hydration:</strong>
                                    <p className="text-green-700 dark:text-green-300 mt-1">{recommendations.environmentalImpact.hydrationNeeds}</p>
                                  </div>
                                )}
                                {recommendations.environmentalImpact.energyNeedsAdjustment && (
                                  <div>
                                    <strong className="text-green-600 dark:text-green-400">Energy Needs:</strong>
                                    <p className="text-green-700 dark:text-green-300 mt-1">{recommendations.environmentalImpact.energyNeedsAdjustment}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}

                          {/* Special Considerations */}
                          {recommendations?.specialConsiderations && recommendations.specialConsiderations.length > 0 && (
                            <motion.div variants={fadeUp}>
                              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <span>Special Considerations</span>
                              </h4>
                              <div className="grid gap-3">
                                {recommendations.specialConsiderations.map((consideration: any, index: number) => (
                                  <div key={index} className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <h5 className="font-medium text-orange-700 dark:text-orange-300 mb-2">{consideration.condition || 'General'}</h5>
                                    <p className="text-sm text-orange-600 dark:text-orange-400">{consideration.recommendation || 'No specific recommendation available'}</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* Long-term Wellness Tips */}
                          {recommendations?.longTermWellnessTips && recommendations.longTermWellnessTips.length > 0 && (
                            <motion.div variants={fadeUp}>
                              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                                <Heart className="h-4 w-4 text-pink-500" />
                                <span>Long-term Wellness Tips</span>
                              </h4>
                              <div className="grid gap-2">
                                {recommendations.longTermWellnessTips.map((tip: string, index: number) => (
                                  <div key={index} className="flex items-start space-x-2 p-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: (tip || 'No tip available').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* Recommended Products */}
                          {recommendations?.recommendedProducts && recommendations.recommendedProducts.length > 0 && (
                            
                            <motion.div variants={fadeUp}>
                              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                                <Gift className="h-4 w-4 text-primary" />
                                <span>Recommended Products</span>
                              </h4>
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {recommendations?.recommendedProducts.map((product: RecommendedProduct, index: number) => (
                                  <motion.div
                                    key={index}
                                    variants={scaleUp}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                  >
                                    <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/20">
                                      <CardContent className="p-4">
                                      <div className="flex items-center mb-2">
                                          <Badge variant="outline" className="text-xs mr-2 capitalize">
                                            {product.category}
                                          </Badge>
                                        </div>
                                        <h5 className="font-medium mb-2">{product.productName}</h5>
                                        <p className="text-sm text-muted-foreground mb-3">{product.purpose}</p>
                                        {/* <div className="mt-auto flex justify-end">
                                          <Button
                                            size="sm"
                                            className="bg-primary hover:bg-primary/90"
                                            onClick={() => window.open(product.url, '_blank')}
                                          >
                                            Search
                                          </Button>
                                        </div> */}
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                                </div>
                            </motion.div>
                          )}

                          {/* Veterinary Disclaimer */}
                          {recommendations?.vetAdviceDisclaimer && (
                            <motion.div variants={fadeUp} className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Important Notice</h5>
                                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{recommendations.vetAdviceDisclaimer}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <Footer />
    </div>
  );
}