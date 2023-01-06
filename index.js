const github = require('@actions/github');
const core = require('@actions/core');

const fs = require('fs');
const path = require('path');
const util = require('util');
const yaml = require('js-yaml');

const mustache = require('mustache');

//const octokit = github.getOctokit(
//    process.env.GITHUB_TOKEN
//);

const loadFile = (filename) => util.promisify(fs.readFile)(filename, 'utf8');

async function postIssue(checks) {
  loadTemplate();
}

const loadTemplate = async () => {
  let template = await loadFile("templates/IssueTemplate.md");
}

// TODO: Definte recursive read to descend into each descriptor
//       and find the gold?

const getCategories = async (checks) => {
  let definitions = await loadFile(".gatorgrade.yml");
  let data = yaml.load(definitions);
  // TODO: Load relevant categories from the YAML file based on
  //       in-text check names
}

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
  let checkSymbols = ["✔","✘"]//,"➔","→"];
  let regexp = new RegExp(`(${checkSymbols.join("|")})`,"g");
  lines = lines.filter(line => !line.search(regexp))
  // Sort checks into object
  let checks = {
    "passed": [],
    "failed": []
  }
  for(let check of lines) {
    // Get success or failure
    let status = check[0];
    // Retrieve the body of the check
    let body = check.substring(1).trim();
    if(status == "✔") checks.passed.push(body);
    // TODO: Really, combine failures into a "check" and annotation
    //       (see above regex commented out)
    else checks.failed.push(body);
  }
  return checks;
}

const run = async () => {
  // Acquire checks from cached file
  let report = await loadFile("report");
  let lines = cleanLines(
      report.split("\n")
  );
  let checks = getChecks(lines);
  checks = await getCategories(checks);
  // Post issue
  postIssue(checks);
};

run();