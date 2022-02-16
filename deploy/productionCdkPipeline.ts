import { Construct, Stack, StackProps } from '@aws-cdk/core';
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

        // create a Code Pipeline instance
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

        // build staging infrastructure to use in pipeline stage
        const ourStagingNextJsApp = new nextjsAppStage(this, `${stagingTag}`, {
            appEnvType: `${stagingTag}`,
            appResources: appResources.stagingResourceSettings,
            appName,
            awsContextTags: {
                ...awsContextTags,
                Environment: `${stagingTag}`,
            },
        });
        const stagingUrlToValidate =
            appResources.stagingResourceSettings.domain &&
            new ShellStep('validate-staging-url', {
                commands: [
                    `API_HANDLER_DOMAIN=https://${appResources.stagingResourceSettings.domain}`,
                    'curl -Ssf $API_HANDLER_DOMAIN',
                ],
            });
        const stagingStageOptions = stagingUrlToValidate
            ? {
                  post: [stagingUrlToValidate],
              }
            : {};
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
        const manualApprovalProductionStep = new ManualApprovalStep(
            'deploy-to-prod',
        );
        const executeJestTestsStep = new ShellStep('execute-jest-tests', {
            installCommands: ['yarn install'],
            commands: ['yarn test'],
        });
        const validateProductionUrlStep =
            appResources.productionResourceSettings.domain &&
            new ShellStep('validate-production-url', {
                commands: [
                    `API_HANDLER_DOMAIN=https://${appResources.productionResourceSettings.domain}`,
                    'curl -Ssf $API_HANDLER_DOMAIN',
                ],
            });
        const productionStageOptions = validateProductionUrlStep
            ? {
                  pre: [manualApprovalProductionStep, executeJestTestsStep],
                  post: [validateProductionUrlStep],
              }
            : {
                  pre: [manualApprovalProductionStep, executeJestTestsStep],
              };
        pipeline.addStage(ourProductionNextJs, productionStageOptions);
    }
}
export { nextjsServerlessProductionPipeline };
