FROM maven:3.9.11-eclipse-temurin-21 AS build

ARG MODULE=prevent-monolith

WORKDIR /workspace

COPY mvnw pom.xml ./
COPY .mvn .mvn
COPY prevent-monolith/pom.xml prevent-monolith/pom.xml

RUN chmod +x mvnw
RUN ./mvnw -B -ntp -pl ${MODULE} -am dependency:go-offline

COPY ms-auth/src ms-auth/src
COPY ms-backup/src ms-backup/src
COPY ms-customers/src ms-customers/src
COPY ms-service-orders/src ms-service-orders/src
COPY ms-scheduling/src ms-scheduling/src
COPY prevent-monolith/src prevent-monolith/src

RUN ./mvnw -B -ntp -pl ${MODULE} -am clean package -DskipTests && \
    cp "$(find "${MODULE}/target" -maxdepth 1 -type f -name '*.jar' ! -name '*.original' | head -n 1)" /workspace/app.jar

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /workspace/app.jar /app/app.jar

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
