FROM liquibase/liquibase:latest

WORKDIR /liquibase

COPY sample /liquibase/sample

CMD ["liquibase", "--changeLogFile=sample/changelog.xml", "--url=jdbc:postgresql://postgres:5432/sampledb", "--username=postgres", "--password=postgres", "update"]
