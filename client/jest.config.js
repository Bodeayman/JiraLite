export default {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(uuid)/)',
    ],
    testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/main.jsx',
        '!src/vite-env.d.ts',
        '!src/scripts/**',
        '!src/services/api.js'
    ],
    coverageThreshold: {
        global: {
            lines: 80,
            branches: 70,
            functions: 80,
            statements: 80,
        },
    },
};
