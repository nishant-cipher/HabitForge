FROM node:18-alpine
WORKDIR /app
ENV CACHE_BUSTER=2

# Copy shared module and build it
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build

# Copy service and install deps (includes @habitforge/shared: file:../shared)
COPY api-gateway/ ./api-gateway/
RUN cd api-gateway && npm install && npm run build

EXPOSE 3000
CMD ["sh", "-c", "cd api-gateway && node dist/index.js"]
