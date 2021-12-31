import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { NextStack } from './nextjsServerlessStack';

interface ourStageProps extends StageProps {
    appEnvType: string;
    appResources: { [key: string]: any };
    appName: string;
    awsContextTags: { [key: string]: any };
}

class nextjsAppStage extends Stage {
    constructor(scope: Construct, id: string, props: ourStageProps) {
        super(scope, id, props);

        new NextStack(this, `serverless-${props.appName}`, {
            resources: props.appResources,
            appName: props.appName,
            appEnvType: props.appEnvType,
            description: `Serverless ${
                props.appName
            } NextJs Lambda Application Built on ${new Date().toISOString()}`,
            tags: props.awsContextTags,
        });
    }
}

export { nextjsAppStage };
