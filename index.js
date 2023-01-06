const github = require('@actions/github');
const core = require('@actions/core');

const fs = require('fs');
const path = require('path');

const octokit = github.getOctokit(
    process.env.GITHUB_TOKEN
  );

const run = () => {
  let report;
  fs.readFile("report", {encoding: 'utf-8'}, (err, data) => {
    console.log(data);
  });
};

run();