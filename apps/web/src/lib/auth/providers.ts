/**
 * Identity Provider Utilities
 * 
 * Helper functions for working with configured identity providers
 */

export type IdentityProvider = 'okta' | 'entra-id' | 'ping';

export interface ProviderInfo {
  id: IdentityProvider;
  name: string;
  displayName: string;
  icon?: string;
  configured: boolean;
}

/**
 * Get information about all supported identity providers
 */
export function getProviderInfo(): ProviderInfo[] {
  return [
    {
      id: 'okta',
      name: 'Okta',
      displayName: 'Sign in with Okta',
      configured: isProviderConfigured('okta'),
    },
    {
      id: 'entra-id',
      name: 'Microsoft Entra ID',
      displayName: 'Sign in with Microsoft',
      configured: isProviderConfigured('entra-id'),
    },
    {
      id: 'ping',
      name: 'PingID',
      displayName: 'Sign in with PingID',
      configured: isProviderConfigured('ping'),
    },
  ];
}

/**
 * Check if a specific provider is configured (server-side only)
 */
export function isProviderConfigured(provider: IdentityProvider): boolean {
  switch (provider) {
    case 'okta':
      return !!(
        process.env.OKTA_CLIENT_ID &&
        process.env.OKTA_CLIENT_SECRET &&
        process.env.OKTA_ISSUER
      );
    case 'entra-id':
      return !!(
        process.env.ENTRA_CLIENT_ID &&
        process.env.ENTRA_CLIENT_SECRET &&
        process.env.ENTRA_TENANT_ID
      );
    case 'ping':
      return !!(
        process.env.PING_CLIENT_ID &&
        process.env.PING_CLIENT_SECRET &&
        process.env.PING_ISSUER
      );
    default:
      return false;
  }
}

/**
 * Get all configured providers (server-side only)
 */
export function getConfiguredProviders(): ProviderInfo[] {
  return getProviderInfo().filter(p => p.configured);
}

/**
 * Get the primary (first) configured provider (server-side only)
 */
export function getPrimaryProvider(): ProviderInfo | null {
  const configured = getConfiguredProviders();
  return configured.length > 0 ? configured[0] : null;
}

/**
 * Check if any provider is configured (server-side only)
 */
export function hasConfiguredProvider(): boolean {
  return getConfiguredProviders().length > 0;
}

