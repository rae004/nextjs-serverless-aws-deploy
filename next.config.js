// import fs from 'fs';
// import dotenv from 'dotenv';
//
// const envPath = '../.env';
// const localEnvPath = '../.env.local';
//
// if (fs.existsSync(`${localEnvPath}`)) {
//     dotenv.config({ path: `${localEnvPath}` });
// } else {
//     dotenv.config({ path: `${envPath}` });
// }

/** @type {import('next').NextConfig} */
module.exports = {
    swcMinify: true,
    reactStrictMode: true,
    env: {
        AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
    },
};
