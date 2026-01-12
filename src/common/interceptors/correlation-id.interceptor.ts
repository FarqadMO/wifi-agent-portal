import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

/**
 * CorrelationIdInterceptor
 * 
 * Adds a unique correlation ID to each request for tracking and debugging
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CorrelationIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Generate or extract correlation ID
    const correlationId = request.headers['x-correlation-id'] || uuidv4();
    
    // Attach to request for use in controllers/services
    request.correlationId = correlationId;

    // Add to response headers
    response.setHeader('X-Correlation-Id', correlationId);

    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(
      `[${correlationId}] ${method} ${url} - ${userAgent} ${ip} - Request started`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const contentLength = response.get('content-length') || 0;
          const duration = Date.now() - startTime;

          this.logger.log(
            `[${correlationId}] ${method} ${url} ${statusCode} ${contentLength}bytes - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${correlationId}] ${method} ${url} - Error after ${duration}ms: ${error.message}`,
          );
        },
      }),
    );
  }
}
