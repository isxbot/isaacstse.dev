#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { config } from '../lib/config';
import { DnsStack } from '../lib/dns-stack';
import { SiteStack } from '../lib/site-stack';

const app = new App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: config.region };

const dns = new DnsStack(app, 'dns', {
  env,
  description: 'isaacstse.dev hosted zone and email records',
});

new SiteStack(app, 'Site', {
  env,
  zone: dns.zone,
  description: 'dillon.isaacstse.dev static site: S3, CloudFront, ACM, deploy role',
});

Tags.of(app).add('project', 'isaacstse.dev');
