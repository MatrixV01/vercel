import { join } from 'path';
import fs from 'fs-extra';
import { getWriteableDirectory } from '@vercel/build-utils';
import {
  createGitMeta,
  getRepoData,
  parseRepoUrl,
} from '../../../../src/util/deploy/create-git-meta';
import { client } from '../../../mocks/client';

const fixture = (name: string) =>
  join(__dirname, '../../../fixtures/unit/create-git-meta', name);

describe('getRepoData', () => {
  it('gets repo data for no-email', async () => {
    const configPath = join(fixture('no-email'), 'git/config');
    const data = await getRepoData(configPath, client.output);
    expect(data?.provider).toEqual('github');
    expect(data?.org).toEqual('MatthewStanciu');
    expect(data?.repo).toEqual('git-test');
  });
  it('gets repo data for no-origin', async () => {
    const configPath = join(fixture('no-origin'), 'git/config');
    const data = await getRepoData(configPath, client.output);
    expect(data).toBeNull();
  });
  it('displays debug message when repo data cannot be parsed', async () => {
    const dir = await getWriteableDirectory();
    client.output.debugEnabled = true;
    const data = await getRepoData(join(dir, 'git/config'), client.output);
    expect(data).toBeNull();
    expect(
      client.outputBuffer.includes('Error while parsing repo data'),
      'Debug message was not found'
    ).toBeTruthy();
  });
});

describe('parseRepoUrl', () => {
  it('should not parse a url that does not match the regex', () => {
    const parsedUrl = parseRepoUrl('https://examplecom/foo');
    expect(parsedUrl, 'parsedRepoUrl()').toBeNull();
  });
  it('should parse github https url', () => {
    const parsedUrl = parseRepoUrl('https://github.com/vercel/vercel.git');
    expect(parsedUrl, 'parseRepoUrl()').toBeDefined();
    expect(parsedUrl?.provider).toEqual('github');
    expect(parsedUrl?.org).toEqual('vercel');
    expect(parsedUrl?.repo).toEqual('vercel');
  });
  it('should parse github https url without the .git suffix', () => {
    const parsedUrl = parseRepoUrl('https://github.com/vercel/vercel');
    expect(parsedUrl, 'parseRepoUrl()').toBeDefined();
    expect(parsedUrl?.provider).toEqual('github');
    expect(parsedUrl?.org).toEqual('vercel');
    expect(parsedUrl?.repo).toEqual('vercel');
  });
  it('should parse github git url', () => {
    const parsedUrl = parseRepoUrl('git://github.com/vercel/vercel.git');
    expect(parsedUrl, 'parseRepoUrl()').toBeDefined();
    expect(parsedUrl?.provider).toEqual('github');
    expect(parsedUrl?.org).toEqual('vercel');
    expect(parsedUrl?.repo).toEqual('vercel');
  });
  it('should parse github ssh url', () => {
    const parsedUrl = parseRepoUrl('git@github.com:vercel/vercel.git');
    expect(parsedUrl, 'parseRepoUrl()').toBeDefined();
    expect(parsedUrl?.provider).toEqual('github');
    expect(parsedUrl?.org).toEqual('vercel');
    expect(parsedUrl?.repo).toEqual('vercel');
  });

  it('should parse gitlab https url', () => {
    const parsedUrl = parseRepoUrl(
      'https://gitlab.com/gitlab-examples/knative-kotlin-app.git'
    );
    expect(parsedUrl, 'parseRepoUrl()').toBeDefined();
    expect(parsedUrl?.provider).toEqual('gitlab');
    expect(parsedUrl?.org).toEqual('gitlab-examples');
    expect(parsedUrl?.repo).toEqual('knative-kotlin-app');
  });
  it('should parse gitlab ssh url', () => {
    const parsedUrl = parseRepoUrl(
      'git@gitlab.com:gitlab-examples/knative-kotlin-app.git'
    );
    expect(parsedUrl, 'parseRepoUrl()').toBeDefined();
    expect(parsedUrl?.provider).toEqual('gitlab');
    expect(parsedUrl?.org).toEqual('gitlab-examples');
    expect(parsedUrl?.repo).toEqual('knative-kotlin-app');
  });

  it('should parse bitbucket https url', () => {
    const parsedUrl = parseRepoUrl(
      'https://bitbucket.org/atlassianlabs/maven-project-example.git'
    );
    expect(parsedUrl, 'parseRepoUrl()').toBeDefined();
    expect(parsedUrl?.provider).toEqual('bitbucket');
    expect(parsedUrl?.org).toEqual('atlassianlabs');
    expect(parsedUrl?.repo).toEqual('maven-project-example');
  });
  it('should parse bitbucket ssh url', () => {
    const parsedUrl = parseRepoUrl(
      'git@bitbucket.org:atlassianlabs/maven-project-example.git'
    );
    expect(parsedUrl, 'parseRepoUrl()').toBeDefined();
    expect(parsedUrl?.provider).toEqual('bitbucket');
    expect(parsedUrl?.org).toEqual('atlassianlabs');
    expect(parsedUrl?.repo).toEqual('maven-project-example');
  });
});

