import { CfnOutput, Duration, Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { config, DnsRecord } from './config';

/**
 * Route 53 hosted zone for isaacstse.dev.
 */
export class DnsStack extends Stack {
  readonly zone: route53.IPublicHostedZone;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    validateEmailRecords(config.emailRecords);

    const zone = new route53.PublicHostedZone(this, 'Zone', { zoneName: config.zoneName });
    zone.applyRemovalPolicy(RemovalPolicy.RETAIN);
    this.zone = zone;

    for (const record of config.emailRecords) {
      new route53.RecordSet(this, recordId(record), {
        zone,
        recordType: route53.RecordType[record.type],
        recordName: record.name || undefined,
        target: route53.RecordTarget.fromValues(
          ...(record.type === 'TXT' ? record.values.map(formatTxt) : record.values),
        ),
        ttl: Duration.minutes(record.ttlMinutes ?? 60),
      });
    }

    new route53.CaaRecord(this, 'Caa', {
      zone,
      values: [
        { flag: 0, tag: route53.CaaTag.ISSUE, value: 'amazon.com' },
        { flag: 0, tag: route53.CaaTag.ISSUEWILD, value: 'amazon.com' },
      ],
    });

    new CfnOutput(this, 'NameServers', {
      description: 'Set these as the authoritative nameservers at Porkbun',
      value: Fn.join(' ', zone.hostedZoneNameServers!),
    });
  }
}

function validateEmailRecords(records: DnsRecord[]) {
  if (records.length === 0) {
    throw new Error(
      'config.emailRecords is empty. Copy your email DNS records into infra/lib/config.ts'
    );
  }
  const seen = new Set<string>();
  for (const record of records) {
    const key = `${record.type} ${record.name}`;
    if (seen.has(key)) {
      throw new Error(
        `Two ${record.type} entries for "${record.name || '@'}". Put all values in a single entry.`
      );
    }
    seen.add(key);
  }
}

/**
 * Stable construct ID of type-name, so reordering the config doesn't recreate records.
 */
function recordId(record: DnsRecord) {
  const name = (record.name || 'apex').replace(/[^A-Za-z0-9]/g, '-');
  return `${record.type}-${name}`;
}

/**
 * Split TXT records into strings <= 255 characters (for DKIM).
 */
function formatTxt(value: string) {
  const chunks = value.match(/.{1,255}/g) ?? [''];
  return chunks.map((chunk) => `"${chunk.replace(/(["\\])/g, '\\$1')}"`).join(' ');
}
