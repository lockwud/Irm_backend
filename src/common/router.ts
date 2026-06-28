import type { Router } from "express";

export interface FeatureModule {
  basePath: string;
  router: Router;
}
