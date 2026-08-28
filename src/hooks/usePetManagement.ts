// import { useAppSelector } from '@/module/store/hooks';
// import { useState, useEffect } from 'react';

// export interface Pet {
//   id: string;
//   name: string;
//   species: string;
//   breed: string;
//   age: number;
//   weight: number;
//   gender: 'male' | 'female';
//   color: string;
//   microchipId?: string;
//   allergies?: string;
//   medications?: string;
//   medicalHistory?: string;
//   emergencyContact?: string;
//   profileImage?: string;
//   vaccinations?: Array<{
//     name: string;
//     lastGiven?: string;
//     nextDue?: string;
//   }>;
//   deworming?: {
//     lastGiven?: string;
//     nextDue?: string;
//     type?: string;
//   };
//   createdAt: string;
//   updatedAt: string;
// }

// export const usePetManagement = (userId: string) => {
//   // const [pets, setPets] = useState<Pet[]>([]);
//   const { user, petsLoading, saving } = useAppSelector((state) => state.authReducer);
//   const pets = user?.ownerPets || [];
//   const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app, this would fetch from API
  // useEffect(() => {
  //   const mockPets: Pet[] = [
  //     {
  //       id: 'pet1',
  //       name: 'Buddy',
  //       species: 'dog',
  //       breed: 'Golden Retriever',
  //       age: 3,
  //       weight: 25,
  //       gender: 'male',
  //       color: 'Golden',
  //       microchipId: 'ABC123456789',
  //       allergies: 'None known',
  //       medications: 'Monthly heartworm prevention',
  //       medicalHistory: 'Vaccinations up to date',
  //       emergencyContact: '+1-555-0123',
  //       createdAt: '2024-01-15T10:00:00Z',
  //       updatedAt: '2024-01-15T10:00:00Z'
  //     },
  //     {
  //       id: 'pet2',
  //       name: 'Luna',
  //       species: 'cat',
  //       breed: 'Siamese',
  //       age: 2,
  //       weight: 4,
  //       gender: 'female',
  //       color: 'Seal Point',
  //       microchipId: 'DEF987654321',
  //       allergies: 'Fish allergy',
  //       medications: 'None',
  //       medicalHistory: 'Spayed at 6 months',
  //       emergencyContact: '+1-555-0123',
  //       createdAt: '2024-02-20T10:00:00Z',
  //       updatedAt: '2024-02-20T10:00:00Z'
  //     },
  //     {
  //       id: 'pet3',
  //       name: 'Max',
  //       species: 'dog',
  //       breed: 'Labrador',
  //       age: 5,
  //       weight: 30,
  //       gender: 'male',
  //       color: 'Chocolate',
  //       microchipId: 'GHI456789123',
  //       allergies: 'Chicken allergy',
  //       medications: 'Allergy medication',
  //       medicalHistory: 'Previous hip surgery',
  //       emergencyContact: '+1-555-0123',
  //       createdAt: '2024-03-10T10:00:00Z',
  //       updatedAt: '2024-03-10T10:00:00Z'
  //     }
  //   ];
  //   setPets(mockPets);
  //   if (mockPets.length > 0) {
  //     setSelectedPetId(mockPets[0].id);
  //   }
  // }, [userId]);

  // const addPet = (petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => {
  //   const newPet: Pet = {
  //     ...petData,
  //     id: `pet_${Date.now()}`,
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString()
  //   };
  //   setPets([...pets, newPet]);
  //   setSelectedPetId(newPet.id);
  //   return newPet;
  // };

//   const updatePet = (petId: string, updates: Partial<Pet>) => {
//     setPets(pets.map(pet =>
//       pet.id === petId
//         ? { ...pet, ...updates, updatedAt: new Date().toISOString() }
//         : pet
//     ));
//   };

//   const deletePet = (petId: string) => {
//     setPets(pets.filter(pet => pet.id !== petId));
//     if (selectedPetId === petId) {
//       const remainingPets = pets.filter(pet => pet.id !== petId);
//       setSelectedPetId(remainingPets.length > 0 ? remainingPets[0].id : null);
//     }
//   };

//   const getSelectedPet = () => {
//     return pets.find(pet => pet.id === selectedPetId) || null;
//   };

//   return {
//     pets,
//     selectedPetId,
//     selectedPet: getSelectedPet(),
//     setSelectedPetId,
//     addPet,
//     updatePet,
//     deletePet,
//     isLoading
//   };
// };