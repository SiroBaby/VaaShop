import { Module, MiddlewareConsumer } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { PrometheusController } from './prometheus.controller';
import { PrometheusMiddleware } from './prometheus.middleware';

@Module({
  providers: [PrometheusService],
  controllers: [PrometheusController],
  exports: [PrometheusService],
})
export class PrometheusModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PrometheusMiddleware).forRoutes('*');
  }
}
