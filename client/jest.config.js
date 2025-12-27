export default {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(uuid)/)',
    ],
    testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/main.jsx',
        '!src/vite-env.d.ts',
        '!src/scripts/**',
        '!src/services/api.js',
        '!src/**/*.test.{js,jsx}',
        '!src/setupTests.js',
    ],
    coverageThreshold: {
        global: {
            lines: 42,
            branches: 31,
            functions: 31,
            statements: 40,
        },
    },
    testTimeout: 15000,           // Increased timeout
    maxWorkers: 1,                // Run tests serially to prevent race conditions
    testEnvironmentOptions: {
        url: 'http://localhost',
    },
};
