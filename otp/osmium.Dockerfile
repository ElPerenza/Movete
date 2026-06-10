FROM ubuntu:24.04

RUN apt-get update -qy
RUN apt-get install -qy osmium-tool wget

WORKDIR /script
COPY ./prepare-street-data.sh ./
RUN chmod +x ./prepare-street-data.sh

CMD ./prepare-street-data.sh
