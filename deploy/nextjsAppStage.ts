import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { NextStack } from './nextjsServerlessStack';

interface ourStageProps extends StageProps {
    appEnvType: string;
    appResources: { [key: string]: any };
    appAbbr: string;
    appName: string;
    awsContextTags: { [key: string]: any };
}

class nextjsAppStage extends Stage {
    constructor(scope: Construct, id: string, props: ourStageProps) {
        super(scope, id, props);

        new NextStack(this, `serverless-${props.appAbbr}`, {
            buildType: `build-${props.appEnvType}`,
            resources: props.appResources,
            description: `Serverless ${props.appName} NextJs Build.`,
            tags: props.awsContextTags,
        });
    }
}

export { nextjsAppStage };
