import type { InjectionToken } from "@nestjs/common";
import type { GtfsRealtimeProvider } from "./gtfs-realtime-providers/gtfs-realtime-provider";

/**
 * Injection token identifying the map of registered GTFS Realtime feed providers.
 */
export const GTFS_RT_PROVIDERS: InjectionToken<Map<string, GtfsRealtimeProvider>> = "GTFS_RT_PROVIDERS";