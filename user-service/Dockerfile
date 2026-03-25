FROM node:18-alpine
WORKDIR /app
ENV CACHE_BUSTER=2

# Copy shared module and build it
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build

# Copy service and install deps (includes @habitforge/shared: file:../shared)
COPY user-service/ ./user-service/
RUN cd user-service && npm install && npm run build

EXPOSE 3001
CMD ["sh", "-c", "cd user-service && node dist/index.js"]
