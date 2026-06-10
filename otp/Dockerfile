FROM eclipse-temurin:25-jre-alpine

WORKDIR /otp

COPY ./data ./data
COPY ./otp-shaded-2.9.0.jar ./
COPY ./build-config.json ./router-config-prod.json ./graph.obj ./
RUN mv ./router-config-prod.json ./router-config.json

ENTRYPOINT ["java", "-Xmx2G", "-jar", "./otp-shaded-2.9.0.jar"]
CMD ["--load", "."]