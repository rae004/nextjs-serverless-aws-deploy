import { Construct, Stack, StackProps } from '@aws-cdk/core';
import {
    CodePipeline,
    CodePipelineSource,
    ShellStep,
} from '@aws-cdk/pipelines';
import { ComputeType } from '@aws-cdk/aws-codebuild';
import { Subscription, SubscriptionProtocol, Topic } from '@aws-cdk/aws-sns';
import { NotificationRule } from '@aws-cdk/aws-codestarnotifications';
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
        const { deployNotificationList } =
            this.node.tryGetContext('appResources');

        //Get our source repo
        const repo = CodePipelineSource.connection(
            'apollidondev/cm-nextjs-app-engine',
            'develop',
            {
                connectionArn:
                    'arn:aws:codestar-connections:us-east-1:764751313814:connection/f26caff1-72ea-4e30-97ea-c35696052729',
            },
        );

        // create sns topic for pipeline notifications.
        const topic = new Topic(
            this,
            `${appAbbr}-${environmentTag}-pipeline-topic`,
            {
                topicName: `${appName}-${environmentTag}-pipeline-notifications`,
            },
        );
        // add sns subscription for each email in notify list
        for (const emailIndex in deployNotificationList) {
            new Subscription(
                this,
                `${appAbbr}-${environmentTag}-pipeline-subscription-${emailIndex}`,
                {
                    topic,
                    endpoint: `${deployNotificationList[emailIndex]}`,
                    protocol: SubscriptionProtocol.EMAIL,
                },
            );
        }

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
                post: [
                    new ShellStep('validate-staging-cloudfront-url', {
                        commands: [
                            `API_HANDLER_DOMAIN=https://${stagingResourceSettings.domain}`,
                            'curl -Ssf $API_HANDLER_DOMAIN',
                        ],
                    }),
                ],
            },
        );
        // build the pipeline for use in codestar notification rule
        pipeline.buildPipeline();

        // create codestar notification rule for pipeline
        new NotificationRule(
            this,
            `${appName}-${environmentTag}-pipeline-notification`,
            {
                source: pipeline.pipeline,
                events: [
                    'codepipeline-pipeline-pipeline-execution-failed',
                    'codepipeline-pipeline-pipeline-execution-canceled',
                    'codepipeline-pipeline-pipeline-execution-succeeded',
                ],
                targets: [topic],
            },
        );
    }
}

export { nextjsServerlessStagingPipeline };
