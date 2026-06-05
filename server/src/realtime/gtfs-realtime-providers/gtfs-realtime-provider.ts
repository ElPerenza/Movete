/**
 * Represents an object that can produce/provide a GTFS Realtime feed.
 */
export interface GtfsRealtimeProvider {
    /**
     * A GTFS Realtime feed containing trip updates.
     */
    get tripUpdatesFeed(): Uint8Array
}