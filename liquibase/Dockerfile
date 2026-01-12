FROM liquibase/liquibase:4.27

WORKDIR /liquibase

COPY liquibase.properties .
COPY changelog.xml .
COPY ../sampel ./sampel

CMD ["liquibase", "--log-level=INFO", "update"]
