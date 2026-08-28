// import React, { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Badge } from '@/components/ui/badge';
// import { PlusCircle, Edit, Trash2, Heart } from 'lucide-react';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// interface Pet {
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
//   createdAt: string;
//   updatedAt: string;
// }

// interface PetManagementProps {
//   userId: string;
// }

// export const PetManagement: React.FC<PetManagementProps> = ({ userId }) => {
//   const [pets, setPets] = useState<Pet[]>([]);
//   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
//   const [editingPet, setEditingPet] = useState<Pet | null>(null);
//   const [newPet, setNewPet] = useState<Partial<Pet>>({
//     name: '',
//     species: '',
//     breed: '',
//     age: 0,
//     weight: 0,
//     gender: 'male',
//     color: '',
//     microchipId: '',
//     allergies: '',
//     medications: '',
//     medicalHistory: '',
//     emergencyContact: ''
//   });

//   const speciesOptions = [
//     'Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Guinea Pig', 'Fish', 'Reptile', 'Other'
//   ];

//   const handleAddPet = () => {
//     const pet: Pet = {
//       ...newPet as Pet,
//       id: `pet_${Date.now()}`,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };

//     setPets([...pets, pet]);
//     setNewPet({
//       name: '',
//       species: '',
//       breed: '',
//       age: 0,
//       weight: 0,
//       gender: 'male',
//       color: '',
//       microchipId: '',
//       allergies: '',
//       medications: '',
//       medicalHistory: '',
//       emergencyContact: ''
//     });
//     setIsAddDialogOpen(false);
//   };

//   const handleEditPet = (pet: Pet) => {
//     setEditingPet(pet);
//     setNewPet(pet);
//     setIsAddDialogOpen(true);
//   };

//   const handleUpdatePet = () => {
//     if (editingPet) {
//       const updatedPet = {
//         ...newPet as Pet,
//         id: editingPet.id,
//         createdAt: editingPet.createdAt,
//         updatedAt: new Date().toISOString()
//       };

//       setPets(pets.map(p => p.id === editingPet.id ? updatedPet : p));
//       setEditingPet(null);
//       setNewPet({
//         name: '',
//         species: '',
//         breed: '',
//         age: 0,
//         weight: 0,
//         gender: 'male',
//         color: '',
//         microchipId: '',
//         allergies: '',
//         medications: '',
//         medicalHistory: '',
//         emergencyContact: ''
//       });
//       setIsAddDialogOpen(false);
//     }
//   };

//   const handleDeletePet = (petId: string) => {
//     setPets(pets.filter(p => p.id !== petId));
//   };

//   const resetForm = () => {
//     setEditingPet(null);
//     setNewPet({
//       name: '',
//       species: '',
//       breed: '',
//       age: 0,
//       weight: 0,
//       gender: 'male',
//       color: '',
//       microchipId: '',
//       allergies: '',
//       medications: '',
//       medicalHistory: '',
//       emergencyContact: ''
//     });
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="flex items-center justify-between mb-8">
//         <h1 className="text-3xl font-bold">My Pets</h1>
//         <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
//           setIsAddDialogOpen(open);
//           if (!open) resetForm();
//         }}>
//           <DialogTrigger asChild>
//             <Button>
//               <PlusCircle className="h-4 w-4 mr-2" />
//               Add Pet
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>{editingPet ? 'Edit Pet' : 'Add New Pet'}</DialogTitle>
//             </DialogHeader>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="name">Pet Name *</Label>
//                 <Input
//                   id="name"
//                   value={newPet.name}
//                   onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
//                   placeholder="Enter pet name"
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="species">Species *</Label>
//                 <Select value={newPet.species} onValueChange={(value) => setNewPet({ ...newPet, species: value })}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select species" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {speciesOptions.map((species) => (
//                       <SelectItem key={species} value={species.toLowerCase()}>
//                         {species}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="breed">Breed</Label>
//                 <Input
//                   id="breed"
//                   value={newPet.breed}
//                   onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
//                   placeholder="Enter breed"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="age">Age (years)</Label>
//                 <Input
//                   id="age"
//                   type="number"
//                   value={newPet.age}
//                   onChange={(e) => setNewPet({ ...newPet, age: parseInt(e.target.value) || 0 })}
//                   placeholder="Enter age"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="weight">Weight (kg)</Label>
//                 <Input
//                   id="weight"
//                   type="number"
//                   step="0.1"
//                   value={newPet.weight}
//                   onChange={(e) => setNewPet({ ...newPet, weight: parseFloat(e.target.value) || 0 })}
//                   placeholder="Enter weight"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="gender">Gender</Label>
//                 <Select value={newPet.gender} onValueChange={(value: 'male' | 'female') => setNewPet({ ...newPet, gender: value })}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="male">Male</SelectItem>
//                     <SelectItem value="female">Female</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="color">Color</Label>
//                 <Input
//                   id="color"
//                   value={newPet.color}
//                   onChange={(e) => setNewPet({ ...newPet, color: e.target.value })}
//                   placeholder="Enter color/markings"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="microchip">Microchip ID</Label>
//                 <Input
//                   id="microchip"
//                   value={newPet.microchipId}
//                   onChange={(e) => setNewPet({ ...newPet, microchipId: e.target.value })}
//                   placeholder="Enter microchip ID"
//                 />
//               </div>

