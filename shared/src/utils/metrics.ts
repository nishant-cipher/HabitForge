import promBundle from 'express-prom-bundle';
import client from 'prom-client';

export function createMetricsMiddleware(serviceName: string) {
    // Clear global registry to prevent hot-reloading crashes in ts-node-dev
    client.register.clear();
    return promBundle({
        includeMethod: true,
        includePath: true,
        includeStatusCode: true,
        metricsPath: '/metrics',
        customLabels: { service: serviceName },
        promClient: {
            collectDefaultMetrics: {},
        },
    });
}
