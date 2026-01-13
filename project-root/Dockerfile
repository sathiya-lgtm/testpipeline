FROM liquibase/liquibase:latest

WORKDIR /liquibase

# Copy ONLY the sampel folder
COPY sampel /liquibase/sampel

# Run Liquibase on container start
CMD ["liquibase",
     "--changeLogFile=sampel/changelog.xml",
     "--url=jdbc:postgresql://db:5432/mydb",
     "--username=postgres",
     "--password=postgres",
     "update"]
