FROM node:18-alpine
WORKDIR /app
ENV CACHE_BUSTER=2

# Copy shared module and build it
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build

# Copy service and install deps (includes @habitforge/shared: file:../shared)
COPY club-service/ ./club-service/
RUN cd club-service && npm install && npm run build

EXPOSE 3003
CMD ["sh", "-c", "cd club-service && node dist/index.js"]
