import * as fs from 'fs';
import proj4 from 'proj4';

// Define the UTM Zone 32N projection formula used by the Trentino Geoportal
// (EPSG:32632 -> WGS84)
const UTM32N = "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs";
const WGS84 = "EPSG:4326";

interface GeoJsonFeature {
    type: "Feature";
    geometry: {
        type: "Point" | "Polygon" | "MultiPolygon";
        coordinates: any;
    };
    properties: {
        name?: string;
        nome?: string;
        [key: string]: any;
    };
}

interface GeoJsonCollection {
    type: "FeatureCollection";
    features: GeoJsonFeature[];
}

interface DatasetConfig {
    inputPath: string;
    outputPath: string;
    isBike: boolean;
    defaultName: string;
}

/**
 * Recursively flattens coordinates, averages them, and converts 
 * from Trentino UTM Zone 32N metrics to standard WGS84 GPS degrees.
 */
function getCentroid(geometry: GeoJsonFeature['geometry']): [number, number] {
    const type = geometry.type;
    const coords = geometry.coordinates;

    if (type === "Point") {
        // Convert a single point from UTM to GPS degrees
        const [wgsLon, wgsLat] = proj4(UTM32N, WGS84, [coords[0], coords[1]]);
        return [wgsLon, wgsLat];
    }

    const points: [number, number][] = [];

    function extractPoints(array: any) {
        if (Array.isArray(array) && array.length >= 2 && typeof array[0] === 'number' && typeof array[1] === 'number') {
            points.push([array[0], array[1]]);
        } else if (Array.isArray(array)) {
            for (const item of array) {
                extractPoints(item);
            }
        }
    }

    extractPoints(coords);

    if (points.length === 0) {
        throw new Error(`Zero valid coordinates found while parsing geometry structure.`);
    }

    // Calculate the average in UTM meters metric space
    let totalUtmLon = 0;
    let totalUtmLat = 0;

    for (const pt of points) {
        totalUtmLon += pt[0];
        totalUtmLat += pt[1];
    }

    const avgUtmLon = totalUtmLon / points.length;
    const avgUtmLat = totalUtmLat / points.length;

    // Convert the final center point from UTM Zone 32N metric to standard WGS84 GPS degrees
    const [finalLon, finalLat] = proj4(UTM32N, WGS84, [avgUtmLon, avgUtmLat]);

    // Sanity check coordinates range
    if (finalLon < -180 || finalLon > 180 || finalLat < -90 || finalLat > 90) {
        throw new Error(`Calculated centroid values out of geographic bounds: Lon ${finalLon}, Lat ${finalLat}`);
    }

    return [finalLon, finalLat];
}

function convertGeoJsonToOsm(config: DatasetConfig, startingId: number): number {
    console.log(`Processing: ${config.inputPath} -> ${config.outputPath}...`);

    if (!fs.existsSync(config.inputPath)) {
        console.error(`Error: Input file not found at ${config.inputPath}`);
        return startingId;
    }

    const rawData = fs.readFileSync(config.inputPath, 'utf8');
    const geojson: GeoJsonCollection = JSON.parse(rawData);

    const xmlLines: string[] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<osm version="0.6" generator="trentino_dual_converter">'
    ];

    let currentId = startingId;

    for (const feature of geojson.features) {
        try {
            const [lon, lat] = getCentroid(feature.geometry);

            const rawName = feature.properties.name || feature.properties.nome || config.defaultName;
            const name = rawName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

            xmlLines.push(`  <node id="${currentId}" lat="${lat}" lon="${lon}" version="1" timestamp="2026-01-01T00:00:00Z" changeset="1" uid="1" user="osm">`);

            if (config.isBike) {
                xmlLines.push('    <tag k="amenity" v="bicycle_parking"/>');
            } else {
                xmlLines.push('    <tag k="amenity" v="parking"/>');
            }

            xmlLines.push('    <tag k="park_ride" v="yes"/>');
            xmlLines.push(`    <tag k="name" v="${name}"/>`);
            xmlLines.push('  </node>');

            currentId--;
        } catch (err: any) {
            console.warn(`Skipping a feature due to parsing error:`, err.message);
        }
    }

    xmlLines.push('\n</osm>');

    fs.writeFileSync(config.outputPath, xmlLines.join('\n'), 'utf8');
    const totalProcessed = startingId - currentId;
    console.log(`Successfully generated ${config.outputPath} (${totalProcessed} entities mapped).\n`);

    return currentId;
}

// --- Execution Configuration ---
// Adjust these filenames to match exactly what you downloaded from the Geoportal
const datasets: DatasetConfig[] = [
    {
        inputPath: "./zone_parcheggio.geojson",
        outputPath: "./trentino_zone_parcheggio.osm",
        isBike: false,
        defaultName: "Parcheggio Auto (Geoportale)"
    },
    {
        inputPath: "./parcheggi_attestamento.geojson",
        outputPath: "./trentino_car_parks.osm",
        isBike: false,
        defaultName: "Parcheggio Auto (Geoportale)"
    },
    {
        inputPath: "./parcheggio_protetto_bike.geojson",
        outputPath: "./trentino_bike_parks.osm",
        isBike: true,
        defaultName: "Parcheggio Bici (Geoportale)"
    }
];

// Run the loop tracking global negative IDs across both outputs
let globalIdTracker = -1;
datasets.forEach((dataset) => {
    globalIdTracker = convertGeoJsonToOsm(dataset, globalIdTracker);
});