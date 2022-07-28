#!/usr/bin/env node
import { printInfo } from './print-version-bump-info';
const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });

import { Octokit } from "octokit";
// const { Octokit } = require('@octokit/core');
const { createAppAuth } = require('@octokit/auth-app');

const appCredentials = require('./lib/app-credentials');

const createOctokit = () => {
  const octokit = new Octokit({
    // baseUrl: `https://${process.env.GHE_HOST}/api/v3`,
    authStrategy: createAppAuth,
    auth: appCredentials,
  });
  return octokit;
}

const createIssue = async (octokit: Octokit, body: string) => {
  try {
    // Create issue in demo-days/Spoon-Knife
    // https://docs.github.com/en/rest/reference/issues#create-an-issue
    const issue = await octokit.request('POST /repos/:owner/:repo/issues', {
      owner: 'imstar15',
      repo: 'OAK-blockchain',
      title: 'Dependencies update',
      body,
    });
    logger.trace(issue);
    process.stdout.write(`${issue.data.html_url} 🚀\n`);
  } catch (e) {
    logger.error("error:");
    logger.error(e);
    process.exit(1);
  }
}

async function main() {
  const octokit = createOctokit();
  console.log('octokit: ', octokit);
  const lines = await printInfo(octokit, 'v0.9.20', 'v0.9.23');
  await createIssue(octokit, lines);
}

main();
