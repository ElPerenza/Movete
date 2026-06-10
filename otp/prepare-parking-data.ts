import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import unzipper from "unzipper";
import * as fs from 'fs';
import * as turf from '@turf/turf';
import proj4 from 'proj4';

/**
 * Download and extract and entire zip archive to the given location.
 */
async function downloadAndExtractZipArchive(url: string, location: string) {
    const body = await (await fetch(url)).arrayBuffer();
    const zip = await unzipper.Open.buffer(Buffer.from(body));
    await zip.extract({ path: location });
}

function reprojectCoords(coords: [number, number]): [number, number] {
    return proj4("EPSG:25832", "EPSG:4326", coords) as [number, number];
}

/**
 * Helper to safely escape characters for XML attributes
 */
function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

const baseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data");
const tempDir = path.resolve(baseDir, "temp");

const trentoParkingZonesUrl  = "https://gis.comune.trento.it/dbexport?db=base&sc=mobilita&ly=zone_parcheggio&fr=geojson";
const trentoBikeParkingSpotsUrl = "https://gis.comune.trento.it/dbexport?db=base&sc=mobilita&ly=parcheggio_protetto_bike&fr=geojson";
const trentoParkingSpotsUrl = "https://gis.comune.trento.it/dbexport?db=base&sc=mobilita&ly=parcheggi_attestamento&fr=geojson";

const parkingZones = `${tempDir}/zone_parcheggio.geojson`;
const bikeParking = `${tempDir}/parcheggio_protetto_bike.geojson`;
const parkingSpots = `${tempDir}/parcheggi_attestamento.geojson`;
const consolidatedParkingData = `${tempDir}/trentino_parkings.osm`;

await mkdir(baseDir, { recursive: true });
await mkdir(tempDir, { recursive: true });

// download GeoJSON parking data
await Promise.all([
    downloadAndExtractZipArchive(trentoParkingZonesUrl, tempDir),
    downloadAndExtractZipArchive(trentoBikeParkingSpotsUrl, tempDir),
    downloadAndExtractZipArchive(trentoParkingSpotsUrl, tempDir)
]);

// Configure Projection definitions: EPSG:25832 (UTM 32N) -> EPSG:4326 (WGS84)
proj4.defs("EPSG:25832", "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs");

const xmlNodes: string[] = [];
let nodeIdCounter = 1000000000; // Safe artificial pool for unique OSM node IDs

