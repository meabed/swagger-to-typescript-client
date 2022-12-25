// https://semantic-release.gitbook.io/semantic-release/usage/configuration
const pkg = require('./package.json');
const branch = process.env.BRANCH || process.env.CI_REF_NAME_SLUG || '';
// semantic-release configuration
module.exports = {
  branches: [
    {
      name: 'master',
      prerelease: false,
    },
    { name: branch, prerelease: true },
  ],
  plugins: [
    ['@semantic-release/commit-analyzer',],
    ['@semantic-release/release-notes-generator'],
    // https://github.com/semantic-release/npm
    ['@semantic-release/npm'],
    // https://github.com/semantic-release/git
    ['@semantic-release/git', {
      assets: [
        'package.json',
        'package-lock.json',
        'yarn.lock',
        'npm-shrinkwrap.json',
        'CHANGELOG.md',
      ],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      GIT_AUTHOR_NAME: pkg.author.name,
      GIT_AUTHOR_EMAIL: pkg.author.email,
      GIT_COMMITTER_NAME: pkg.author.name,
      GIT_COMMITTER_EMAIL: pkg.author.email,
    }],
  ],
};
