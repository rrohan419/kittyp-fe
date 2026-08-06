import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { IndianRupee, Percent, Clock, TrendingUp } from 'lucide-react';
import { VetAvailability } from '@/types/scheduling';
import { formatInr, INR_DEFAULT_PRICES } from '@/services/availabilityService';

interface PricingSettingsProps {
  availability: VetAvailability[];
  onChange: (availability: VetAvailability[]) => void;
}

const CONSULTATION_TYPES = [
  { 
    value: 'general', 
    label: 'General Consultation', 
    description: 'Standard veterinary consultation',
    basePrice: INR_DEFAULT_PRICES.general 
  },
  { 
    value: 'emergency', 
    label: 'Emergency', 
    description: 'Urgent care and emergency consultations',
    basePrice: INR_DEFAULT_PRICES.emergency 
  },
  { 
    value: 'follow-up', 
    label: 'Follow-up', 
    description: 'Follow-up appointments for existing cases',
    basePrice: INR_DEFAULT_PRICES['follow-up'] 
  },
  { 
    value: 'specialist', 
    label: 'Specialist', 
    description: 'Specialized consultations requiring expertise',
    basePrice: INR_DEFAULT_PRICES.specialist 
  },
];

export const PricingSettings: React.FC<PricingSettingsProps> = ({
  availability,
  onChange
}) => {
  const [globalPricing, setGlobalPricing] = useState({
    general: INR_DEFAULT_PRICES.general,
    emergency: INR_DEFAULT_PRICES.emergency,
    'follow-up': INR_DEFAULT_PRICES['follow-up'],
    specialist: INR_DEFAULT_PRICES.specialist,
  });

  const updateGlobalPricing = (type: string, price: number) => {
    const updatedAvailability = availability.map(slot => {
      if (slot.consultationType === type) {
        return { ...slot, price };
      }
      return slot;
    });
    onChange(updatedAvailability);
  };

  const applyBulkPriceChange = (changeType: 'percentage' | 'fixed', value: number, consultationType?: string) => {
    const updatedAvailability = availability.map(slot => {
      if (consultationType && slot.consultationType !== consultationType) {
        return slot;
      }

      let newPrice = slot.price;
      if (changeType === 'percentage') {
        newPrice = Math.round(slot.price * (1 + value / 100));
      } else {
        newPrice = Math.round(slot.price + value);
      }

      return { ...slot, price: Math.max(1, newPrice) }; // Minimum ₹1
    });
    onChange(updatedAvailability);
  };

  const getPriceStats = () => {
    const pricesByType = availability.reduce((acc, slot) => {
      if (!acc[slot.consultationType]) {
        acc[slot.consultationType] = [];
      }
      acc[slot.consultationType].push(slot.price);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(pricesByType).map(([type, prices]) => {
      const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      
      return {
        type,
        avg: Math.round(avg),
        min,
        max,
        count: prices.length
      };
    });
  };

  const priceStats = getPriceStats();

  return (
    <div className="space-y-6">
      {/* Global Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Global Pricing Settings (INR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONSULTATION_TYPES.map(type => (
              <div key={type.value} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{type.label}</Label>
                  <Badge variant="outline">{formatInr(type.basePrice)} suggested</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Price (INR)"
                    value={globalPricing[type.value as keyof typeof globalPricing]}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 0;
                      setGlobalPricing(prev => ({ ...prev, [type.value]: newValue }));
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => updateGlobalPricing(type.value, globalPricing[type.value as keyof typeof globalPricing])}
                  >
                    Apply to All
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Price Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Bulk Price Adjustments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Percentage Increase/Decrease</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="e.g., 10 for 10% increase"
                  id="percentage-change"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById('percentage-change') as HTMLInputElement;
                    const value = parseFloat(input.value) || 0;
                    applyBulkPriceChange('percentage', value);
                    input.value = '';
                  }}
                >
                  Apply %
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Fixed Amount Increase/Decrease</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="e.g., 100 for +₹100"
                  id="fixed-change"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById('fixed-change') as HTMLInputElement;
                    const value = parseFloat(input.value) || 0;
                    applyBulkPriceChange('fixed', value);
                    input.value = '';
                  }}
                >
                  Apply ₹
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Quick Adjustments</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyBulkPriceChange('percentage', 10)}
              >
                +10%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyBulkPriceChange('percentage', -10)}
              >
                -10%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyBulkPriceChange('fixed', 100)}
              >
                +₹100
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyBulkPriceChange('fixed', -100)}
              >
                -₹100
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Current Pricing Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {priceStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priceStats.map(stat => (
                <div key={stat.type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{stat.type}</h4>
                    <Badge variant="secondary">{stat.count} slots</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average:</span>
                      <span className="font-medium">{formatInr(stat.avg)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Range:</span>
                      <span className="font-medium">{formatInr(stat.min)} - {formatInr(stat.max)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No availability slots configured yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Individual Slot Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Individual Slot Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availability.map(slot => {
              const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot.dayOfWeek];
              
              return (
                <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{dayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {slot.consultationType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={slot.price}
                      onChange={(e) => {
                        const newPrice = parseInt(e.target.value) || 0;
                        const updatedAvailability = availability.map(s =>
                          s.id === slot.id ? { ...s, price: newPrice } : s
                        );
                        onChange(updatedAvailability);
                      }}
                      className="w-20"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};