// Base XML template strings
const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<osm version="0.6" generator="trentino_parking_converter">`;
const xmlFooter = `</osm>`;

// Metadata attributes required for strict OSM v0.6 verification
const baseMeta = 'version="1" timestamp="2026-01-01T00:00:00Z" changeset="1" uid="1" user="osm"';

// ==========================================
// Interfaces matching GeoJSON properties
// ==========================================
interface AttestamentoProperties {
    id?: number;
    fumetto?: string;
    tipologia?: string;
    sosta?: string;
    "stalli auto"?: number | null;
}

interface ZoneParcheggioProperties {
    zona?: string;
    fumetto?: string;
    descrizione?: string;
}

interface ProtettoBikeProperties {
    park?: string;
    fumetto?: string;
    posti?: number;
}

// ==========================================
// 1. Process: parcheggi_attestamento.geojson
// ==========================================
if (fs.existsSync(parkingSpots)) {
    const rawData = JSON.parse(fs.readFileSync(parkingSpots, 'utf8')) as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, AttestamentoProperties>;
    
    rawData.features.forEach(feature => {
        const centroid = turf.centroid(feature);
        const sourceCoords = centroid.geometry.coordinates as [number, number];
        const [lon, lat] = reprojectCoords(sourceCoords);

        const props = feature.properties || {};
        const name = props.fumetto || `Parcheggio Attestamento ${props.id || ''}`;
        const capacity = props["stalli auto"] ? String(props["stalli auto"]) : '0';

        let nodeXml = `  <node id="${nodeIdCounter++}" lat="${lat}" lon="${lon}" ${baseMeta}>\n`;
        nodeXml += `    <tag k="amenity" v="parking"/>\n`;
        nodeXml += `    <tag k="parking" v="surface"/>\n`;
        nodeXml += `    <tag k="park_ride" v="yes"/>\n`;
        nodeXml += `    <tag k="access" v="public"/>\n`;
        nodeXml += `    <tag k="name" v="${escapeXml(name.trim())}"/>\n`;
        nodeXml += `    <tag k="capacity" v="${escapeXml(capacity)}"/>\n`;
        nodeXml += `  </node>`;
        xmlNodes.push(nodeXml);
    });
    console.log(`Processed ${rawData.features.length} car park and rides.`);
}

// ==========================================
// 2. Process: zone_parcheggio.geojson
// ==========================================
if (fs.existsSync(parkingZones)) {
    const rawData = JSON.parse(fs.readFileSync(parkingZones, 'utf8')) as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, ZoneParcheggioProperties>;
    
    rawData.features.forEach(feature => {
        const centroid = turf.centroid(feature);
        const sourceCoords = centroid.geometry.coordinates as [number, number];
        const [lon, lat] = reprojectCoords(sourceCoords);

        const props = feature.properties || {};
        const name = props.fumetto || props.descrizione || `Zona Parcheggio ${props.zona || ''}`;

        let nodeXml = `  <node id="${nodeIdCounter++}" lat="${lat}" lon="${lon}" ${baseMeta}>\n`;
        nodeXml += `    <tag k="amenity" v="parking"/>\n`;
        nodeXml += `    <tag k="access" v="public"/>\n`;
        nodeXml += `    <tag k="name" v="${escapeXml(name.trim())}"/>\n`;
        if (props.zona) {
            nodeXml += `    <tag k="zone" v="${escapeXml(props.zona)}"/>\n`;
        }
        nodeXml += `  </node>`;
        xmlNodes.push(nodeXml);
    });
    console.log(`Processed ${rawData.features.length} city parking zones.`);
}

// ==========================================
// 3. Process: parcheggio_protetto_bike.geojson
// ==========================================
if (fs.existsSync(bikeParking)) {
    const rawData = JSON.parse(fs.readFileSync(bikeParking, 'utf8')) as GeoJSON.FeatureCollection<GeoJSON.Point, ProtettoBikeProperties>;
    
    rawData.features.forEach(feature => {
        const sourceCoords = feature.geometry.coordinates as [number, number];
        const [lon, lat] = reprojectCoords(sourceCoords);

        const props = feature.properties || {};
        const name = props.park || props.fumetto || 'Rimessaggio Biciclette';
        const capacity = props.posti ? String(props.posti) : '0';

        let nodeXml = `  <node id="${nodeIdCounter++}" lat="${lat}" lon="${lon}" ${baseMeta}>\n`;
        nodeXml += `    <tag k="amenity" v="bicycle_parking"/>\n`;
        nodeXml += `    <tag k="bicycle_parking" v="building"/>\n`;
        nodeXml += `    <tag k="access" v="public"/>\n`;
        nodeXml += `    <tag k="name" v="${escapeXml(name.trim())}"/>\n`;
        nodeXml += `    <tag k="capacity" v="${escapeXml(capacity)}"/>\n`;
        nodeXml += `  </node>`;
        xmlNodes.push(nodeXml);
    });
    console.log(`Processed ${rawData.features.length} bike storage parks.`);
}

// ==========================================
// 4. Output Consolidated XML File
// ==========================================
const finalXmlContent = `${xmlHeader}\n${xmlNodes.join('\n')}\n${xmlFooter}`;
fs.writeFileSync(consolidatedParkingData, finalXmlContent, 'utf8');
console.log('Successfully saved unified OSM XML file directly to "trentino_parkings.osm".');