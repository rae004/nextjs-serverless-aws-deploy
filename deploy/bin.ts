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
const requiredEnvVars = [
    'AWS_ACCOUNT_ID',
    'AWS_REGION_DEFAULT',
    'AWS_GITHUB_CONNECTION_ARN',
    'AWS_RESOURCE_APP_NAME',
    'PRODUCTION_REPO_STRING',
    'PRODUCTION_SOURCE_BRANCH',
    'STAGING_REPO_STRING',
    'STAGING_SOURCE_BRANCH',
];
const missingRequiredEnvs = requiredEnvVars.filter((key) => !process.env[key]);
const appEnvironmentResources = {
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
    stagingResourceSettings: {
        lambda: { memoryLimitMiB: 512 },
        sourceRepoConnectionArn: process.env.AWS_GITHUB_CONNECTION_ARN,
        sourceRepoString: process.env.PRODUCTION_REPO_STRING,
        sourceRepoBranch: process.env.PRODUCTION_SOURCE_BRANCH,
        stagingDomain: process.env.STAGING_DOMAIN,
        stagingDomainSslCertArn: process.env.STAGING_DOMAIN_SSL_CERT_ARN,
        stagingDomainHostedZoneId: process.env.STAGING_HOSTED_ZONE_ID,
        stagingDomainZoneName: process.env.STAGING_DOMAIN_ZONE_NAME,
    },
};

(async () => {
    // check for missing required environment variables.
    if (missingRequiredEnvs.length > 0) {
        let errMessage = 'You must set ';
        for (const missing of missingRequiredEnvs) {
            errMessage += `${missing}, `;
        }
        errMessage = errMessage.slice(0, -2);
        errMessage += ' in .env file.';
        throw new Error(errMessage);
    }

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
                NODE_ENV: 'test',
            },
            args: ['build'],
        });
        await builderStaging.build(true);

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
                stagingEnvTag: 'staging',
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
                    region: app.node.tryGetContext('region'),
                    account: app.node.tryGetContext('account'),
                },
                analyticsReporting: true,
                description: `Deployment of ${productionEnvTag} ${appName} NextJS using Serverless CDK Construct`,
                tags: {
                    Environment: `${productionEnvTag}`,
                    ...awsContextTags,
                },
            },
        );
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
