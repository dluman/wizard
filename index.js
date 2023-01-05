const github = require('@actions/github');
const core = require('@actions/core');

const octokit = github.getOctokit(
    process.env.GITHUB_TOKEN
  );  

const run = () => {
    let grader = core.getInput('grader-result');
    console.log(grader);
};

run();