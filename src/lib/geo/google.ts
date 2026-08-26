import type { AddressSuggestion, GeoProvider, StructuredAddress } from "./provider";

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

function component(components: GoogleAddressComponent[], type: string, useShortName = false): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return "";
  return useShortName ? match.short_name : match.long_name;
}

function toStructuredAddress(components: GoogleAddressComponent[], lat?: number, lng?: number): StructuredAddress {
  const streetNumber = component(components, "street_number");
  const route = component(components, "route");
  const city =
    component(components, "locality") ||
    component(components, "postal_town") ||
    component(components, "sublocality_level_1") ||
    component(components, "administrative_area_level_2");

  return {
    line1: [streetNumber, route].filter(Boolean).join(" "),
    city,
    state: component(components, "administrative_area_level_1"),
    country: component(components, "country", true),
    postalCode: component(components, "postal_code"),
    lat,
    lng,
  };
}

const BASE_URL = "https://maps.googleapis.com/maps/api";

/**
 * Google Places (legacy Autocomplete/Details) + Geocoding REST APIs. Called
 * only from src/app/api/geo/* route handlers — GOOGLE_MAPS_API_KEY never
 * reaches the browser.
 */
export class GooglePlacesProvider implements GeoProvider {
  private get apiKey(): string | undefined {
    return process.env.GOOGLE_MAPS_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async autocomplete(query: string, sessionToken: string, opts?: { countryCode?: string }): Promise<AddressSuggestion[]> {
    const params = new URLSearchParams({
      input: query,
      key: this.apiKey!,
      sessiontoken: sessionToken,
      types: "address",
    });
    if (opts?.countryCode) params.set("components", `country:${opts.countryCode.toLowerCase()}`);

    const res = await fetch(`${BASE_URL}/place/autocomplete/json?${params.toString()}`);
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(data.error_message ?? `Google Places autocomplete failed (${data.status}).`);
    }

    return (data.predictions ?? []).map((p: { place_id: string; description: string }) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  }

  async placeDetails(placeId: string, sessionToken: string): Promise<StructuredAddress> {
    const params = new URLSearchParams({
      place_id: placeId,
      key: this.apiKey!,
      sessiontoken: sessionToken,
      fields: "address_component,geometry",
    });

    const res = await fetch(`${BASE_URL}/place/details/json?${params.toString()}`);
    const data = await res.json();
    if (data.status !== "OK") {
      throw new Error(data.error_message ?? `Google Places details failed (${data.status}).`);
    }

    const location = data.result?.geometry?.location;
    return toStructuredAddress(data.result?.address_components ?? [], location?.lat, location?.lng);
  }

  async reverseGeocode(lat: number, lng: number): Promise<StructuredAddress> {
    const params = new URLSearchParams({ latlng: `${lat},${lng}`, key: this.apiKey! });

    const res = await fetch(`${BASE_URL}/geocode/json?${params.toString()}`);
    const data = await res.json();
    if (data.status !== "OK") {
      throw new Error(data.error_message ?? `Google reverse geocoding failed (${data.status}).`);
    }

    const first = data.results?.[0];
    if (!first) throw new Error("We couldn't determine an address for your location.");
    return toStructuredAddress(first.address_components ?? [], lat, lng);
  }
}
