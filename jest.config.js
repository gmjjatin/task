// Babel is configured here, not in a babel.config.js: a Babel config file in the project root would make
// Next.js drop its faster SWC compiler.
module.exports = {
  rootDir: __dirname,
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/tests/**/*.test.js'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  transform: {
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
          [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
        ],
      },
    ],
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/src/tests/helpers/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 15000,
};
