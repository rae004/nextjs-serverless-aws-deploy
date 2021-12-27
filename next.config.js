/** @type {import('next').NextConfig} */
module.exports = {
    swcMinify: true,
    reactStrictMode: true,
    env: {
        AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
    },
};
