import fs from 'fs';
import dotenv from 'dotenv';
import { App } from '@aws-cdk/core';
import { Builder } from '@sls-next/lambda-at-edge';
import { version } from '../package.json';
import { nextjsServerlessProductionPipeline } from './productionCdkPipeline';

const envPath = '.env';
const localEnvPath = '.env.local';
if (fs.existsSync(`${localEnvPath}`)) {
    dotenv.config({ path: `${localEnvPath}` });
} else {
    dotenv.config({ path: `${envPath}` });
}

const appEnvironmentResources = {
    // todo update prod resource setting property names to match prod.
    productionResourceSettings: {
        lambda: { memoryLimitMiB: 1024 },
        sourceRepoConnectionArn: process.env.AWS_GITHUB_CONNECTION_ARN,
        sourceRepoString: process.env.PRODUCTION_REPO_STRING,
        sourceRepoBranch: process.env.PRODUCTION_SOURCE_BRANCH,
        domain: process.env.PRODUCTION_DOMAIN,
        domainSslCertArn: process.env.PRODUCTION_DOMAIN_SSL_CERT_ARN,
        domainHostedZoneId: process.env.PRODUCTION_HOSTED_ZONE_ID,
        domainZoneName: process.env.PRODUCTION_DOMAIN_ZONE_NAME,
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

        // // Create CDK app instance test update
        // todo pass name and tag values from env for easier configuration.
        const app = new App({
            context: {
                appName: process.env.AWS_RESOURCE_APP_NAME,
                account: process.env.AWS_ACCOUNT_ID,
                region: process.env.AWS_REGION_DEFAULT,
                projectTag: 'Rae Dev Starters',
                appNameTag: 'NextJs Serverless',
                appVersionTag: `${version}`,
                productionEnvTag: 'production',
                appResources: appEnvironmentResources,
            },
        });

        const appName = app.node.tryGetContext('appName');
        const productionEnvTag = app.node.tryGetContext('productionEnvTag');
        const awsContextTags = {
            Project: app.node.tryGetContext('projectTag'),
            AppVersion: app.node.tryGetContext('appVersionTag'),
            AppName: app.node.tryGetContext('appNameTag'),
        };

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
