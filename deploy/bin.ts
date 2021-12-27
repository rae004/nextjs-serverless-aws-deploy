import fs from 'fs';
import dotenv from 'dotenv';
import { App } from '@aws-cdk/core';
import { Builder } from '@sls-next/lambda-at-edge';
import { version } from '../package.json';

const envPath = '.env';
const localEnvPath = '.env.local';
// todo add env domain envs to make configurable.
const appEnvironmentResources = {
    productionResourceSettings: {
        lambda: { memoryLimitMiB: 1024 },
        domain: '*.rae-dev.com',
        domainSslCertArn: '',
        domainHostedZoneId: '',
        domainZoneName: 'rae-dev.com',
    },
    stagingResourceSettings: {
        lambda: { memoryLimitMiB: 512 },
        domain: '*.rae-dev.com',
        domainSslCertArn: '',
        domainHostedZoneId: '',
        domainZoneName: 'rae-dev.com',
    },
    deployNotificationList: ['rae004dev@gmail.com'],
};

if (fs.existsSync(`${localEnvPath}`)) {
    dotenv.config({ path: `${localEnvPath}` });
} else {
    dotenv.config({ path: `${envPath}` });
}

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
        const app = new App({
            context: {
                appName: 'NextJs Serverless Starter',
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
        console.log('our aws id: ', app.node.tryGetContext('account'));
        console.log('our aws region: ', app.node.tryGetContext('region'));

        // const appName = app.node.tryGetContext('appName');
        // const stagingEnvTag = app.node.tryGetContext('stagingEnvTag');
        // const productionEnvTag = app.node.tryGetContext('productionEnvTag');
        // const awsContextTags = {
        //     Project: app.node.tryGetContext('projectTag'),
        //     AppVersion: app.node.tryGetContext('appVersionTag'),
        //     AppName: app.node.tryGetContext('appNameTag'),
        // };

        // // Create staging CDK pipeline instance
        // new CmAppEngineStagingPipeline(app, `${appName}-staging-pipeline`, {
        //     env: {
        //         region: 'us-east-1',
        //     },
        //     analyticsReporting: true,
        //     description: `Deployment of ${stagingEnvTag} ${appName} NextJS using Serverless CDK Construct`,
        //     tags: {
        //         Environment: stagingEnvTag,
        //         ...awsContextTags,
        //     },
        // });

        // Create production CDK pipeline instance
        // new CmAppEngineProductionPipeline(
        //     app,
        //     `${appName}-production-pipeline`,
        //     {
        //         env: {
        //             region: 'us-east-1',
        //         },
        //         analyticsReporting: true,
        //         description: `Deployment of ${productionEnvTag} ${appName} NextJS using Serverless CDK Construct`,
        //         tags: {
        //             Environment: productionEnvTag,
        //             ...awsContextTags,
        //         },
        //     },
        // );
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();