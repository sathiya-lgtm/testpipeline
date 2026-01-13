FROM liquibase/liquibase:4.27

COPY sample /liquibase/changelog

CMD ["liquibase",
     "--changeLogFile=changelog/changelog.xml",
     "--url=jdbc:postgresql://10.50.25.131:5432/postgres",
     "--username=postgres",
     "--password=Admin4psql",
     "update"]
