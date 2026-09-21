ARG NGINX_IMAGE=nginx:stable-alpine
FROM ${NGINX_IMAGE}
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY assets/ /usr/share/nginx/html/assets/
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
