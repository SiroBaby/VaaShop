import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

export interface MetricLabels {
  method: string;
  route: string;
  status_code: string;
  [key: string]: string;
}

@Injectable()
export class PrometheusService {
  private readonly registry: promClient.Registry;

  // HTTP Metrics
  private readonly httpRequestsTotal: promClient.Counter<string>;
  private readonly httpRequestDuration: promClient.Histogram<string>;
  private readonly httpResponseSize: promClient.Histogram<string>;
  private readonly httpRequestSize: promClient.Histogram<string>;
  private readonly httpErrorsTotal: promClient.Counter<string>;
  private readonly httpErrorDetails: promClient.Gauge<string>;

  // Database Metrics
  private readonly dbQueryDuration: promClient.Histogram<string>;
  private readonly dbQueryErrors: promClient.Counter<string>;

  // Custom Business Metrics
  private readonly activeConnections: promClient.Gauge<string>;
  private readonly requestsInProgress: promClient.Gauge<string>;

  constructor() {
    this.registry = new promClient.Registry();

    // HTTP Requests Total
    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // HTTP Request Duration (latency)
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
      registers: [this.registry],
    });

    // HTTP Response Size
    this.httpResponseSize = new promClient.Histogram({
      name: 'http_response_size_bytes',
      help: 'HTTP response size in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
      registers: [this.registry],
    });

    // HTTP Request Size
    this.httpRequestSize = new promClient.Histogram({
      name: 'http_request_size_bytes',
      help: 'HTTP request size in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
      registers: [this.registry],
    });

    // HTTP Errors Total
    this.httpErrorsTotal = new promClient.Counter({
      name: 'http_errors_total',
      help: 'Total HTTP errors',
      labelNames: ['method', 'route', 'status_code', 'error_type'],
      registers: [this.registry],
    });

    // HTTP Error Details
    this.httpErrorDetails = new promClient.Gauge({
      name: 'http_error_details',
      help: 'Last error details',
      labelNames: ['method', 'route', 'status_code', 'error_message'],
      registers: [this.registry],
    });

    // Database Query Duration
    this.dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_ms',
      help: 'Database query duration in milliseconds',
      labelNames: ['operation', 'model'],
      buckets: [1, 5, 10, 50, 100, 500, 1000, 5000],
      registers: [this.registry],
    });

    // Database Query Errors
    this.dbQueryErrors = new promClient.Counter({
      name: 'db_query_errors_total',
      help: 'Total database query errors',
      labelNames: ['operation', 'model', 'error_type'],
      registers: [this.registry],
    });

    // Active Connections
    this.activeConnections = new promClient.Gauge({
      name: 'active_connections_total',
      help: 'Total active connections',
      registers: [this.registry],
    });

    // Requests In Progress
    this.requestsInProgress = new promClient.Gauge({
      name: 'requests_in_progress',
      help: 'Number of requests currently being processed',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    // Collect default Node.js metrics
    promClient.collectDefaultMetrics({ register: this.registry });
  }

  // Record HTTP Request
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    requestSize: number,
    responseSize: number,
    error?: { type: string; message: string },
  ) {
    const labels = { method, route, status_code: statusCode.toString() };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, duration);
    this.httpResponseSize.observe(labels, responseSize);
    this.httpRequestSize.observe(
      { method, route },
      requestSize,
    );

    if (statusCode >= 400 && error) {
      this.httpErrorsTotal.inc({
        ...labels,
        error_type: error.type,
      });

      const errorMessage = error.message.substring(0, 100);
      this.httpErrorDetails.set(
        {
          ...labels,
          error_message: errorMessage,
        },
        1,
      );
    }
  }

  // Record Request In Progress
  recordRequestStart(method: string, route: string) {
    this.requestsInProgress.inc({ method, route });
  }

  recordRequestEnd(method: string, route: string) {
    this.requestsInProgress.dec({ method, route });
  }

  // Record Database Query
  recordDatabaseQuery(
    operation: string,
    model: string,
    duration: number,
    error?: { type: string },
  ) {
    this.dbQueryDuration.observe({ operation, model }, duration);

    if (error) {
      this.dbQueryErrors.inc({
        operation,
        model,
        error_type: error.type,
      });
    }
  }

  // Update Active Connections
  updateActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  // Get Metrics as String
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  // Get Registry
  getRegistry(): promClient.Registry {
    return this.registry;
  }

  // Helper to normalize route path
  static normalizePath(path: string): string {
    // Replace IDs with :id pattern
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/^\/api/, '')
      .substring(0, 100);
  }

  // Helper to get route name from GraphQL operation
  static getGraphQLRoute(operationName?: string): string {
    return operationName ? `/graphql/${operationName}` : '/graphql';
  }
}
