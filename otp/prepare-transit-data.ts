import { createWriteStream } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";
import { createUnzip } from "zlib";

async function downloadFile(url: string, location: string) {
    const res = await fetch(url);
    await writeFile(location, Readable.fromWeb(res.body as ReadableStream<Uint8Array>));
}

/**
 * Download and extract a compressed file (not archive!).
 */
async function downloadAndExtractZippedFile(url: string, location: string) {
    return pipeline(
        Readable.fromWeb((await fetch(url)).body as ReadableStream<Uint8Array>), 
        createUnzip(), 
        createWriteStream(location)
    );
}

const baseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data");

const ttUrbanoGtfsUrl = "https://www.trentinotrasporti.it/opendata/google_transit_urbano_tte.zip";
const ttExtraurbanoGtfsUrl = "https://www.trentinotrasporti.it/opendata/google_transit_extraurbano_tte.zip";
const trenitaliaNetexUrl = "https://www.cciss.it/nap/mmtis/public/api/v1/download/blob/Asset/1080596/checkedResource";

await mkdir(baseDir, { recursive: true });
await mkdir(path.join(baseDir, "Trenitalia-netex"), { recursive: true });

// donwload all transit data needed by OTP
await Promise.all([
    downloadFile(ttUrbanoGtfsUrl, path.join(baseDir, "google_transit_urbano_tte.zip")),
    downloadFile(ttExtraurbanoGtfsUrl, path.join(baseDir, "google_transit_extraurbano_tte.zip")),
    downloadAndExtractZippedFile(trenitaliaNetexUrl, path.join(baseDir, "Trenitalia-netex/ITT-TRENITALIA-NeTEx_L1.xml"))
]);
