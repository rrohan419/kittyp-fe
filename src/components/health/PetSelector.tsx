// import React, { useState } from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { 
//   Search, 
//   Heart, 
//   Plus,
//   Filter,
//   Calendar,
//   AlertCircle
// } from 'lucide-react';
// import { PetProfile } from '@/services/authService';

// interface PetSelectorProps {
//   pets: PetProfile[];
//   selectedPetId: string | null;
//   onSelectPet: (petId: string) => void;
//   onAddPet?: () => void;
//   className?: string;
// }

// export const PetSelector: React.FC<PetSelectorProps> = ({
//   pets,
//   selectedPetId,
//   onSelectPet,
//   onAddPet,
//   className = ''
// }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [speciesFilter, setSpeciesFilter] = useState<string>('all');

//   const filteredPets = pets.filter(pet => {
//     const matchesSearch = pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                          pet.breed.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchesSpecies = speciesFilter === 'all' || pet.species === speciesFilter;
//     return matchesSearch && matchesSpecies;
//   });

//   const getSpeciesIcon = (species: string) => {
//     const icons: { [key: string]: string } = {
//       dog: '🐕',
//       cat: '🐱',
//       bird: '🐦',
//       rabbit: '🐰',
//       fish: '🐠',
//       hamster: '🐹',
//       'guinea pig': '🐹',
//       reptile: '🦎'
//     };
//     return icons[species.toLowerCase()] || '🐾';
//   };

//   const uniqueSpecies = Array.from(new Set(pets.map(pet => pet.species)));

//   return (
//     <Card className={`${className}`}>
//       <CardContent className="p-4">
//         <div className="space-y-4">
//           {/* Header */}
//           <div className="flex items-center justify-between">
//             <h3 className="font-semibold text-lg flex items-center gap-2">
//               <Heart className="h-5 w-5 text-primary" />
//               My Pets ({pets.length})
//             </h3>
//             {onAddPet && (
//               <Button size="sm" onClick={onAddPet} variant="outline">
//                 <Plus className="h-4 w-4 mr-1" />
//                 Add
//               </Button>
//             )}
//           </div>

//           {/* Search and Filters */}
//           <div className="space-y-3">
//             <div className="relative">
//               <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search pets by name or breed..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10"
//               />
//             </div>

//             {uniqueSpecies.length > 1 && (
//               <div className="flex gap-2 flex-wrap">
//                 <Button
//                   size="sm"
//                   variant={speciesFilter === 'all' ? 'default' : 'outline'}
//                   onClick={() => setSpeciesFilter('all')}
//                   className="text-xs"
//                 >
//                   All
//                 </Button>
//                 {uniqueSpecies.map(species => (
//                   <Button
//                     key={species}
//                     size="sm"
//                     variant={speciesFilter === species ? 'default' : 'outline'}
//                     onClick={() => setSpeciesFilter(species)}
//                     className="text-xs capitalize"
//                   >
//                     {getSpeciesIcon(species)} {species}
//                   </Button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Pet List */}
//           <ScrollArea className="h-64">
//             <div className="space-y-2">
//               {filteredPets.length > 0 ? (
//                 filteredPets.map(pet => (
//                   <div
//                     key={pet.id}
//                     className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
//                       selectedPetId === pet.id 
//                         ? 'border-primary bg-primary/5 shadow-sm' 
//                         : 'border-border hover:border-primary/50'
//                     }`}
//                     onClick={() => onSelectPet(pet.id)}
//                   >
//                     <div className="flex items-center gap-3">
//                       <Avatar className="w-10 h-10 border">
//                         {pet.profileImage ? (
//                           <AvatarImage src={pet.profileImage} alt={pet.name} />
//                         ) : (
//                           <AvatarFallback className="bg-primary/10 text-primary text-sm">
//                             {getSpeciesIcon(pet.species)}
//                           </AvatarFallback>
//                         )}
//                       </Avatar>
                      
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 mb-1">
//                           <h4 className="font-medium text-sm truncate">{pet.name}</h4>
//                           {selectedPetId === pet.id && (
//                             <Badge variant="secondary" className="text-xs">
//                               Selected
//                             </Badge>
//                           )}
//                         </div>
//                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                           <span className="capitalize">{pet.breed}</span>
//                           <span>•</span>
//                           <span>{pet.age} yr{pet.age !== 1 ? 's' : ''}</span>
//                           <span>•</span>
//                           <span>{pet.weight} kg</span>
//                         </div>
//                       </div>

//                       <div className="flex flex-col items-end gap-1">
//                         <Calendar className="h-4 w-4 text-muted-foreground" />
//                         {/* Mock health status indicator */}
//                         <div className="flex gap-1">
//                           <div className="w-2 h-2 rounded-full bg-green-500" title="Vaccinations up to date" />
//                           <div className="w-2 h-2 rounded-full bg-yellow-500" title="Checkup due soon" />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-center py-8 text-muted-foreground">
//                   <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
//                   <p className="text-sm">
//                     {searchQuery ? 'No pets match your search' : 'No pets found'}
//                   </p>
//                 </div>
//               )}
//             </div>
//           </ScrollArea>

//           {pets.length === 0 && (
//             <div className="text-center py-8">
//               <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
//               <p className="text-sm text-muted-foreground mb-3">No pets added yet</p>
//               {onAddPet && (
//                 <Button onClick={onAddPet} size="sm">
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add Your First Pet
//                 </Button>
//               )}
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };