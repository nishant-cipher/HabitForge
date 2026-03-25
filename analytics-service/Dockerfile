FROM node:18-alpine
WORKDIR /app
ENV CACHE_BUSTER=2

# Copy shared module and build it
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build

# Copy service and install deps (includes @habitforge/shared: file:../shared)
COPY analytics-service/ ./analytics-service/
RUN cd analytics-service && npm install && npm run build

EXPOSE 3004
CMD ["sh", "-c", "cd analytics-service && node dist/index.js"]
