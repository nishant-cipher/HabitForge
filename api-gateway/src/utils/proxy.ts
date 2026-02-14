import axios from 'axios';
import { Request, Response } from 'express';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const HABIT_SERVICE_URL = process.env.HABIT_SERVICE_URL || 'http://localhost:3002';
const CLUB_SERVICE_URL = process.env.CLUB_SERVICE_URL || 'http://localhost:3003';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004';

/**
 * Forward request to a service
 */
async function forwardRequest(
    serviceUrl: string,
    path: string,
    method: string,
    headers: any,
    body?: any,
    query?: any
) {
    try {
        const response = await axios({
            method,
            url: `${serviceUrl}${path}`,
            headers: {
                ...headers,
                host: undefined, // Remove host header
            },
            data: body,
            params: query,
            validateStatus: () => true // Don't throw on any status
        });

        return response;
    } catch (error: any) {
        console.error(`Error forwarding to ${serviceUrl}:`, error.message);
        throw error;
    }
}

/**
 * Create a proxy handler for a service
 */
export function createServiceProxy(serviceUrl: string) {
    return async (req: Request, res: Response) => {
        try {
            const path = req.path;
            const method = req.method;
            const headers = req.headers;
            const body = req.body;
            const query = req.query;

            const response = await forwardRequest(
                serviceUrl,
                path,
                method,
                headers,
                body,
                query
            );

            // Forward response
            res.status(response.status).json(response.data);
        } catch (error: any) {
            res.status(503).json({
                success: false,
                message: 'Service unavailable',
                error: error.message
            });
        }
    };
}

// Service proxies
export const userServiceProxy = createServiceProxy(USER_SERVICE_URL);
export const habitServiceProxy = createServiceProxy(HABIT_SERVICE_URL);
export const clubServiceProxy = createServiceProxy(CLUB_SERVICE_URL);
export const analyticsServiceProxy = createServiceProxy(ANALYTICS_SERVICE_URL);
