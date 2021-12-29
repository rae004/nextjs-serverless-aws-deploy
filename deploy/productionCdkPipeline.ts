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
        const appAbbr = this.node.tryGetContext('appAbbr');
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
            `${appResources.productionResourceSettings.stagingRepoString}`,
            `${appResources.productionResourceSettings.stagingSourceBranch}`,
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

        let validateStaging = {};
        if (appResources.stagingResourceSettings.domain) {
            validateStaging = {
                post: [
                    new ShellStep('validate-staging-cloudfront-url', {
                        commands: [
                            `API_HANDLER_DOMAIN=https://${appResources.stagingResourceSettings.domain}`,
                            'curl -Ssf $API_HANDLER_DOMAIN',
                        ],
                    }),
                ],
            };
        }

        // build staging infrastructure
        pipeline.addStage(
            new nextjsAppStage(this, `staging`, {
                appEnvType: stagingTag,
                appResources: appResources.stagingResourceSettings,
                appName,
                appAbbr,
                awsContextTags: {
                    ...awsContextTags,
                    stagingTag,
                },
            }),
            validateStaging,
        );

        const manualApproveProductionPreStep = {
            pre: [new ManualApprovalStep('deploy-to-prod')],
        };
        const validateProductionPostStep = {
            post: [
                new ShellStep('validate-staging-cloudfront-url', {
                    commands: [
                        `API_HANDLER_DOMAIN=https://${appResources.stagingResourceSettings.domain}`,
                        'curl -Ssf $API_HANDLER_DOMAIN',
                    ],
                }),
            ],
        };
        const prodStagOptions = appResources.productionResourceSettings.domain
            ? {
                  ...manualApproveProductionPreStep,
                  ...validateProductionPostStep,
              }
            : { ...manualApproveProductionPreStep };

        // build production infrastructure
        pipeline.addStage(
            new nextjsAppStage(this, `production`, {
                appEnvType: productionTag,
                appResources: appResources.productionResourceSettings,
                appName,
                appAbbr,
                awsContextTags: {
                    ...awsContextTags,
                    productionTag,
                },
            }),
            prodStagOptions,
        );
    }
}
export { nextjsServerlessProductionPipeline };
