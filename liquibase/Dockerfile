FROM liquibase/liquibase:4.27

WORKDIR /liquibase

COPY changelog.xml .
COPY liquibase.properties .

CMD ["liquibase", "--log-level=INFO", "update"]
