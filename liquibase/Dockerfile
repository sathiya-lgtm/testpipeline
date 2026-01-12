FROM liquibase/liquibase:4.23

WORKDIR /liquibase

COPY changelog.xml /liquibase/changelog.xml
COPY liquibase.properties /liquibase/liquibase.properties

CMD ["liquibase", "update"]
