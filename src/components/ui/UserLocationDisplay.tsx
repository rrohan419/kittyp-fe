import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface UserLocationDisplayProps {
  onLocationUpdate?: (location: LocationData | null) => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  showCard?: boolean;
  className?: string;
  autoRequest?: boolean;
}

const UserLocationDisplay: React.FC<UserLocationDisplayProps> = ({
  onLocationUpdate,
  onPermissionGranted,
  onPermissionDenied,
  showCard = true,
  className = '',
  autoRequest = false
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if geolocation is supported
  const isGeolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    if (!isGeolocationSupported) {
      setPermissionStatus('denied');
      setError('Geolocation is not supported in this browser');
      return;
    }

    try {
      // Check if we have permission
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt');

      // Listen for permission changes
      permission.onchange = () => {
        setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt');
      };
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      setPermissionStatus('prompt');
    }
  }, [isGeolocationSupported]);

  // Get current location with fallback
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!isGeolocationSupported) {
      throw new Error('Geolocation is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const tryGetLocation = (highAccuracy: boolean) => {
        const options = {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 30000 : 15000, // 30s for high accuracy, 15s for low
          maximumAge: 60000 // Cache for 1 minute
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            resolve(locationData);
          },
          (error) => {
            if (error.code === error.TIMEOUT && highAccuracy) {
              // Try again with lower accuracy if high accuracy times out
              console.log('High accuracy timeout, trying with lower accuracy...');
              tryGetLocation(false);
              return;
            }
            
            let errorMessage = 'Failed to get location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again or check your GPS settings.';
                break;
            }
            reject(new Error(errorMessage));
          },
          options
        );
      };

      // Start with high accuracy
      tryGetLocation(true);
    });
  }, [isGeolocationSupported]);

  // Request location permission and get location
  const requestLocationPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
      setPermissionStatus('granted');
      onLocationUpdate?.(locationData);
      onPermissionGranted?.();
    } catch (error: any) {
      setError(error.message);
      setPermissionStatus('denied');
      onPermissionDenied?.();
      toast.error(error.message || 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentLocation, onLocationUpdate, onPermissionGranted, onPermissionDenied]);

  // Auto-request location if enabled
  useEffect(() => {
    if (autoRequest && permissionStatus === 'prompt') {
      requestLocationPermission();
    }
  }, [autoRequest, permissionStatus, requestLocationPermission]);

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  // Format coordinates for display
  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Get location status badge
  const getStatusBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Location Available</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Location Denied</Badge>;
      case 'loading':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Loading...</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Permission Required</Badge>;
    }
  };

  // If not showing card, return just the location data
  if (!showCard) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Location Access</span>
              </CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissionStatus === 'granted' && location ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Location successfully obtained</span>
                </div>
                <div className="bg-primary/5 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Coordinates</span>
                  </div>
                  <p className="text-sm font-mono bg-background/50 rounded px-2 py-1">
                    {formatCoordinates(location.latitude, location.longitude)}
                  </p>
                  {location.accuracy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Accuracy: ±{Math.round(location.accuracy)}m
                    </p>
                  )}
                </div>
              </motion.div>
            ) : permissionStatus === 'denied' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Location access denied</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Location access is required for personalized nutrition recommendations. 
                  Please enable location permissions in your browser settings.
                </p>
                <Button
                  onClick={requestLocationPermission}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Requesting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 text-sm text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Location permission required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We need your location to provide personalized nutrition recommendations 
                  based on local availability and regional factors.
                </p>
                <Button
                  onClick={requestLocationPermission}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Allow Location Access
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Error: {error}</span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserLocationDisplay; 