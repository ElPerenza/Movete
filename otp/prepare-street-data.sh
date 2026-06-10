#!/bin/sh

baseDir="/data"
tempDir="${baseDir}/temp"

northEastItaly="${tempDir}/nord-est-latest.osm.pbf"
taaBoundary="${tempDir}/taa.pbf"
taaWithParking="${tempDir}/taa_with_parking.pbf"
taaFinal="${baseDir}/trentino_alto_adige.pbf"

parkingData="${tempDir}/trentino_parkings.osm"
parkingPbf="${baseDir}/trentino_parkings.pbf"

mkdir $tempDir

wget "https://download.geofabrik.de/europe/italy/nord-est-latest.osm.pbf" -O "$northEastItaly"

# get Trentino Alto Adige border (relation ID 45757) from PBF
osmium getid -r -t "$northEastItaly" r45757 -o "$taaBoundary"
# Extract only Trentino Alto Adige data from PBF
osmium extract -p "$taaBoundary" "$northEastItaly" -o "$taaWithParking"
# Remove all parking
osmium tags-filter "$taaWithParking" nwr/amenity=parking,bicycle_parking --invert-match -o "$taaFinal" --overwrite

# Create PBF file from parking data
osmium cat "$parkingData" -o "$parkingPbf" --overwrite

rm -r "$tempDir"