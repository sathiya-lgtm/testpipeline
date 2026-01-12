FROM liquibase/liquibase:latest

WORKDIR /liquibase

# Copy Liquibase config
COPY changelog.xml .
COPY liquibase.properties .

# Copy SQL scripts folder from project root
COPY ./sampel /liquibase/sampel

# Run Liquibase on container start
CMD ["liquibase", "update"]
