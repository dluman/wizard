const github = require('@actions/github');
const core = require('@actions/core');

const fs = require('fs');
const path = require('path');
const util = require('util');

//const octokit = github.getOctokit(
//    process.env.GITHUB_TOKEN
//);

const readReport = (filename) => util.promisify(fs.readFile)(filename, 'utf8');

const cleanLines = (lines) => {
  // Remove blanks
  lines = lines.filter(line => line);
  // Trim whitespace
  lines = lines.map(line => line.trim());
  // Remove duplicates
  return [...new Set(lines)];
}

const getChecks = (lines) => {
  // Separate checks from irrelevant lines
  let checkSymbols = ["✔","✘","➔","→"];
  let regexp = new RegExp(`(${checkSymbols.join("|")})`,"g");
  lines = lines.filter(line => !line.search(regexp))
  // Sort checks into object
  let checks = {
    "passed": [],
    "failed": []
  }
  for(let check of lines) {
    let status = check[0];
    if(status == "✔") checks.passed.push(check);
    else checks.failed.push(check);
  }
  return checks;
}

const run = async () => {
  let report = await readReport("report");
  let lines = cleanLines(
      report.split("\n")
  );
  console.log(getChecks(lines));
};

run();