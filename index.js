const github = require('@actions/github');
const core = require('@actions/core');

const fs = require('fs');
const path = require('path');
const util = require('util');

//const octokit = github.getOctokit(
//    process.env.GITHUB_TOKEN
//);

const read = (filename) => util.promisify(fs.readFile)(filename, 'utf8');

const run = async () => {
  let report = await read("report");
  console.log(report);
};

run();