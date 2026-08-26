export interface AddressSuggestion {
  placeId: string;
  description: string;
}

export interface StructuredAddress {
  line1: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

/**
 * Every address/geocoding service (Google, Mapbox, LocationIQ, ...) implements
 * this interface so the checkout UI never depends on a specific provider's
 * SDK or REST shape. All calls happen server-side (see src/app/api/geo/*)
 * so the API key is never sent to the browser.
 */
export interface GeoProvider {
  isConfigured(): boolean;
  autocomplete(query: string, sessionToken: string, opts?: { countryCode?: string }): Promise<AddressSuggestion[]>;
  placeDetails(placeId: string, sessionToken: string): Promise<StructuredAddress>;
  reverseGeocode(lat: number, lng: number): Promise<StructuredAddress>;
}

export class NotConfiguredGeoProvider implements GeoProvider {
  isConfigured(): boolean {
    return false;
  }

  async autocomplete(): Promise<AddressSuggestion[]> {
    throw new Error("Address search isn't configured yet. Set GOOGLE_MAPS_API_KEY in your environment to enable it.");
  }

  async placeDetails(): Promise<StructuredAddress> {
    throw new Error("Address search isn't configured yet. Set GOOGLE_MAPS_API_KEY in your environment to enable it.");
  }

  async reverseGeocode(): Promise<StructuredAddress> {
    throw new Error("Location lookup isn't configured yet. Set GOOGLE_MAPS_API_KEY in your environment to enable it.");
  }
}
