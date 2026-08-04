import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, MapPin, Languages } from 'lucide-react';
import { VetProfile } from '../../types/scheduling';
import { useScheduling } from '@/context/SchedulingContext';

interface VetListProps {
  vets: VetProfile[];
  onSelectVet: (vet: VetProfile) => void;
}

export const VetList: React.FC<VetListProps> = ({ vets, onSelectVet }) => {
  if (vets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No veterinarians found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {vets.map((vet) => (
        <Card key={vet.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={vet.profileImage} alt={vet.fullName} />
                  <AvatarFallback>
                    {vet.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {vet.fullName}
                    {vet.isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{vet.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({vet.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">${vet.consultationPrice}</p>
                <p className="text-sm text-muted-foreground">per consultation</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{vet.bio}</p>
              
              <div className="flex flex-wrap gap-2">
                {vet.specializations.map((spec) => (
                  <Badge key={spec} variant="outline">
                    {spec}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {vet.experience} years exp.
                  </div>
                  <div className="flex items-center gap-1">
                    <Languages className="h-4 w-4" />
                    {vet.languages.join(', ')}
                  </div>
                </div>
                <Button onClick={() => onSelectVet(vet)}>
                  Book Consultation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};