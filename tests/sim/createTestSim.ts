import type {
  CreateSimArgs,
  SimConfigLike,
  SimContentLike,
  SimFactory,
  TestableSimLike,
} from '../../src/sim/core/SimApi';

export interface TestSimContent extends SimContentLike {
  enemyArchetypes: readonly string[];
  pickupTypes: readonly string[];
  weaponTypes: readonly string[];
}

export interface TestSimConfig extends SimConfigLike {
  fixedStepSeconds: number;
  maxSubSteps: number;
}

export interface CreateTestSimOptions<
  TSim extends TestableSimLike,
  TContent extends SimContentLike = TestSimContent,
  TConfig extends SimConfigLike = TestSimConfig,
> {
  createSim: SimFactory<TSim, TContent, TConfig>;
  seed?: number;
  content?: TContent;
  config?: TConfig;
}

export interface TestSimBootstrap<
  TSim extends TestableSimLike,
  TContent extends SimContentLike = TestSimContent,
  TConfig extends SimConfigLike = TestSimConfig,
> {
  sim: TSim;
  seed: number;
  content: TContent;
  config: TConfig;
}

export const DEFAULT_TEST_SEED = 1337;

export const DEFAULT_TEST_CONTENT: TestSimContent = {
  enemyArchetypes: ['bat', 'skeleton', 'ghost'],
  pickupTypes: ['xp_small'],
  weaponTypes: ['starter_whip'],
};

export const DEFAULT_TEST_CONFIG: TestSimConfig = {
  fixedStepSeconds: 1 / 60,
  maxSubSteps: 4,
};

export function createTestSim<TSim extends TestableSimLike>(
  options: CreateTestSimOptions<TSim>,
): TestSimBootstrap<TSim>;
export function createTestSim<
  TSim extends TestableSimLike,
  TContent extends SimContentLike,
  TConfig extends SimConfigLike,
>(
  options: CreateTestSimOptions<TSim, TContent, TConfig>,
): TestSimBootstrap<TSim, TContent, TConfig>;
export function createTestSim<
  TSim extends TestableSimLike,
  TContent extends SimContentLike,
  TConfig extends SimConfigLike,
>(
  options: CreateTestSimOptions<TSim, TContent, TConfig>,
): TestSimBootstrap<TSim, TContent, TConfig> {
  const seed = options.seed ?? DEFAULT_TEST_SEED;
  const content = (options.content ?? DEFAULT_TEST_CONTENT) as TContent;
  const config = (options.config ?? DEFAULT_TEST_CONFIG) as TConfig;
  const args: CreateSimArgs<TContent, TConfig> = { content, config, seed };

  return {
    sim: options.createSim(args),
    seed,
    content,
    config,
  };
}
