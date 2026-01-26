module.exports = {
    apps: [
        {
            name: 'womensafety-frontend',
            script: 'npm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
            },
        },
        {
            name: 'womensafety-backend',
            script: 'npm',
            args: 'run dev',
            cwd: './backend',
            env: {
                NODE_ENV: 'development',
            },
        },
    ],
};
