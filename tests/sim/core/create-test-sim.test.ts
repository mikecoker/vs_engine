import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TEST_CONFIG,
  DEFAULT_TEST_CONTENT,
  DEFAULT_TEST_SEED,
  createTestSim,
} from '../createTestSim';

test('createTestSim boots with default seed, config, and content', () => {
  let capturedArgs:
    | {
        seed: number;
        content: typeof DEFAULT_TEST_CONTENT;
        config: typeof DEFAULT_TEST_CONFIG;
      }
    | undefined;

  const bootstrap = createTestSim({
    createSim(args) {
      capturedArgs = args;
      return {
        fixedStepSeconds: args.config.fixedStepSeconds,
        step() {},
      };
    },
  });

  assert.equal(bootstrap.seed, DEFAULT_TEST_SEED);
  assert.deepEqual(bootstrap.content, DEFAULT_TEST_CONTENT);
  assert.deepEqual(bootstrap.config, DEFAULT_TEST_CONFIG);
  assert.deepEqual(capturedArgs, {
    seed: DEFAULT_TEST_SEED,
    content: DEFAULT_TEST_CONTENT,
    config: DEFAULT_TEST_CONFIG,
  });
});

test('createTestSim allows explicit seed, config, and content overrides', () => {
  const customContent = {
    enemyArchetypes: ['slime'],
    pickupTypes: ['xp_large'],
    weaponTypes: ['wand'],
  } as const;
  const customConfig = {
    fixedStepSeconds: 1 / 30,
    maxSubSteps: 2,
  } as const;

  const bootstrap = createTestSim({
    seed: 99,
    content: customContent,
    config: customConfig,
    createSim(args) {
      return {
        fixedStepSeconds: args.config.fixedStepSeconds,
        step() {},
      };
    },
  });

  assert.equal(bootstrap.seed, 99);
  assert.equal(bootstrap.content, customContent);
  assert.equal(bootstrap.config, customConfig);
});
