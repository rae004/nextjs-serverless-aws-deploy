import { Construct, Fn, Stack, StackProps } from '@aws-cdk/core';
import {
    CodePipeline,
    CodePipelineSource,
    ManualApprovalStep,
    ShellStep,
} from '@aws-cdk/pipelines';
import { ComputeType } from '@aws-cdk/aws-codebuild';
import { nextjsAppStage } from './nextjsAppStage';

class nextjsServerlessProductionPipeline extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const appName = this.node.tryGetContext('appName');
        const appResources = this.node.tryGetContext('appResources');
        const productionTag = this.node.tryGetContext('productionEnvTag');
        const stagingTag = this.node.tryGetContext('stagingEnvTag');
        const awsContextTags = {
            Project: this.node.tryGetContext('projectTag'),
            AppVersion: this.node.tryGetContext('appVersionTag'),
            AppName: this.node.tryGetContext('appNameTag'),
        };

        //Get our source repo
        const repo = CodePipelineSource.connection(
            `${appResources.productionResourceSettings.sourceRepoString}`,
            `${appResources.productionResourceSettings.sourceRepoBranch}`,
            {
                connectionArn: `${appResources.productionResourceSettings.sourceRepoConnectionArn}`,
            },
        );

        const pipeline = new CodePipeline(
            this,
            `${appName}-production-pipeline`,
            {
                pipelineName: `${appName}-production-pipeline`,
                codeBuildDefaults: {
                    buildEnvironment: {
                        computeType: ComputeType.MEDIUM,
                    },
                },
                synth: new ShellStep('Synth', {
                    input: repo,
                    commands: [
                        'npm install -g aws-cdk@^1.128.0',
                        'yarn install',
                        'yarn cdk synth',
                    ],
                }),
            },
        );

        // build staging infrastructure
        const ourStagingNextJsApp = new nextjsAppStage(this, `${stagingTag}`, {
            appEnvType: `${stagingTag}`,
            appResources: appResources.stagingResourceSettings,
            appName,
            awsContextTags: {
                ...awsContextTags,
                Environment: `${stagingTag}`,
            },
        });
        ourStagingNextJsApp.synth();
        const ourStagCfDomain = Fn.importValue(`${stagingTag}CloudfrontDomain`);
        const stagingStageOptions = {
            post: [
                new ShellStep('validate-staging-cloudfront-url', {
                    commands: [
                        `API_HANDLER_DOMAIN=https://${ourStagCfDomain}`,
                        'curl -Ssf $API_HANDLER_DOMAIN',
                    ],
                }),
            ],
        };
        pipeline.addStage(ourStagingNextJsApp, stagingStageOptions);

        // build production infrastructure
        const ourProductionNextJs = new nextjsAppStage(this, `production`, {
            appEnvType: productionTag,
            appResources: appResources.productionResourceSettings,
            appName,
            awsContextTags: {
                ...awsContextTags,
                Environment: `${productionTag}`,
            },
        });
        // ourProductionNextJs.synth();
        // const ourProdCfDomain = Fn.importValue(
        //     `${productionTag}CloudfrontDomain`,
        // );
        const manualApprovalProductionStep = new ManualApprovalStep(
            'deploy-to-prod',
        );
        const executeJestTestsStep = new ShellStep('execute-jest-tests', {
            installCommands: ['yarn install'],
            commands: ['yarn test'],
        });
        // const productionUrlToValidate = appResources.productionResourceSettings
        //     .domain
        //     ? appResources.productionResourceSettings.domain
        //     : ourProdCfDomain;
        // const validateProductionUrlStep = new ShellStep(
        //     'validate-production-url',
        //     {
        //         commands: [
        //             `API_HANDLER_DOMAIN=https://${productionUrlToValidate}`,
        //             'curl -Ssf $API_HANDLER_DOMAIN',
        //         ],
        //     },
        // );
        const productionStageOptions = {
            pre: [manualApprovalProductionStep, executeJestTestsStep],
            // post: [validateProductionUrlStep],
        };
        pipeline.addStage(ourProductionNextJs, productionStageOptions);
    }
}
export { nextjsServerlessProductionPipeline };
