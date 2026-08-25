import { Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { FeatureGuard } from './guards/feature.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [EntitlementsService, FeatureGuard, RolesGuard],
  exports: [EntitlementsService, FeatureGuard, RolesGuard],
})
export class EntitlementsModule {}