describe('createGitMeta', () => {
  it('gets git metata from test-github', async () => {
    const directory = fixture('test-github');
    try {
      await fs.rename(join(directory, 'git'), join(directory, '.git'));
      const data = await createGitMeta(directory, client.output);
      if (!('githubCommitMessage' in data)) {
        throw new Error('Not GitHub meta');
      }
      expect(data.githubDeployment).toEqual('1');
      expect(data.githubOrg).toEqual('user');
      expect(data.githubRepo).toEqual('repo');
      expect(data.githubCommitAuthorName).toEqual('Matthew Stanciu');
      expect(data.githubCommitMessage).toEqual('hi');
      expect(data.githubCommitOrg).toEqual('user');
      expect(data.githubCommitRef).toEqual('master');
      expect(data.githubCommitRepo).toEqual('repo');
      expect(data.githubCommitSha).toEqual(
        '0499dbfa2f58cd8b3b3ce5b2c02a24200862ac97'
      );
    } finally {
      await fs.rename(join(directory, '.git'), join(directory, 'git'));
    }
  });
  it('gets git metadata from test-gitlab', async () => {
    const directory = fixture('test-gitlab');
    try {
      await fs.rename(join(directory, 'git'), join(directory, '.git'));
      const data = await createGitMeta(directory, client.output);
      if (!('gitlabCommitMessage' in data)) {
        throw new Error('Not Gitlab meta');
      }
      expect(data.gitlabDeployment).toEqual('1');
      expect(data.gitlabProjectPath).toEqual('user/repo');
      expect(data.gitlabCommitAuthorName).toEqual('Matthew Stanciu');
      expect(data.gitlabCommitMessage).toEqual('hi');
      expect(data.gitlabCommitRef).toEqual('master');
      expect(data.gitlabCommitSha).toEqual(
        '328fa04e4363b462ad96a7180d67d2785bace650'
      );
    } finally {
      await fs.rename(join(directory, '.git'), join(directory, 'git'));
    }
  });
  it('gets git metadata from test-bitbucket', async () => {
    const directory = fixture('test-bitbucket');
    try {
      await fs.rename(join(directory, 'git'), join(directory, '.git'));
      const data = await createGitMeta(directory, client.output);
      if (!('bitbucketCommitMessage' in data)) {
        throw new Error('Not Bitbucket meta');
      }
      expect(data.bitbucketDeployment).toEqual('1');
      expect(data.bitbucketRepoOwner).toEqual('user');
      expect(data.bitbucketRepoSlug).toEqual('repo');
      expect(data.bitbucketCommitAuthorName).toEqual('Matthew Stanciu');
      expect(data.bitbucketCommitMessage).toEqual('hi');
      expect(data.bitbucketCommitRef).toEqual('master');
      expect(data.bitbucketCommitSha).toEqual(
        '3d883ccee5de4222ef5f40bde283a57b533b1256'
      );
    } finally {
      await fs.rename(join(directory, '.git'), join(directory, 'git'));
    }
  });
});