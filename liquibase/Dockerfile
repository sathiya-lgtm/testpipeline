FROM liquibase/liquibase:4.27

WORKDIR /liquibase

COPY liquibase.properties .
COPY changelog.xml .

CMD ["liquibase", "--log-level=INFO", "update"]
