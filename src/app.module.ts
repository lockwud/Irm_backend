import type { FeatureModule } from "./common/router.js";
import { AiModule } from "./modules/ai/ai.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { ConfigurationsModule } from "./modules/configurations/configurations.module.js";
import { DirectoryModule } from "./modules/directory/directory.module.js";
import { IrbModule } from "./modules/irb/irb.module.js";
import { LettersModule } from "./modules/letters/letters.module.js";
import { NotificationsModule } from "./modules/notifications/notifications.module.js";
import { RegistrationModule } from "./modules/registration/registration.module.js";
import { StaffModule } from "./modules/staff/staff.module.js";
import { SupportModule } from "./modules/support/support.module.js";
import { UtilitiesModule } from "./modules/utilities/utilities.module.js";
import { WorkflowModule } from "./modules/workflow/workflow.module.js";

export const AppModule: FeatureModule[] = [
  AuthModule,
  AiModule,
  RegistrationModule,
  WorkflowModule,
  DirectoryModule,
  ConfigurationsModule,
  IrbModule,
  LettersModule,
  StaffModule,
  SupportModule,
  NotificationsModule,
  UtilitiesModule,
];
