This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app --typescript`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
## NextJs Aws Serverless Deploy

---
- [Description](#description)
- [Installation](#installation)
- [Env Example](#env-example)
- [Package Json Scripts](#package-json-scripts)
- [Testing](#testing)
- [Linting](#linting)
- [Git Hooks](#gitHooks)
- [Deployment](#deployment)

---

# Description

This Next Js starter repo is configured with:
* [NextJs 12](https://nextjs.org/blog/next-12) (using swc Minify)
* [Typescript](https://www.typescriptlang.org/)
* [ESLint](https://eslint.org/) Linter
* [Jest](https://jestjs.io/) Testing framework
* [Husky](https://typicode.github.io/husky/#/) Git Hooks
* [AWS CDK CI/CD Pipeline](https://docs.aws.amazon.com/cdk/v1/guide/cdk_pipeline.html) (Infrastructure as code).
* [Serverless NextJs CDK Construct](https://serverless-nextjs.com/docs/cdkconstruct/) (experimental)

---

# Installation

First, install required packages:

```bash
yarn install
```

> **Note**: It is important to use `yarn` to install dependencies because of the `yarn.lock` file. Using npm would likely result in errors.
>
> [_Installing Yarn_](https://classic.yarnpkg.com/lang/en/docs/install/#install-via-npm)

### Starting Dev server
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

### Learn More About Next.js Framework 

Take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

---

# Env Example
The AWS CDK deployment depends on variables set in the `.env` file. Below are the required variable and example usages.

**These values are examples and should _NOT_ be used and will _NOT WORK_ in your deployed app**
```dotenv
# The AWS Account ID you want to create the deployment for.
AWS_ACCOUNT_ID=123456789012

# Preffered AWS Region for the Pipeline
AWS_REGION_DEFAULT=us-east-1

# Connection Arn for the Source Repository
# Docs for how to Setup: https://docs.aws.amazon.com/dtconsole/latest/userguide/connections-create.html
AWS_REPO_SOURCE_CONNECTION_ARN=arn:aws:codestar-connections:us-east-1:123456789012:connection/62ce35c0-6800-11ec-90d6-0242ac120003

# A string that encodes owner and repository separated by a slash (e.g. 'owner/repo').
STAGING_REPO_STRING=myUser/someRepoOfMine

# Branch name the will trigger CI/CD Pipeline
STAGING_SOURCE_BRANCH= develop
```

The next set of variables are optional. Not setting the domain variables will mean your app will only be available at the Secure CloudFront Url created automatically, for example: `http://d111111abcdef8.cloudfront.net/index.html`. You can then attach that value to a DNS record manually. Either in AWS or with another Registrar.

```dotenv
# Custom Domain name for Staging infrastructure. This will be used to create an A record in Route 53.
# You must have an existing hosted zone setup, see below for details.
STAGING_DOMAIN=staging.rea-dev.com
```
Requesting a Public Cert with AWS: https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html
```dotenv
# SSl Cretificate Arn for your custom Staging Domain
STAGING_DOMAIN_SSL_CERT_ARN=arn:aws:acm:us-east-1:123456789012:certificate/62ce35c0-6800-11ec-90d6-0242ac120003
```
Creating a Hosted Zone in AWS: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html
```dotenv
# AWS Route 53 Hosted Zone ID
STAGING_HOSTED_ZONE_ID=SHETE57DONT9DWERK6U

# AWS Route 53 Host Zone Name, will most likly be your domain name, without any subdomain.
STAGING_DOMAIN_ZONE_NAME=mydomain.com
```