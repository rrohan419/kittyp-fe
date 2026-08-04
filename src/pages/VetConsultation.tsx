import React, { useState, useEffect } from 'react';
import { VetSearch } from '@/components/vet/VetSearch';
import { VetBookingFlow } from '@/components/vet/VetBookingFlow';
import { SchedulingProvider, useScheduling } from '@/context/SchedulingContext';
import { BookingFilters, VetProfile } from '@/types/scheduling';
import { LoadingState } from '@/components/ui/LoadingState';

const VetConsultationContent: React.FC = () => {
  const [searchResults, setSearchResults] = useState<VetProfile[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { searchVets, isLoading } = useScheduling();

  const handleSearch = async (filters: BookingFilters) => {
    const results = await searchVets(filters);
    setSearchResults(results);
    setHasSearched(true);
  };

  // Load all vets initially
  useEffect(() => {
    const loadInitialVets = async () => {
      const results = await searchVets({});
      setSearchResults(results);
      setHasSearched(true);
    };
    
    loadInitialVets();
  }, []);

  if (isLoading && !hasSearched) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Veterinary Consultation</h1>
          <p className="text-xl text-muted-foreground">
            Connect with qualified veterinarians for your pet's health needs
          </p>
        </div>

        <div className="mb-8">
          <VetSearch onSearch={handleSearch} />
        </div>

        {hasSearched && (
          <VetBookingFlow 
            vets={searchResults}
            onBookingComplete={(booking) => {
              console.log('Booking completed:', booking);
            }}
          />
        )}
      </div>
    </div>
  );
};

export const VetConsultation: React.FC = () => {
  return (
    <SchedulingProvider>
      <VetConsultationContent />
    </SchedulingProvider>
  );
};