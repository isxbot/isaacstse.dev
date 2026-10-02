import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { config } from './config';
import { redirectFunction, siteRequestFunction } from './edge-functions';

interface SiteStackProps extends StackProps {
  zone: route53.IPublicHostedZone;
}

/**
 * dillon.isaacstse.dev:
 *
 *   browser -> CloudFront (TLS, security headers, clean-URL function)
 *           -> private S3 bucket (Origin Access Control)
 *
 * isaacstse.dev and www.isaacstse.dev -> a second, small, distribution to redirect.
 * 
 * Deploys via GitHub Actions with an OIDC role scoped to this bucket and distribution.
 */
export class SiteStack extends Stack {
  constructor(scope: Construct, id: string, props: SiteStackProps) {
    super(scope, id, props);

    const { zone } = props;
    const siteDomain = `${config.siteSubdomain}.${config.zoneName}`;
    const redirectDomains = [config.zoneName, `www.${config.zoneName}`];

    // ---------- TLS ----------
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: config.zoneName,
      subjectAlternativeNames: [`*.${config.zoneName}`],
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // ---------- Storage ----------
    const bucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true, // for emergency rollback
      lifecycleRules: [{ noncurrentVersionExpiration: Duration.days(30) }],
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // ---------- CDN ----------
    const siteRequest = new cloudfront.Function(this, 'SiteRequestFunction', {
      code: cloudfront.FunctionCode.fromInline(siteRequestFunction),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      comment: 'Map /path/ to /path/index.html; redirect /path to /path/',
    });

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      comment: siteDomain,
      domainNames: [siteDomain],
      certificate,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        compress: true,
        functionAssociations: [
          { function: siteRequest, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST },
        ],
      },
      errorResponses: [403, 404].map((httpStatus) => ({
        httpStatus,
        responseHttpStatus: 404,
        responsePagePath: '/404.html',
        ttl: Duration.minutes(5),
      })),
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // North America + Europe edges
    });

    const redirect = new cloudfront.Function(this, 'RedirectFunction', {
      code: cloudfront.FunctionCode.fromInline(redirectFunction(siteDomain)),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      comment: `Redirect to ${siteDomain}`,
    });

    const redirectDistribution = new cloudfront.Distribution(this, 'RedirectDistribution', {
      comment: `Redirect ${redirectDomains.join(', ')} to ${siteDomain}`,
      domainNames: redirectDomains,
      certificate,
      defaultBehavior: {
        origin: new origins.HttpOrigin(siteDomain),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        functionAssociations: [
          { function: redirect, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST },
        ],
      },
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // ---------- DNS ----------
    const aliasRecords = (idPrefix: string, recordName: string, target: cloudfront.IDistribution) => {
      const aliasTarget = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(target));
      new route53.ARecord(this, `${idPrefix}A`, { zone, recordName, target: aliasTarget });
      new route53.AaaaRecord(this, `${idPrefix}Aaaa`, { zone, recordName, target: aliasTarget });
    };
    aliasRecords('Site', config.siteSubdomain, distribution);
    aliasRecords('Apex', config.zoneName, redirectDistribution);
    aliasRecords('Www', 'www', redirectDistribution);

    // ---------- GitHub Actions deployment role ----------
    const githubOidc = config.existingGithubOidcProviderArn
      ? iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
          this,
          'GitHubOidc',
          config.existingGithubOidcProviderArn,
        )
      : new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
          url: 'https://token.actions.githubusercontent.com',
          clientIds: ['sts.amazonaws.com'],
        });

    const deployRole = new iam.Role(this, 'GitHubDeployRole', {
      description: `Deploys ${siteDomain} from ${config.githubRepo}`,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(githubOidc.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': `${config.githubSubjectPrefix}:environment:${config.githubEnvironment}`,
        },
      }),
    });

    deployRole.addToPolicy(
      new iam.PolicyStatement({ actions: ['s3:ListBucket'], resources: [bucket.bucketArn] }),
    );
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject', 's3:DeleteObject'],
        resources: [bucket.arnForObjects('*')],
      }),
    );
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['cloudfront:CreateInvalidation'],
        resources: [
          this.formatArn({
            service: 'cloudfront',
            region: '',
            resource: 'distribution',
            resourceName: distribution.distributionId,
          }),
        ],
      }),
    );

    // ---------- Alerts ----------
    const alerts = new sns.Topic(this, 'Alerts', { displayName: `${siteDomain} alerts` });
    alerts.addSubscription(new subscriptions.EmailSubscription(config.alertEmail));

    const serverErrors = new cloudwatch.Alarm(this, 'Site5xxAlarm', {
      alarmDescription: `${siteDomain}: 5xx error rate above 5% for 15 minutes`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: '5xxErrorRate',
        dimensionsMap: { DistributionId: distribution.distributionId, Region: 'Global' },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    serverErrors.addAlarmAction(new cwActions.SnsAction(alerts));
    serverErrors.addOkAction(new cwActions.SnsAction(alerts));

    new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: 'personal-monthly',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: config.monthlyBudgetUsd, unit: 'USD' },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{ subscriptionType: 'EMAIL', address: config.alertEmail }],
        },
        {
          notification: {
            notificationType: 'FORECASTED',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{ subscriptionType: 'EMAIL', address: config.alertEmail }],
        },
      ],
    });

    // ---------- Outputs ----------
    new CfnOutput(this, 'SiteUrl', { value: `https://${siteDomain}` });
    new CfnOutput(this, 'SiteBucketName', {
      value: bucket.bucketName,
      description: 'GitHub variable SITE_BUCKET',
    });
    new CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'GitHub variable DISTRIBUTION_ID',
    });
    new CfnOutput(this, 'DeployRoleArn', {
      value: deployRole.roleArn,
      description: 'GitHub variable AWS_DEPLOY_ROLE_ARN',
    });
  }
}
