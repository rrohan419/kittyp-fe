import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Heart, Trash2, Save, Edit, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PetProfile } from "@/services/authService";
import { addPet, deletePet, editPet, fetchUserPets, AddPet, UpdatePet } from "@/services/UserService";
import { PetPhotoUpload } from './PetPhotoUpload';

const PetDetailsForm: React.FC = () => {
    const [pets, setPets] = useState<PetProfile[]>([]);
    const [isAddingPet, setIsAddingPet] = useState(false);
    const [isEditingPet, setIsEditingPet] = useState(false);
    const [editingPetId, setEditingPetId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [petForm, setPetForm] = useState<Omit<AddPet, 'isNeutered'> & { isNeutered: string }>({
        name: '',
        profilePicture: '',
        type: '',
        breed: '',
        age: '',
        weight: '',
        activityLevel: '',
        gender: '',
        currentFoodBrand: '',
        healthConditions: '',
        allergies: '',
        isNeutered: ''
    });

    // Fetch pets on component mount
    useEffect(() => {
        loadPets();
    }, []);

    const loadPets = async () => {
        try {
            setLoading(true);
            const userPets = await fetchUserPets();
            setPets(userPets);
        } catch (error) {
            console.error('Error loading pets:', error);
            toast.error("Failed to load pets", {
                description: "Please try again later."
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPetForm({
            name: '',
            profilePicture: '',
            type: '',
            breed: '',
            age: '',
            weight: '',
            activityLevel: '',
            gender: '',
            currentFoodBrand: '',
            healthConditions: '',
            allergies: '',
            isNeutered: ''
        });
        setIsAddingPet(false);
        setIsEditingPet(false);
        setEditingPetId(null);
    };

    // Remove old handleImageUpload and fileInputRef logic

    const handleAddPet = async () => {
        if (!petForm.name) {
            toast.warning("Missing Information", {
                description: "Please fill in at least the pet name."
            });
            return;
        }

        try {
            setSaving(true);
            const petDto: AddPet = {
                ...petForm,
                isNeutered: petForm.isNeutered === 'yes'
            };

            const newPet = await addPet(petDto);
            setPets([...pets, newPet]);
            resetForm();

            toast.success("Pet Added Successfully", {
                description: `${newPet.name} has been added to your profile.`
            });
        } catch (error) {
            console.error('Error adding pet:', error);
            toast.error("Failed to add pet", {
                description: "Please try again later."
            });
        } finally {
            setSaving(false);
        }
    };

    const handleEditPet = async () => {
        if (!petForm.name || !editingPetId) {
            toast.warning("Missing Information", {
                description: "Please fill in at least the pet name."
            });
            return;
        }

        try {
            setSaving(true);
            const updatePetDto: UpdatePet = {
                uuid: editingPetId,
                ...petForm,
                isNeutered: petForm.isNeutered === 'yes'
            };

            const updatedPet = await editPet(updatePetDto);
            setPets(pets.map(pet => pet.uuid === editingPetId ? updatedPet : pet));
            resetForm();

            toast.success("Pet Updated Successfully", {
                description: `${updatedPet.name} has been updated.`
            });
        } catch (error) {
            console.error('Error updating pet:', error);
            toast.error("Failed to update pet", {
                description: "Please try again later."
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePet = async (petId: string) => {
        try {
            await deletePet(petId);
            setPets(pets.filter(pet => pet.uuid !== petId));
            toast.success("Pet Removed", {
                description: "Pet has been removed from your profile."
            });
        } catch (error) {
            console.error('Error deleting pet:', error);
            toast.error("Failed to remove pet", {
                description: "Please try again later."
            });
        }
    };

    const startEditing = (pet: PetProfile) => {
        setPetForm({
            name: pet.name,
            profilePicture: pet.profilePicture,
            type: pet.type,
            breed: pet.breed,
            age: pet.age,
            weight: pet.weight,
            activityLevel: pet.activityLevel,
            gender: pet.gender,
            currentFoodBrand: pet.currentFoodBrand,
            healthConditions: pet.healthConditions,
            allergies: pet.allergies,
            isNeutered: pet.isNeutered ? 'yes' : 'no'
        });
        setEditingPetId(pet.uuid);
        setIsEditingPet(true);
        setIsAddingPet(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading pets...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">My Pets</h2>
                    <p className="text-muted-foreground">Add your pet details for personalized AI recommendations</p>
                </div>
                <Button
                    onClick={() => setIsAddingPet(true)}
                    className="flex items-center gap-2"
                    disabled={isEditingPet}
                >
                    <PlusCircle className="h-4 w-4" />
                    Add Pet
                </Button>
            </div>

            {/* Existing Pets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pets.map((pet) => (
                    <Card key={pet.uuid} className="relative group hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                                        {pet.profilePicture ? (
                                            <AvatarImage src={pet.profilePicture} alt={pet.name} className="object-cover" />
                                        ) : (
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                <Heart className="h-6 w-6" />
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{pet.name}</CardTitle>
                                        <CardDescription>{pet.breed || 'Mixed breed'}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEditing(pet)}
                                        className="text-primary hover:text-primary"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeletePet(pet.uuid)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {pet.age && <Badge variant="secondary">{pet.age} old</Badge>}
                                {pet.weight && <Badge variant="secondary">{pet.weight}</Badge>}
                                {pet.activityLevel && <Badge variant="outline">{pet.activityLevel} activity</Badge>}
                                {pet.isNeutered && <Badge variant="outline">Neutered</Badge>}
                            </div>
                            {pet.healthConditions && (
                                <p className="text-sm text-muted-foreground">
                                    Health: {pet.healthConditions}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add/Edit Pet Form */}
            {(isAddingPet || isEditingPet) && (
                <Card className="animate-fade-in">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{isEditingPet ? 'Edit Pet' : 'Add New Pet'}</CardTitle>
                                <CardDescription>
                                    {isEditingPet ? 'Update your pet details' : 'Provide details about your pet for personalized nutrition and health recommendations'}
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetForm}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Pet Profile Picture Upload */}
                        <div className="flex flex-col items-center space-y-4 py-4">
                            <PetPhotoUpload
                                currentPhotos={petForm.profilePicture ? [petForm.profilePicture] : []}
                                petUuid={isEditingPet ? editingPetId || undefined : undefined}
                                onUploadComplete={(urls) => {
                                    // For single profile picture, use the first url
                                    setPetForm({ ...petForm, profilePicture: urls[0] || '' });
                                }}
                                petName={petForm.name}
                                maxPhotos={1}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="petName">Pet Name *</Label>
                                <Input
                                    id="petName"
                                    value={petForm.name}
                                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                                    placeholder="Enter pet name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="petType" className="text-primary font-medium">Pet Type</Label>
                                <Select
                                    value={petForm.type}
                                    onValueChange={(value) => setPetForm(prev => ({ ...prev, type: value }))}
                                >
                                    <SelectTrigger className="border-primary/20 focus:border-primary">
                                        <SelectValue placeholder="Select pet type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cat">🐱 Cat</SelectItem>
                                        <SelectItem value="dog">🐶 Dog</SelectItem>
                                        <SelectItem value="bird">🐦 Bird</SelectItem>
                                        <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
                                        <SelectItem value="other">🐾 Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="breed">Breed</Label>
                                <Input
                                    id="breed"
                                    value={petForm.breed}
                                    onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                                    placeholder="e.g., Persian, Golden Retriever"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    value={petForm.age}
                                    onChange={(e) => setPetForm({ ...petForm, age: e.target.value })}
                                    placeholder="e.g., 2 years, 6 months"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight</Label>
                                <Input
                                    id="weight"
                                    value={petForm.weight}
                                    onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })}
                                    placeholder="e.g., 5 kg, 12 lbs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="activityLevel">Activity Level</Label>
                                <Select value={petForm.activityLevel} onValueChange={(value) => setPetForm({ ...petForm, activityLevel: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select activity level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="moderate">Moderate</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="very-high">Very High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={petForm.gender} onValueChange={(value) => setPetForm({ ...petForm, gender: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="isNeutered">Neutered/Spayed</Label>
                                <Select value={petForm.isNeutered} onValueChange={(value) => setPetForm({ ...petForm, isNeutered: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currentFoodBrand">Current Food Brand</Label>
                            <Input
                                id="currentFoodBrand"
                                value={petForm.currentFoodBrand}
                                onChange={(e) => setPetForm({ ...petForm, currentFoodBrand: e.target.value })}
                                placeholder="What food brand does your pet currently eat?"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="healthConditions">Health Conditions</Label>
                            <Textarea
                                id="healthConditions"
                                value={petForm.healthConditions}
                                onChange={(e) => setPetForm({ ...petForm, healthConditions: e.target.value })}
                                placeholder="Any known health conditions, medications, or special needs"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="allergies">Food Allergies/Sensitivities</Label>
                            <Textarea
                                id="allergies"
                                value={petForm.allergies}
                                onChange={(e) => setPetForm({ ...petForm, allergies: e.target.value })}
                                placeholder="Any known food allergies or sensitivities"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                onClick={isEditingPet ? handleEditPet : handleAddPet}
                                className="flex items-center gap-2"
                                disabled={saving}
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {saving ? 'Saving...' : (isEditingPet ? 'Update Pet' : 'Save Pet')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {pets.length === 0 && !isAddingPet && !isEditingPet && (
                <Card className="text-center py-12">
                    <CardContent>
                        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No pets added yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Add your pet's details to get personalized nutrition recommendations and AI health insights
                        </p>
                        <Button onClick={() => setIsAddingPet(true)} className="flex items-center gap-2 mx-auto">
                            <PlusCircle className="h-4 w-4" />
                            Add Your First Pet
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PetDetailsForm;