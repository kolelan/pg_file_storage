FROM postgres:15-alpine

# Установка локали
RUN apk add --no-cache tzdata
ENV TZ=Europe/Moscow

# Копирование скриптов инициализации
COPY scripts/init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432