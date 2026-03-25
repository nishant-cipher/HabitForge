FROM node:18-alpine
WORKDIR /app
ENV CACHE_BUSTER=2

# Copy shared module and build it
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build

# Copy service and install deps (includes @habitforge/shared: file:../shared)
COPY task-service/ ./task-service/
RUN cd task-service && npm install && npm run build

EXPOSE 3005
CMD ["sh", "-c", "cd task-service && node dist/index.js"]
