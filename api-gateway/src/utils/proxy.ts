import axios from 'axios';
import { Request, Response } from 'express';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL as string;
const HABIT_SERVICE_URL = process.env.HABIT_SERVICE_URL as string;
const CLUB_SERVICE_URL = process.env.CLUB_SERVICE_URL as string;
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL as string;
const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL as string;

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
            timeout: 30000, // 30 second timeout
            validateStatus: () => true // Don't throw on any status
        });

        return response;
    } catch (error: any) {
        console.error(`Error forwarding to ${serviceUrl}${path}:`, error.message);
        if (error.code === 'ECONNREFUSED') {
            throw new Error(`Service at ${serviceUrl} is not available`);
        }
        throw error;
    }
}

/**
 * Create a proxy handler for a service
 */
export function createServiceProxy(serviceUrl: string) {
    return async (req: Request, res: Response) => {
        try {
            // Use originalUrl to get the full path including mount point
            const path = req.originalUrl;
            const method = req.method;
            const headers = req.headers;
            const body = req.body;
            const query = req.query;

            console.log(`Proxying ${method} ${path} to ${serviceUrl}${path}`);
            console.log(`Body:`, JSON.stringify(body));

            const response = await forwardRequest(
                serviceUrl,
                path,
                method,
                headers,
                body,
                query
            );

            console.log(`Response status: ${response.status}`);

            // Forward response headers (critical for Set-Cookie pass-through)
            const headersToForward = ['set-cookie', 'content-type'];
            for (const header of headersToForward) {
                const value = response.headers[header];
                if (value) {
                    res.setHeader(header, value);
                }
            }
            res.status(response.status).json(response.data);
        } catch (error: any) {
            console.error(`Proxy error:`, error.message);
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
export const taskServiceProxy = createServiceProxy(TASK_SERVICE_URL);
