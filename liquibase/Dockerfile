FROM liquibase/liquibase:latest

WORKDIR /liquibase

# Copy Liquibase configuration
COPY changelog.xml .
COPY liquibase.properties .

# Copy the SQL scripts folder from project root (sampel/)
COPY ../sampel /liquibase/sampel

# Run Liquibase update automatically
CMD ["liquibase", "update"]
