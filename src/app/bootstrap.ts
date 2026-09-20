import { SEED_PROFILE } from '../content/seed-profile';
import { SEED_PROGRESSION } from '../content/seed-progression';
import type { UserProfile } from '../domain/profile';
import type { ProgressionState } from '../domain/progression';
import type { StorageAdapter } from '../storage/adapter';
import { defaultAdapter } from '../storage/default-adapter';
import { runMigrations } from '../storage/migrations';
import { createRepositories, type Repositories } from '../storage/repositories';

export interface BootstrapResult {
  repositories: Repositories;
  profile: UserProfile;
  progression: ProgressionState[];
  /** True only on the run that wrote the seed data. */
  seeded: boolean;
}

/**
 * Prepares the store for use: migrate, then seed anything missing.
 *
 * Seeding never overwrites. Once the athlete has edited a profile or logged a
 * session, bootstrap only fills in what is absent — so running it on every
 * launch is safe.
 */
export const bootstrap = async (
  adapter: StorageAdapter = defaultAdapter(),
): Promise<BootstrapResult> => {
  await runMigrations(adapter);
  const repositories = createRepositories(adapter);

  const existingProfile = await repositories.profile.load();
  const profile = existingProfile ?? (await repositories.profile.save(SEED_PROFILE));

  const existingProgression = await repositories.progression.list();
  const seededFamilies = new Set(existingProgression.map((s) => s.family));
  const missing = SEED_PROGRESSION.filter((s) => !seededFamilies.has(s.family));
  await Promise.all(missing.map((s) => repositories.progression.save(s)));

  const progression = await repositories.progression.list();

  return {
    repositories,
    profile,
    progression,
    seeded: existingProfile === null || missing.length > 0,
  };
};