//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="allergies">Allergies</Label>
//                 <Textarea
//                   id="allergies"
//                   value={newPet.allergies}
//                   onChange={(e) => setNewPet({ ...newPet, allergies: e.target.value })}
//                   placeholder="List any known allergies"
//                 />
//               </div>

//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="medications">Current Medications</Label>
//                 <Textarea
//                   id="medications"
//                   value={newPet.medications}
//                   onChange={(e) => setNewPet({ ...newPet, medications: e.target.value })}
//                   placeholder="List current medications and dosages"
//                 />
//               </div>

//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="history">Medical History</Label>
//                 <Textarea
//                   id="history"
//                   value={newPet.medicalHistory}
//                   onChange={(e) => setNewPet({ ...newPet, medicalHistory: e.target.value })}
//                   placeholder="Important medical history, surgeries, etc."
//                 />
//               </div>

//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="emergency">Emergency Contact</Label>
//                 <Input
//                   id="emergency"
//                   value={newPet.emergencyContact}
//                   onChange={(e) => setNewPet({ ...newPet, emergencyContact: e.target.value })}
//                   placeholder="Emergency contact number"
//                 />
//               </div>
//             </div>

//             <div className="flex justify-end gap-2 mt-6">
//               <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={editingPet ? handleUpdatePet : handleAddPet}>
//                 {editingPet ? 'Update Pet' : 'Add Pet'}
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {pets.length > 0 ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {pets.map((pet) => (
//             <Card key={pet.id}>
//               <CardHeader className="pb-3">
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="flex items-center gap-2">
//                     <Heart className="h-5 w-5 text-red-500" />
//                     {pet.name}
//                   </CardTitle>
//                   <div className="flex gap-1">
//                     <Button size="sm" variant="outline" onClick={() => handleEditPet(pet)}>
//                       <Edit className="h-4 w-4" />
//                     </Button>
//                     <AlertDialog>
//                       <AlertDialogTrigger asChild>
//                         <Button size="sm" variant="outline">
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </AlertDialogTrigger>
//                       <AlertDialogContent>
//                         <AlertDialogHeader>
//                           <AlertDialogTitle>Delete Pet</AlertDialogTitle>
//                           <AlertDialogDescription>
//                             Are you sure you want to delete {pet.name}? This action cannot be undone.
//                           </AlertDialogDescription>
//                         </AlertDialogHeader>
//                         <AlertDialogFooter>
//                           <AlertDialogCancel>Cancel</AlertDialogCancel>
//                           <AlertDialogAction onClick={() => handleDeletePet(pet.id)}>
//                             Delete
//                           </AlertDialogAction>
//                         </AlertDialogFooter>
//                       </AlertDialogContent>
//                     </AlertDialog>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <div className="flex flex-wrap gap-2">
//                   <Badge variant="secondary">{pet.species}</Badge>
//                   <Badge variant="outline">{pet.gender}</Badge>
//                 </div>
                
//                 <div className="space-y-2 text-sm">
//                   <p><strong>Breed:</strong> {pet.breed || 'Not specified'}</p>
//                   <p><strong>Age:</strong> {pet.age} years</p>
//                   <p><strong>Weight:</strong> {pet.weight} kg</p>
//                   <p><strong>Color:</strong> {pet.color || 'Not specified'}</p>
//                   {pet.microchipId && (
//                     <p><strong>Microchip:</strong> {pet.microchipId}</p>
//                   )}
//                 </div>

//                 {(pet.allergies || pet.medications) && (
//                   <div className="pt-2 border-t">
//                     {pet.allergies && (
//                       <p className="text-sm text-red-600">
//                         <strong>Allergies:</strong> {pet.allergies}
//                       </p>
//                     )}
//                     {pet.medications && (
//                       <p className="text-sm text-blue-600">
//                         <strong>Medications:</strong> {pet.medications}
//                       </p>
//                     )}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <Card>
//           <CardContent className="text-center py-12">
//             <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//             <h3 className="text-lg font-semibold mb-2">No pets registered</h3>
//             <p className="text-muted-foreground mb-4">
//               Add your pets to make booking veterinary consultations easier
//             </p>
//             <Button onClick={() => setIsAddDialogOpen(true)}>
//               <PlusCircle className="h-4 w-4 mr-2" />
//               Add Your First Pet
//             </Button>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };