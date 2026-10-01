export interface DnsRecord {
  // Relative to the zone: '' for isaacstse.dev itself, 'mail' for mail.isaacstse.dev, etc.
  name: string;
  type: 'MX' | 'TXT' | 'CNAME' | 'SRV';
  /**
   * Raw values, one per entry. Every value for the same name and type go into one record
   * (e.g. both MX servers go in one MX entry).
   *   MX:    '10 mx1.example.com'
   *   TXT:   'v=spf1 include:example.com ~all'
   *   CNAME: 'target.example.com'
   *   SRV:   '0 1 443 autodiscover.example.com'
   */
  values: string[];
  ttlMinutes?: number;
}

export const config = {
  region: 'us-east-1',
  zoneName: 'isaacstse.dev',
  siteSubdomain: 'dillon',
  githubRepo: 'isxbot/isaacstse.dev',
  githubEnvironment: 'production',
  existingGithubOidcProviderArn: undefined as string | undefined,
  alertEmail: 'dillon@isaacstse.dev',
  monthlyBudgetUsd: 5,
  emailRecords: [
    { name: '', type: 'MX', values: ['10 fwd1.porkbun.com', '20 fwd2.porkbun.com'] },
    { name: '', type: 'TXT', values: ['v=spf1 include:_spf.porkbun.com ~all'] },
    { name: 'default._domainkey', type: 'TXT', values: ['v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCZQi7W2j1u9kLQH20+Osjqh7uVgO7fet/RKimBDuNHs475SowzwL/WhXEYtckXgE9VPit3l7HPXaM11BwmegLeFNtAGeAlr6eHNjlHyP9cgG9jbR0/g0SVVrANWbyKigbtsfuLBIg+EBJ2AtmidqlFTu2afHqAelfEDR/+FVuPwIDAQAB'] },
    { name: '_dmarc', type: 'TXT', values: ['v=DMARC1; p=quarantine; rua=mailto:25f8c5e6@mxtoolbox.dmarc-report.com; ruf=mailto:25f8c5e6@forensics.dmarc-report.com; fo=1'] },
  ] as DnsRecord[],
};
