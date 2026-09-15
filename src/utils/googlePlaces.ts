import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_API_KEY } from '@/config/env';

export type PlaceAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type PlaceLike = {
  name?: string;
  formatted_address?: string;
  address_components?: PlaceAddressComponent[];
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    } | null;
  } | null;
};

export type ParsedClinicAddress = {
  formattedAddress: string;
  street: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
};

export const EMPTY_CLINIC_ADDRESS: ParsedClinicAddress = {
  formattedAddress: '',
  street: '',
  city: '',
  district: '',
  state: '',
  postalCode: '',
  country: '',
  latitude: null,
  longitude: null,
};

let optionsReady = false;
let placesPromise: Promise<google.maps.PlacesLibrary> | null = null;

export function hasGoogleMapsApiKey(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY.trim());
}

export function loadPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  if (!hasGoogleMapsApiKey()) {
    return Promise.reject(new Error('Google Maps API key is not configured'));
  }
  if (!optionsReady) {
    setOptions({ key: GOOGLE_MAPS_API_KEY.trim(), v: 'weekly' });
    optionsReady = true;
  }
  if (!placesPromise) {
    placesPromise = importLibrary('places');
  }
  return placesPromise;
}

function componentOf(components: PlaceAddressComponent[], type: string): string {
  return components.find((c) => c.types.includes(type))?.long_name ?? '';
}

function uniqueJoin(parts: string[], separator = ' '): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out.join(separator);
}

export function parsePlaceAddress(place: PlaceLike): ParsedClinicAddress {
  const components = place.address_components ?? [];
  const line = uniqueJoin([
    componentOf(components, 'premise'),
    componentOf(components, 'subpremise'),
    componentOf(components, 'street_number'),
    componentOf(components, 'route'),
  ]);
  const city =
    componentOf(components, 'locality') ||
    componentOf(components, 'postal_town') ||
    componentOf(components, 'sublocality_level_1') ||
    componentOf(components, 'sublocality') ||
    componentOf(components, 'administrative_area_level_3') ||
    '';
  const neighborhood =
    componentOf(components, 'neighborhood') ||
    componentOf(components, 'sublocality_level_2') ||
    componentOf(components, 'sublocality');
  const name = place.name?.trim() ?? '';
  const street = uniqueJoin(
    [
      name && name.toLowerCase() !== line.toLowerCase() ? name : '',
      line,
      neighborhood && neighborhood.toLowerCase() !== city.toLowerCase() ? neighborhood : '',
    ],
    ', '
  );
  const loc = place.geometry?.location;
  const lat = loc ? loc.lat() : NaN;
  const lng = loc ? loc.lng() : NaN;
  return {
    formattedAddress: place.formatted_address?.trim() ?? '',
    street,
    city,
    district: componentOf(components, 'administrative_area_level_2'),
    state: componentOf(components, 'administrative_area_level_1'),
    postalCode: componentOf(components, 'postal_code'),
    country: componentOf(components, 'country'),
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
  };
}

export function stitchClinicAddress(parsed: ParsedClinicAddress): string {
  const formatted = parsed.formattedAddress.trim();
  if (formatted) return formatted;
  return [parsed.street, parsed.city, parsed.district, parsed.state, parsed.postalCode, parsed.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}

export function toClinicGeoPayload(parsed: ParsedClinicAddress): {
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
} {
  const address = stitchClinicAddress(parsed);
  return {
    address: address || undefined,
    city: parsed.city.trim() || undefined,
    latitude: parsed.latitude ?? undefined,
    longitude: parsed.longitude ?? undefined,
  };
}
