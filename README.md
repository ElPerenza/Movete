# Mòvete

Detailed READMEs still WIP. See below for building information.

## Building and running
This repository is structured as an NPM workspace with two packages: `server`, a NestJS backend and `ui` an Angular frontend. The `otp` directory instead contains OpenTripPlanner configuration files.

### Prerequisites
**Java 25** for running OpenTripPlanner, **Node 24** for running backend and frontend.

#### Preparing the OpenStreetMap data
- Download the entire OSM vector data for Italy's North East (.pbf format), and place it in the `otp/data/` folder (create it if it doesn't exist): https://download.geofabrik.de/europe/italy/nord-est.html
- This data is already usable (just change the .pbf file's name in `otp/build-config.json`) but quite bulky. It can be cut down to only Trentino by using tools like Osmium: https://osmcode.org/osmium-tool/manual.html#creating-geographic-extracts

#### Preparing and starting OpenTripPlanner
- Download OpenTripPlanner (OTP) from their Github page (https://github.com/opentripplanner/OpenTripPlanner/releases) and place it in the `otp/` folder.
- Download Trentino Trasporti's GTFS data and place them in `otp/data/` (create it if it doesn't exist). Download both `_urbano` and `_extraurbano` archives: https://www.trentinotrasporti.it/it/opendata-it
- Download Trenitalia's NeTEx data and place it in `otp/data/Trenitalia-netex/`. Rename the file so that it starts with 3 capital letters follwed by a hyphen (or otherwise OTP will not load it). Download link: https://www.cciss.it/nap/mmtis/public/catalog/Asset/1080596
- Build the OTP graphs. Execute these two commands in succession:
  - `java -Xmx2G -jar .\otp-shaded-2.9.0.jar --buildStreet .` to build and save the street graph
  - `java -Xmx2G -jar .\otp-shaded-2.9.0.jar --loadStreet --save .` to build the transit graph
  - Graphs only need to be built once. Then OTP will load them at startup.
- You can now execute OTP with `java -Xmx2G -jar .\otp-shaded-2.9.0.jar --load .`

#### Building and starting backend and frontend
- Since this repository is a NPM workspace, run `npm install --workspaces` in the root directory to install packages for both the banckend and frontend.
- To start the frontend, just do `npm run start -w ui` in the root directory. This will open the Angular app at http://localhost:4200
- Before starting the backend some environment variables need to be set in a `server/.env` file (create it if it doesn't exist):
  ```env
  MONGODB_URL=<url> # URL to a MongoDB database
  MONGODB_DB_NAME=<name> # Name of the MongoDB database to connect
  MONGODB_USER=<user> # MongoDB username
  MONGODB_PASSWORD=<pwd> # MongoDB password
  
  OTP_GRAPHQL_URL=http://localhost:8080/otp/gtfs/v1/ # URL to the OpenTripPlanner API. Change if started on a different port.
  
  PORT=<port> # Port to run the server on. Defaults to 3000 if not set.
  
  POPULATE_STOPS=<true|false> # Set to true if it's the first time running the server, it will load stop data from OTP into MongoDB (it will take a few minutes). After first run can be put to false.
  ```
- Now the backend can be started with `npm run start -w server` in the root directory. Using the Angular app at localhost://4200 with real data should now be possible.
