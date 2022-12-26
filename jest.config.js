module.exports = {
  preset: 'ts-jest',
  testRegex: '.*.test.ts$',
  testPathIgnorePatterns: ['<rootDir>/__tests__/__mocks__/', '<rootDir>/node_modules/', '<rootDir>/prod_node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  collectCoverage: false,
  coverageReporters: ['json', 'html'],
  modulePathIgnorePatterns: ['<rootDir>/node_modules'],
};
