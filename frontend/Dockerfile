FROM nginx:alpine

# Копируем собранное приложение
COPY build /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80