# liquibase/Dockerfile
FROM liquibase/liquibase:latest

WORKDIR /liquibase

# Copy Liquibase config
COPY changelog.xml .
COPY liquibase.properties .

# Copy your SQL scripts folder
COPY ../sampel /liquibase/sampel

# Run Liquibase update on container startup
CMD ["liquibase", "update"]
