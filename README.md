This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app --typescript`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
## NextJs Aws Serverless Deploy

---
- [Description](#markdown-header-description)
- [Installation](#markdown-header-installation)
- [Env Example](#markdown-header-environment-example)
- [Testing](#markdown-header-testing)
- [Linting](#markdown-header-linting)
- [Formatting](#markdown-header-Formatting)
- [Git Hooks](#markdown-header-GitHooks)

---

## Description

This Next Js starter repo is configured with:
* [NextJs 12](https://nextjs.org/blog/next-12) (using swc Minify)
* [Typescript](https://www.typescriptlang.org/)
* [ESLint](https://eslint.org/) Linter
* [Jest](https://jestjs.io/) Testing framework
* [Husky](https://typicode.github.io/husky/#/) Git Hooks
* [AWS CDK CI/CD Pipeline](https://docs.aws.amazon.com/cdk/v1/guide/cdk_pipeline.html) (Infrastructure as code).
* [Serverless NextJs CDK Construct](https://serverless-nextjs.com/docs/cdkconstruct/) (experimental)

## Installation

First, install required packages:

```bash
yarn install
```

> **Note**: It is important to use `yarn` to install dependencies because of the `yarn.lock` file. Using npm would likely result in errors.

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
