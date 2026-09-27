#!/usr/bin/env node

/**
 * Regression coverage for the post-#2154 Formal AI runs investigated in issue
 * #2158. Hive Mind's workflow prompt contains command examples such as `sudo`
 * and `pwd`. Formal AI 0.339.1 interpreted those caller instructions as the
 * repository task, so Codex ran bare `sudo` and Claude ran `pwd` instead of
 * implementing the linked issue.
 *
 * That request boundary (a small repository objective, no workflow prompt) was
 * removed by issue #2313: it also dropped the restart feedback. Formal AI now
 * receives the same prompts as every other model.
 *
 * @see https://github.com/link-assistant/hive-mind/issues/2158
 * @hive-mind-test-suite default
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as agentPrompts from '../src/agent.prompts.lib.mjs';
import * as claudePrompts from '../src/claude.prompts.lib.mjs';
import * as codexPrompts from '../src/codex.prompts.lib.mjs';
import * as geminiPrompts from '../src/gemini.prompts.lib.mjs';
import { classifyFormalAiToolResult } from '../src/formal-ai.lib.mjs';
import { buildGitHubPullRequestUrl } from '../src/github-url-parser.lib.mjs';
import * as opencodePrompts from '../src/opencode.prompts.lib.mjs';
import * as qwenPrompts from '../src/qwen.prompts.lib.mjs';

const promptModules = [
  ['agent', agentPrompts],
  ['claude', claudePrompts],
  ['codex', codexPrompts],
  ['gemini', geminiPrompts],
  ['opencode', opencodePrompts],
  ['qwen', qwenPrompts],
];

const systemParams = model => ({
  owner: 'konard',
  repo: 'test-hello-world',
  issueNumber: 1,
  prNumber: 2,
  branchName: 'issue-1-example',
  workspaceTmpDir: null,
  argv: { model },
  modelSupportsVision: false,
  forkedRepo: null,
});

// Issue #2313 superseded the #2158 request boundary: the empty system prompt and
// the one-paragraph repository objective also removed the restart feedback, so
// Formal AI re-ran the same prompt five times. Every model now gets one prompt.
test('Formal AI receives the same workflow prompt as every other model (#2313)', () => {
  for (const [tool, prompts] of promptModules) {
    for (const model of ['formal-ai', 'formalai/formal-ai']) {
      assert.equal(prompts.buildSystemPrompt(systemParams(model)), prompts.buildSystemPrompt(systemParams('native-model')), `${tool} system prompt for ${model}`);
    }
    const userParams = {
      issueUrl: 'https://github.com/konard/test-hello-world/issues/1',
      issueNumber: 1,
      prNumber: 2,
      prUrl: 'https://github.com/konard/test-hello-world/pull/2',
      branchName: 'issue-1-example',
      tempDir: '/tmp/worktree',
      isContinueMode: true,
      owner: 'konard',
      repo: 'test-hello-world',
      feedbackLines: ['Review comment: please fix the build.'],
    };
    const formalAi = prompts.buildUserPrompt({ ...userParams, argv: { model: 'formal-ai' } });
    assert.equal(formalAi, prompts.buildUserPrompt({ ...userParams, argv: { model: 'native-model' } }), `${tool} user prompt`);
    assert.match(formalAi, /Review comment: please fix the build\./, `${tool} keeps the feedback`);
  }
});

test('native provider models retain their workflow prompt', () => {
  for (const [tool, prompts] of promptModules) {
    const systemPrompt = prompts.buildSystemPrompt(systemParams('native-model'));
    assert.notEqual(systemPrompt, '', `${tool} must retain its native-model system prompt`);
    assert.match(systemPrompt, /Initial research\./, `${tool} keeps the established workflow guidance`);
  }
});

test('planned_not_executed is a terminal tool failure, not a successful solve', () => {
  const result = classifyFormalAiToolResult({
    model: 'formal-ai',
    toolResult: {
      success: true,
      errorDuringExecution: false,
      resultSummary: 'Planned, not executed: no artifact named by the request was changed.',
      pricingInfo: { provider: 'Link.Assistant' },
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.errorDuringExecution, true);
  assert.equal(result.formalAiNonExecution, true);
  assert.equal(result.errorInfo.code, 'FORMAL_AI_PLANNED_NOT_EXECUTED');
  assert.match(result.errorInfo.message, /did not execute repository work/i);
  assert.deepEqual(result.pricingInfo, { provider: 'Link.Assistant' }, 'unrelated result metadata survives classification');
});

test('the non-execution classifier is scoped to Formal AI and explicit terminal evidence', () => {
  const native = { success: true, resultSummary: 'Planned, not executed.' };
  assert.equal(classifyFormalAiToolResult({ model: 'native-model', toolResult: native }), native);

  const formalAiSuccess = { success: true, resultSummary: 'Implemented the requested files and ran the tests.' };
  assert.equal(classifyFormalAiToolResult({ model: 'formal-ai', toolResult: formalAiSuccess }), formalAiSuccess);

  const mentionedMarker = { success: true, resultSummary: 'Implemented handling for planned_not_executed and verified the tests.' };
  assert.equal(classifyFormalAiToolResult({ model: 'formal-ai', toolResult: mentionedMarker }), mentionedMarker, 'mentioning the marker is not itself a terminal state');

  const structuredMarker = { success: true, resultSummary: 'Plan event:\n  terminal_state "planned_not_executed"' };
  assert.equal(classifyFormalAiToolResult({ model: 'formal-ai', toolResult: structuredMarker }).success, false, 'the structured terminal state is recognized');
});

test('auto-continue turns a discovered PR number into a PR URL', () => {
  const prUrl = buildGitHubPullRequestUrl({ owner: 'konard', repo: 'test-hello-world', number: 2 });
  assert.equal(prUrl, 'https://github.com/konard/test-hello-world/pull/2');

  const prompt = claudePrompts.buildUserPrompt({
    issueUrl: 'https://github.com/konard/test-hello-world/issues/1',
    issueNumber: 1,
    prNumber: 2,
    prUrl,
    branchName: 'issue-1-example',
    tempDir: '/tmp/worktree',
    isContinueMode: true,
    owner: 'konard',
    repo: 'test-hello-world',
    argv: {},
  });
  assert.match(prompt, /Your prepared Pull Request: https:\/\/github\.com\/konard\/test-hello-world\/pull\/2/);
  assert.doesNotMatch(prompt, /Your prepared Pull Request: .*\/issues\/1/);
});
