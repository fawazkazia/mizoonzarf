import { GooglePlacesProvider } from "./google";
import { NotConfiguredGeoProvider } from "./provider";
import type { GeoProvider } from "./provider";

const googleProvider = new GooglePlacesProvider();
const fallbackProvider = new NotConfiguredGeoProvider();

export function getGeoProvider(): GeoProvider {
  return googleProvider.isConfigured() ? googleProvider : fallbackProvider;
}
