# Come usare lo script:
Nella cartella corrente mettere il file TN.pbf dalla cartella di OTP
dal sito https://dati.trentino.it/dataset/
scaricare il geoJson di
 - "zone_parcheggio"
 - "parcheggio_protetto_bike"
 - "parcheggi_attestamento"
posizionare i geojson in questa cartella e lanciare lo script "park-to-osm-converter"
npm install -g tsx
tsx park-to-osm-converter.ts

## Trasformare il file osm in pbf
usare il docker compose per trasformare il file .osm in pbf e per rimuovere dal file TN.pbf tutti i parcheggi di OSM
spostare i due PBF ottenuti
"TN_cleaned.pbf"
"trentino_parkings.pbf"
nella cartella di OTP:
e modificare la build-confg.json aggiungendo i nuovi .pbf:

{
    "osmCacheDataInMem": "true",
    "osmDefaults": {
        "nameProperties": ["name", "name:en", "official_name"]
    },
    "osm": [
        {
            "source": "./data/TN_cleaned.pbf",
            "timeZone": "Europe/Rome"
        },
        {
            "source": "./data/trentino_parkings.pbf",
            "timeZone": "Europe/Rome"
        }
    ],
    "transitFeeds": [
        {
            "type": "gtfs",
            "feedId": "TrentinoTrasportiUrbano",
            "source": "./data/google_transit_urbano_tte.zip"
        },
        {
            "type": "gtfs",
            "feedId": "TrentinoTrasportiExtraurbano",
            "source": "./data/google_transit_extraurbano_tte.zip"
        },
        {
            "type": "netex",
            "feedId": "Trenitalia",
            "source": "./data/Trenitalia-netex/"
        }
    ],
    "staticParkAndRide": true,
    "staticBikeParkAndRide": true
}