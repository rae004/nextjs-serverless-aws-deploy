import fs from 'fs';
import dotenv from 'dotenv';
import { App } from '@aws-cdk/core';
import { Builder } from '@sls-next/lambda-at-edge';
import { version } from '../package.json';
import { nextjsServerlessStagingPipeline } from './stagingCdkPipeline';
import { nextjsServerlessProductionPipeline } from './productionCdkPipeline';

const envPath = '.env';
const localEnvPath = '.env.local';
if (fs.existsSync(`${localEnvPath}`)) {
    dotenv.config({ path: `${localEnvPath}` });
} else {
    dotenv.config({ path: `${envPath}` });
}

const appEnvironmentResources = {
    productionResourceSettings: {
        lambda: { memoryLimitMiB: 1024 },
        sourceRepoConnectionArn: process.env.AWS_GITHUB_CONNECTION_ARN,
        stagingRepoString: process.env.PRODUCTION_REPO_STRING,
        stagingSourceBranch: process.env.PRODUCTION_SOURCE_BRANCH,
        domain: process.env.PRODUCTION_DOMAIN,
        domainSslCertArn: process.env.PRODUCTION_DOMAIN_SSL_CERT_ARN,
        domainHostedZoneId: process.env.PRODUCTION_HOSTED_ZONE_ID,
        domainZoneName: process.env.PRODUCTION_DOMAIN_ZONE_NAME,
    },
    stagingResourceSettings: {
        lambda: { memoryLimitMiB: 512 },
        sourceRepoConnectionArn: process.env.AWS_GITHUB_CONNECTION_ARN,
        stagingRepoString: process.env.STAGING_REPO_STRING,
        stagingSourceBranch: process.env.STAGING_SOURCE_BRANCH,
        domain: process.env.STAGING_DOMAIN,
        domainSslCertArn: process.env.STAGING_DOMAIN_SSL_CERT_ARN,
        domainHostedZoneId: process.env.STAGING_HOSTED_ZONE_ID,
        domainZoneName: process.env.STAGING_DOMAIN_ZONE_NAME,
    },
};

(async () => {
    try {
        // Build production app directory, per Lambda at Edge Specs
        const builderProd = new Builder('.', './build-production', {
            env: {
                NODE_ENV: 'production',
            },
            args: ['build'],
        });
        await builderProd.build(true);

        //Build development app directory, per Lambda at Edge Specs
        const builderStaging = new Builder('.', './build-staging', {
            env: {
                NODE_ENV: 'development',
            },
            args: ['build'],
        });
        await builderStaging.build(true);

        // // Create CDK app instance test update
        // todo pass name and tag values from env for easier configuration.
        const app = new App({
            context: {
                appName: 'nextjs-serverless-starter',
                appAbbr: 'rae-dev-next-js',
                account: `${process.env.AWS_ACCOUNT_ID}`,
                region: `${process.env.AWS_REGION_DEFAULT}`,
                projectTag: 'Rae Dev Starters',
                appNameTag: 'NextJs Serverless',
                appVersionTag: `${version}`,
                stagingEnvTag: 'staging',
                productionEnvTag: 'production',
                appResources: appEnvironmentResources,
            },
        });

        const appName = app.node.tryGetContext('appName');
        const stagingEnvTag = app.node.tryGetContext('stagingEnvTag');
        const productionEnvTag = app.node.tryGetContext('productionEnvTag');
        const awsContextTags = {
            Project: app.node.tryGetContext('projectTag'),
            AppVersion: app.node.tryGetContext('appVersionTag'),
            AppName: app.node.tryGetContext('appNameTag'),
        };

        // Create staging CDK pipeline instance
        new nextjsServerlessStagingPipeline(
            app,
            `${appName}-staging-pipeline`,
            {
                env: {
                    region: `${app.node.tryGetContext('region')}`,
                },
                analyticsReporting: true,
                description: `Deployment of ${stagingEnvTag} ${appName} NextJS using Serverless CDK Construct`,
                tags: {
                    Environment: stagingEnvTag,
                    ...awsContextTags,
                },
            },
        );

        // // Create production CDK pipeline instance
        new nextjsServerlessProductionPipeline(
            app,
            `${appName}-production-pipeline`,
            {
                env: {
                    region: 'us-east-1',
                },
                analyticsReporting: true,
                description: `Deployment of ${productionEnvTag} ${appName} NextJS using Serverless CDK Construct`,
                tags: {
                    Environment: productionEnvTag,
                    ...awsContextTags,
                },
            },
        );
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
