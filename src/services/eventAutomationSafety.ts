import type { EventAutomationRuleUpsertDto } from '~/generated/api/types.gen';
import { client } from '~/generated/api/client.gen';

export type EventAutomationRuleValidationSeverity = 'Info' | 'Warning' | 'Error';

export interface EventAutomationRuleValidationIssueDto {
  path: string;
  severity: EventAutomationRuleValidationSeverity;
  message: string;
}

export interface EventAutomationRuleValidationResultDto {
  isValid: boolean;
  issues: EventAutomationRuleValidationIssueDto[];
}

export interface EventAutomationRuleDryRunRequestDto {
  rule: EventAutomationRuleUpsertDto;
  playerId?: string | null;
  playerName?: string | null;
  entityId?: number | null;
  message?: string | null;
  chatType?: string | null;
  x?: number | null;
  y?: number | null;
  z?: number | null;
}

export interface EventAutomationRuleDryRunActionDto {
  index: number;
  type: string;
  targetPlayerId?: string | null;
  summary: string;
}

export interface EventAutomationRuleDryRunResultDto {
  validation: EventAutomationRuleValidationResultDto;
  matched: boolean;
  actions: EventAutomationRuleDryRunActionDto[];
}

export function eventAutomationValidateRule(rule: EventAutomationRuleUpsertDto) {
  return client.post<{ 200: EventAutomationRuleValidationResultDto }, unknown, true>({
    security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
    url: '/api/EventAutomation/Rules/Validate',
    body: rule,
    throwOnError: true,
  });
}

export function eventAutomationDryRunRule(request: EventAutomationRuleDryRunRequestDto) {
  return client.post<{ 200: EventAutomationRuleDryRunResultDto }, unknown, true>({
    security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
    url: '/api/EventAutomation/Rules/DryRun',
    body: request,
    throwOnError: true,
  });
}
