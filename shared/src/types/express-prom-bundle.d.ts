declare module 'express-prom-bundle' {
    import { RequestHandler } from 'express';
    import * as promClient from 'prom-client';

    interface Opts {
        includeMethod?: boolean;
        includePath?: boolean;
        includeStatusCode?: boolean;
        includeUp?: boolean;
        customLabels?: Record<string, any>;
        promClient?: any;
        formatStatusCode?: (res: any) => number;
        metricsPath?: string;
        promRegistry?: promClient.Registry;
    }

    function expressPromBundle(opts: Opts): RequestHandler;
    export = expressPromBundle;
}
