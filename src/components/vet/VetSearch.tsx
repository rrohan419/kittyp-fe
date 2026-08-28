import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, Clock, Star, MapPin } from 'lucide-react';
import { BookingFilters } from '../../types/scheduling';
import { useScheduling } from '@/context/SchedulingContext';

interface VetSearchProps {
  onSearch?: (filters: BookingFilters) => void;
  onFiltersChange?: (filters: BookingFilters) => void;
}

const specializations = [
  'General Practice',
  'Dermatology',
  'Cardiology',
  'Orthopedics',
  'Surgery',
  'Dentistry',
  'Exotic Animals',
  'Emergency Care'
];

const languages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Hindi',
  'Mandarin'
];

export const VetSearch: React.FC<VetSearchProps> = ({ onSearch, onFiltersChange }) => {
  const { searchVets, isLoading } = useScheduling();
  const [filters, setFilters] = useState<BookingFilters>({
    specializations: [],
    priceRange: [50, 200],
    languages: [],
    rating: 4.0,
    consultationType: 'general'
  });

  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSpecializationChange = (spec: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedSpecs, spec]
      : selectedSpecs.filter(s => s !== spec);
    
    setSelectedSpecs(updated);
    updateFilters({ specializations: updated });
  };

  const handleLanguageChange = (lang: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedLangs, lang]
      : selectedLangs.filter(l => l !== lang);
    
    setSelectedLangs(updated);
    updateFilters({ languages: updated });
  };

  const updateFilters = (newFilters: Partial<BookingFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);
  };

  const handleSearch = async () => {
    if (onSearch) {
      await onSearch(filters);
    } else {
      await searchVets(filters);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search size={20} />
          Find Your Perfect Veterinarian
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Consultation Type</Label>
            <Select 
              value={filters.consultationType || 'general'} 
              onValueChange={(value) => updateFilters({ consultationType: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Consultation</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="specialist">Specialist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Minimum Rating</Label>
            <Select 
              value={filters.rating?.toString() || '4.0'} 
              onValueChange={(value) => updateFilters({ rating: parseFloat(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3.0">3.0+ Stars</SelectItem>
                <SelectItem value="3.5">3.5+ Stars</SelectItem>
                <SelectItem value="4.0">4.0+ Stars</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="mt-6"
          >
            {isLoading ? 'Searching...' : 'Search Vets'}
          </Button>
        </div>

        {/* Advanced Filters Toggle */}
        <Button 
          variant="outline" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          <Filter size={16} className="mr-2" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {showAdvanced && (
          <div className="space-y-6 p-4 bg-muted/20 rounded-lg">
            {/* Price Range */}
            <div>
              <Label className="mb-4 block">
                Price Range: ₹{filters.priceRange?.[0]?.toLocaleString('en-IN')} - ₹{filters.priceRange?.[1]?.toLocaleString('en-IN')}
              </Label>
              <Slider
                value={filters.priceRange || [50, 200]}
                onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                max={300}
                min={25}
                step={25}
                className="w-full"
              />
            </div>

            {/* Specializations */}
            <div>
              <Label className="mb-3 block">Specializations</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {specializations.map((spec) => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={spec}
                      checked={selectedSpecs.includes(spec)}
                      onCheckedChange={(checked) => 
                        handleSpecializationChange(spec, checked as boolean)
                      }
                    />
                    <Label htmlFor={spec} className="text-sm">
                      {spec}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <Label className="mb-3 block">Languages</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {languages.map((lang) => (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox
                      id={lang}
                      checked={selectedLangs.includes(lang)}
                      onCheckedChange={(checked) => 
                        handleLanguageChange(lang, checked as boolean)
                      }
                    />
                    <Label htmlFor={lang} className="text-sm">
                      {lang}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};