import { Construct, Stack, StackProps } from '@aws-cdk/core';
import {
    CodePipeline,
    CodePipelineSource,
    ShellStep,
} from '@aws-cdk/pipelines';
import { ComputeType } from '@aws-cdk/aws-codebuild';
import { nextjsAppStage } from './nextjsAppStage';

class nextjsServerlessStagingPipeline extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const appName = this.node.tryGetContext('appName');
        const appAbbr = this.node.tryGetContext('appAbbr');
        const environmentTag = this.node.tryGetContext('stagingEnvTag');
        const { stagingResourceSettings } =
            this.node.tryGetContext('appResources');
        const awsContextTags = {
            Project: this.node.tryGetContext('projectTag'),
            AppVersion: this.node.tryGetContext('appVersionTag'),
            AppName: this.node.tryGetContext('appNameTag'),
            Environment: environmentTag,
        };
        const repo = CodePipelineSource.connection(
            `${stagingResourceSettings.stagingRepoString}`,
            `${stagingResourceSettings.stagingSourceBranch}`,
            {
                connectionArn: `${stagingResourceSettings.sourceRepoConnectionArn}`,
            },
        );

        const pipeline = new CodePipeline(this, `${appName}-staging-pipeline`, {
            pipelineName: `${appName}-staging-pipeline`,
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
        });

        // build staging infrastructure
        pipeline.addStage(
            new nextjsAppStage(this, `staging`, {
                appEnvType: this.node.tryGetContext('stagingEnvTag'),
                appResources: stagingResourceSettings,
                appName,
                appAbbr,
                awsContextTags,
            }),
            {
                //todo get cloudfront URL from AppStage for validation. Check/validate custom domain if set.
                // post: [
                //     new ShellStep('validate-staging-cloudfront-url', {
                //         commands: [
                //             `API_HANDLER_DOMAIN=https://${stagingResourceSettings.domain}`,
                //             'curl -Ssf $API_HANDLER_DOMAIN',
                //         ],
                //     }),
                // ],
            },
        );
    }
}

export { nextjsServerlessStagingPipeline };
