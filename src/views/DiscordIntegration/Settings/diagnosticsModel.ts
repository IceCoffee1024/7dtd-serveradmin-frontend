import type { DiscordNetworkDiagnosticsDto } from '~/generated/api/types.gen';

export type DiagnosticStep = NonNullable<DiscordNetworkDiagnosticsDto['steps']>[number];

/**
 * Summary consumed by the bot runtime panel after required Discord connectivity checks are evaluated.
 */
export interface DiagnosticSummary {
  type: 'success' | 'error';
  title: string;
  description: string;
  passedCount: number;
  totalCount: number;
  requiredHealthyCount: number;
  requiredTotalCount: number;
}

type Translate = (key: string) => string;

/**
 * Finds a diagnostic step by its stable backend key.
 * @param diagnostics - Network diagnostic result returned by the backend.
 * @param key - Stable diagnostic step key such as gatewayWebSocket or proxyTcp.
 * @returns Matching diagnostic step when present.
 */
export function findNetworkDiagnosticStep(diagnostics: DiscordNetworkDiagnosticsDto | null | undefined, key: string): DiagnosticStep | undefined {
  return diagnostics?.steps?.find(step => step.key === key);
}

/**
 * Builds the page-level health summary for Discord network diagnostics.
 * @param diagnostics - Network diagnostic result returned by the backend.
 * @param t - Translation function used for user-facing summary text.
 * @returns A panel-ready summary, or null before diagnostics have been run.
 */
export function buildNetworkDiagnosticSummary(diagnostics: DiscordNetworkDiagnosticsDto | null | undefined, t: Translate): DiagnosticSummary | null {
  if (!diagnostics)
    return null;

  const steps = diagnostics.steps ?? [];
  const proxyTcp = findNetworkDiagnosticStep(diagnostics, 'proxyTcp');
  const restGateway = findNetworkDiagnosticStep(diagnostics, 'restGateway');
  const gatewayWebSocket = findNetworkDiagnosticStep(diagnostics, 'gatewayWebSocket');
  const gatewayProxyTunnel = findNetworkDiagnosticStep(diagnostics, 'gatewayProxyTunnel');
  const gatewayAvailable = gatewayWebSocket?.succeeded === true || gatewayProxyTunnel?.succeeded === true;
  const apiAvailable = restGateway?.succeeded === true;
  const proxyAvailable = diagnostics.useProxy === false || proxyTcp?.succeeded === true;
  const requiredOk = gatewayAvailable && apiAvailable && proxyAvailable;
  const requiredHealthyCount = [apiAvailable, gatewayAvailable, proxyAvailable].filter(Boolean).length;
  const passedCount = steps.filter(step => step.succeeded).length;

  return {
    type: requiredOk ? 'success' : 'error',
    title: requiredOk
      ? t('views.discordIntegration.settings.messages.networkDiagnosticsUsable')
      : t('views.discordIntegration.settings.messages.networkDiagnosticsNeedsAttention'),
    description: requiredOk && gatewayWebSocket?.succeeded === false && gatewayProxyTunnel?.succeeded === true
      ? t('views.discordIntegration.settings.messages.networkDiagnosticsFallbackUsable')
      : requiredOk
        ? t('views.discordIntegration.settings.messages.networkDiagnosticsAllGood')
        : t('views.discordIntegration.settings.messages.networkDiagnosticsFailedRequired'),
    passedCount,
    totalCount: steps.length,
    requiredHealthyCount,
    requiredTotalCount: 3,
  };
}
