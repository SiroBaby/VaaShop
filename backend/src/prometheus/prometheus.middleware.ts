import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrometheusService } from './prometheus.service';

interface ExtendedResponse extends Response {
  originalSend?: Function;
}

@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
  private readonly logger = new Logger('PrometheusMiddleware');

  constructor(private readonly prometheusService: PrometheusService) {}

  use(req: Request, res: ExtendedResponse, next: NextFunction) {
    const startTime = Date.now();
    const method = req.method;
    const originalPath = req.url;

    // Skip metrics endpoint
    if (originalPath.includes('/metrics') || originalPath.includes('/health')) {
      return next();
    }

    // Get GraphQL operation name from headers
    const operationName = req.headers['x-apollo-operation-name'] as string;
    
    // Normalize route path
    const route = this.getNormalizedRoute(originalPath, operationName);

    // Record request start
    this.prometheusService.recordRequestStart(method, route);

    // Calculate request size
    const requestSize = this.calculateRequestSize(req);

    // Capture response
    const originalSend = res.send;
    let responseBody: any;

    res.send = function(body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.on('finish', () => {
      try {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode || 200;
        const responseSize = this.calculateResponseSize(res, responseBody);

        // Record request end
        this.prometheusService.recordRequestEnd(method, route);

        // Parse error details
        let errorDetails: { type: string; message: string } | undefined;
        if (statusCode >= 400) {
          errorDetails = this.parseErrorDetails(responseBody, statusCode);
          this.logger.warn(
            `API Error [${method} ${route}] Status: ${statusCode}, Duration: ${duration}ms, Error: ${errorDetails.type}`,
          );
        }

        // Record metrics
        this.prometheusService.recordHttpRequest(
          method,
          route,
          statusCode,
          duration,
          requestSize,
          responseSize,
          errorDetails,
        );

        // Log request details for debugging
        if (duration > 1000) {
          this.logger.warn(
            `Slow API [${method} ${route}] Duration: ${duration}ms, Status: ${statusCode}`,
          );
        }
      } catch (error) {
        this.logger.error(`Error recording metrics: ${error.message}`);
      }
    });

    next();
  }

  private getNormalizedRoute(path: string, operationName?: string): string {
    // For GraphQL requests
    if (path.includes('/graphql')) {
      return PrometheusService.getGraphQLRoute(operationName);
    }

    // For REST endpoints
    let normalized = PrometheusService.normalizePath(path);

    // Remove query string
    if (normalized.includes('?')) {
      normalized = normalized.split('?')[0];
    }

    return normalized || '/unknown';
  }

  private calculateRequestSize(req: Request): number {
    try {
      if (req.headers['content-length']) {
        return parseInt(req.headers['content-length'] as string, 10);
      }

      if (req.body) {
        return Buffer.byteLength(JSON.stringify(req.body), 'utf8');
      }

      return 0;
    } catch {
      return 0;
    }
  }

  private calculateResponseSize(res: Response, body: any): number {
    try {
      const contentLength = res.get('Content-Length');
      if (contentLength) {
        return parseInt(contentLength, 10);
      }

      if (body) {
        if (typeof body === 'string') {
          return Buffer.byteLength(body, 'utf8');
        }
        return Buffer.byteLength(JSON.stringify(body), 'utf8');
      }

      return 0;
    } catch {
      return 0;
    }
  }

  private parseErrorDetails(
    responseBody: any,
    statusCode: number,
  ): { type: string; message: string } {
    try {
      let parsed = responseBody;

      if (typeof responseBody === 'string') {
        parsed = JSON.parse(responseBody);
      }

      if (parsed && typeof parsed === 'object') {
        // GraphQL error
        if (parsed.errors && Array.isArray(parsed.errors)) {
          const error = parsed.errors[0];
          return {
            type: error.extensions?.code || 'GRAPHQL_ERROR',
            message: error.message || 'GraphQL error',
          };
        }

        // REST API error
        return {
          type: parsed.error || parsed.name || `HTTP_${statusCode}`,
          message: parsed.message || parsed.description || 'Unknown error',
        };
      }
    } catch (e) {
      // Parsing failed
    }

    return {
      type: `HTTP_${statusCode}`,
      message: responseBody ? String(responseBody).substring(0, 200) : 'No response',
    };
  }
}
