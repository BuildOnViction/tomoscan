# Set nginx base image
FROM nginx

# Copy custom configuration file from the current directory
COPY nginx/nginx.conf /etc/nginx/nginx.conf

VOLUME ["/etc/nginx/ssl", "/etc/nginx/psw"]

# Append "daemon off;" to the beginning of the configuration
# in order to avoid an exit of the container
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# Expose ports
EXPOSE 80

# Define default command
CMD service nginx start