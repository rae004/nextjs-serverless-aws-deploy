import { Construct, Stack, StackProps, Duration } from '@aws-cdk/core';
import { NextJSLambdaEdge } from '@sls-next/cdk-construct';
import { Runtime } from '@aws-cdk/aws-lambda';
import {
    CachePolicy,
    OriginRequestHeaderBehavior,
    OriginRequestPolicy,
    AllowedMethods,
} from '@aws-cdk/aws-cloudfront';
import { HostedZone } from '@aws-cdk/aws-route53';
import { Certificate } from '@aws-cdk/aws-certificatemanager';

interface ourStackProps extends StackProps {
    buildType: string;
    resources: { [key: string]: any };
}

export class NextStack extends Stack {
    private readonly nextJSOriginRequestPolicy: OriginRequestPolicy;
    constructor(scope: Construct, id: string, props: ourStackProps) {
        super(scope, id, props);

        let ourHostedZone;
        let ourSslCertificate;
        let stackDomain;
        if (
            props.resources.domainHostedZoneId &&
            props.resources.domainZoneName &&
            props.resources.domain
        ) {
            console.log('we made it here!');
            ourHostedZone = HostedZone.fromHostedZoneAttributes(
                this,
                'hosted-zone',
                {
                    hostedZoneId: props.resources.domainHostedZoneId,
                    zoneName: props.resources.domainZoneName,
                },
            );

            ourSslCertificate = Certificate.fromCertificateArn(
                this,
                'ssl-cert',
                props.resources.domainSslCertArn,
            );

            stackDomain = {
                domain: {
                    domainNames: [props.resources.domain],
                    hostedZone: ourHostedZone,
                    certificate: ourSslCertificate,
                },
            };
        }

        this.nextJSOriginRequestPolicy = new OriginRequestPolicy(
            this,
            'NextJsAppOriginRequestPolicy',
            {
                headerBehavior: OriginRequestHeaderBehavior.allowList(
                    'host',
                    'user-agent',
                    'referer',
                    'x-forwarded-for',
                ),
            },
        );

        new NextJSLambdaEdge(this, 'NextJsApp', {
            serverlessBuildOutDir: `./${props.buildType}`,
            runtime: Runtime.NODEJS_14_X,
            memory: props.resources.lambda.memoryLimitMiB,
            timeout: Duration.seconds(30),
            withLogging: true,
            defaultBehavior: {
                originRequestPolicy: this.nextJSOriginRequestPolicy,
                allowedMethods: AllowedMethods.ALLOW_ALL,
                cachePolicy: CachePolicy.CACHING_OPTIMIZED,
            },
            ...stackDomain,
        });
    }
}
