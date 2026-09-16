import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import {
  type ParsedClinicAddress,
  fetchPlaceDetails,
  fetchPlacePredictions,
  stitchClinicAddress,
} from '@/utils/googlePlaces';

type Props = {
  value: ParsedClinicAddress;
  onChange: (next: ParsedClinicAddress) => void;
  disabled?: boolean;
  idPrefix?: string;
  publicApi?: boolean;
};

type Suggestion = {
  placeId: string;
  description: string;
};

function newSessionToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ClinicAddressSearch({
  value,
  onChange,
  disabled,
  idPrefix = 'clinic-address',
  publicApi = false,
}: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const sessionTokenRef = useRef(newSessionToken());
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState('');
  const skipPredictRef = useRef(false);

  useEffect(() => {
    if (disabled) return;
    if (skipPredictRef.current) {
      skipPredictRef.current = false;
      return;
    }
    const input = query.trim();
    if (input.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const handle = window.setTimeout(() => {
      void fetchPlacePredictions(input, sessionTokenRef.current, publicApi)
        .then((predictions) => {
          setLoadError('');
          setSuggestions(predictions);
          setOpen(predictions.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setOpen(false);
          setLoadError('Address search is unavailable. Enter city, state, and postal code manually.');
        });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, disabled, publicApi]);

  const applyPlace = (placeId: string, description: string) => {
    void fetchPlaceDetails(placeId, sessionTokenRef.current, publicApi)
      .then((parsed) => {
        onChangeRef.current(parsed);
        skipPredictRef.current = true;
        setQuery(description);
        setSuggestions([]);
        setOpen(false);
        sessionTokenRef.current = newSessionToken();
      })
      .catch(() => {
        setLoadError('Could not load that address. Enter it manually.');
      });
  };

  const patch = (field: keyof ParsedClinicAddress, nextVal: string) => {
    const next = { ...value, [field]: nextVal, formattedAddress: '' };
    onChange({ ...next, formattedAddress: stitchClinicAddress(next) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-search`}>Search Clinic Address / Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
          <Input
            id={`${idPrefix}-search`}
            name={`${idPrefix}-search`}
            autoComplete="off"
            className="pl-10"
            placeholder="Search a clinic, landmark, or street in India"
            value={query}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestions[0]) applyPlace(suggestions[0].placeId, suggestions[0].description);
              }
              if (e.key === 'Escape') setOpen(false);
            }}
          />
          {open && suggestions.length > 0 ? (
            <ul
              className="absolute z-[10000] mt-1 max-h-56 w-full overflow-auto rounded-md border border-input bg-popover text-popover-foreground shadow-md"
              role="listbox"
            >
              {suggestions.map((suggestion) => (
                <li key={suggestion.placeId}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyPlace(suggestion.placeId, suggestion.description)}
                  >
                    {suggestion.description}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {loadError ? (
          <p className="text-xs text-destructive">{loadError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Pick a suggestion, then edit the parsed fields if needed.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-street`}>Street</Label>
          <Input
            id={`${idPrefix}-street`}
            name={`${idPrefix}-street`}
            autoComplete="street-address"
            placeholder="Street / building"
            value={value.street}
            disabled={disabled}
            onChange={(e) => patch('street', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-city`}>City</Label>
          <Input
            id={`${idPrefix}-city`}
            name={`${idPrefix}-city`}
            autoComplete="address-level2"
            placeholder="City"
            value={value.city}
            disabled={disabled}
            onChange={(e) => patch('city', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-state`}>State</Label>
          <Input
            id={`${idPrefix}-state`}
            name={`${idPrefix}-state`}
            autoComplete="address-level1"
            placeholder="State"
            value={value.state}
            disabled={disabled}
            onChange={(e) => patch('state', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-district`}>District</Label>
          <Input
            id={`${idPrefix}-district`}
            name={`${idPrefix}-district`}
            placeholder="District"
            value={value.district}
            disabled={disabled}
            onChange={(e) => patch('district', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-postal`}>Postal code</Label>
          <Input
            id={`${idPrefix}-postal`}
            name={`${idPrefix}-postal`}
            autoComplete="postal-code"
            placeholder="Postal code"
            value={value.postalCode}
            disabled={disabled}
            onChange={(e) => patch('postalCode', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-country`}>Country</Label>
          <Input
            id={`${idPrefix}-country`}
            name={`${idPrefix}-country`}
            autoComplete="country-name"
            placeholder="Country"
            value={value.country}
            disabled={disabled}
            onChange={(e) => patch('country', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
