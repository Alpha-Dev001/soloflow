/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  // Support the existing `@/*` path alias used by the backend tsconfig.
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  transformIgnorePatterns: ['/node_modules/(?!@nestjs)'],
  collectCoverageFrom: ['**/*.(service|interceptor|guard).ts'],
};