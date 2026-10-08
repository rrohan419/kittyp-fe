import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from '@/services/cartService';

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

type PlacePrediction = { placeId: string; description: string };
type PlaceDetailsApi = {
  name: string;
  formattedAddress: string;
  addressComponents: { longName: string; shortName: string; types: string[] }[];
  latitude: number | null;
  longitude: number | null;
};

function placesBase(publicApi: boolean): string {
  return publicApi ? '/public/places' : '/places';
}

export async function fetchPlacePredictions(
  query: string,
  sessionToken: string,
  publicApi: boolean
): Promise<PlacePrediction[]> {
  const res = await axiosInstance.post<
    ApiSuccessResponse<{ predictions: PlacePrediction[] }>
  >(`${placesBase(publicApi)}/autocomplete`, { query, sessionToken });
  return res.data.data?.predictions ?? [];
}

export async function fetchPlaceDetails(
  placeId: string,
  sessionToken: string,
  publicApi: boolean
): Promise<ParsedClinicAddress> {
  const res = await axiosInstance.post<ApiSuccessResponse<PlaceDetailsApi>>(
    `${placesBase(publicApi)}/details`,
    { placeId, sessionToken }
  );
  const d = res.data.data;
  return parsePlaceAddress({
    name: d.name,
    formatted_address: d.formattedAddress,
    address_components: (d.addressComponents ?? []).map((c) => ({
      long_name: c.longName,
      short_name: c.shortName,
      types: c.types,
    })),
    geometry:
      d.latitude != null && d.longitude != null
        ? { location: { lat: () => d.latitude as number, lng: () => d.longitude as number } }
        : null,
  });
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
