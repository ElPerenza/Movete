# Mòvete

Detailed READMEs still WIP. See below for building information.

## Building and running
This repository is structured as an NPM workspace with three packages: `server`, a NestJS backend, `ui`, an Angular frontend and `otp`, containing OpenTripPlanner configuration files and scripts.

### Prerequisites
**Java 25** for running OpenTripPlanner, **Node 24** for running backend, frontend and OTP scripts and **Docker** for preparing data for the OTP street graph.

#### Preparing and starting OpenTripPlanner
All commands are intended to be run from the project root directory unless stated.
- Download OpenTripPlanner (OTP) from their Github page (https://github.com/opentripplanner/OpenTripPlanner/releases) and place it in the `otp/` folder.
- Install the packages needed by the scripts with `npm install -w otp`.
- Download and prepare the street and transit data needed by OTP with `npm run prepare-data -w otp`. This will take quite some time, as the OpenStreetMap geographic extracts are quite big and GeoFabrik doesn't have particularly fast download servers.
- Build the OTP graphs. Execute these two commands (from the `/otp` directory) in succession:
  - `java -Xmx2G -jar .\otp-shaded-2.9.0.jar --buildStreet .` to build and save the street graph.
  - `java -Xmx2G -jar .\otp-shaded-2.9.0.jar --loadStreet --save .` to build the transit graph.
  - Graphs only need to be built once. Then OTP will load them at startup.
- You can now execute OTP with `java -Xmx2G -jar .\otp-shaded-2.9.0.jar --load .` (from the `/otp` directory).

#### Building and starting
- Since this repository is a NPM workspace, run `npm install --workspaces` in the root directory to install packages for the three packages.
- To start the frontend, just do `npm run start -w ui` in the root directory. This will open the Angular app at http://localhost:4200.
- Before starting the backend some environment variables need to be set in a `server/.env` file (create it if it doesn't exist):
  ```env
  MONGODB_URL=<url> # URL to a MongoDB database
  MONGODB_DB_NAME=<name> # Name of the MongoDB database to connect
  MONGODB_USER=<user> # MongoDB username
  MONGODB_PASSWORD=<pwd> # MongoDB password
  
  OTP_GRAPHQL_URL=http://localhost:8080/otp/gtfs/v1/ # URL to the OpenTripPlanner API. Change if started on a different port.
  
  # Trentino Trasporti API url and authentication Base64 hash for Trentino Trasporti realtime data.
  # The hash has never changed (and I doubt it will), but it's set as an environment variable if it ever needs to be changed.
  TT_API_URL=https://app-tpl.tndigit.it/gtlservice/
  TT_API_AUTH=bWl0dG1vYmlsZTplY0dzcC5SSEIz

  VT_API_URL=http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/ # URL to the Viaggiatreno API for realtime data for Trenitalia services.

  PORT=<port> # Port to run the server on. Defaults to 3000 if not set.
  
  SESSION_SECRET=<secret> # A minimum 32-byte string to serve as express-session's secret when signing cookies

  POPULATE_STOPS=<true|false> # Set to true if it's the first time running the server, it will load stop data from OTP into MongoDB (it will take a few minutes). After first run can be put to false.
  POPULATE_PARKS=<true|false> # Set to true if it's the first time running the server, it will load vehicle parking data from OTP into MongoDB (it will take a few minutes). After first run can be put to false.
  ```
- Now the backend can be started with `npm run start -w server` in the root directory. Using the Angular app at http://localhost:4200 with real data should now be possible, even if realtime data might take a few minutes to start working, depending on the computer's specs.
