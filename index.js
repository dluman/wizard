const github = require('@actions/github');
const core = require('@actions/core');

const fs = require('fs');
const path = require('path');
const util = require('util');
const yaml = require('js-yaml');
const home = require('os').homedir();

const Mustache = require('mustache');

const octokit = github.getOctokit(
  process.env.GITHUB_TOKEN
);

const loadFile = (filename) => util.promisify(fs.readFile)(filename, 'utf8');

const loadAndRenderTemplate = async (checks) => {
  let template = await loadFile("templates/IssueTemplate.md");
  let rendered = Mustache.render(template, {"checks":checks});
  return rendered;
}

const loadGrader = async (checks) => {
  let definitions = await loadFile(".gatorgrade.yml");
  let data = yaml.load(definitions);
  return data;
}

async function postIssue(checks) {
  // Template will come fully-formed
}

const cleanLines = (lines) => {
  // Remove blanks
  lines = lines.filter(line => line);
  // Trim whitespace
  lines = lines.map(line => line.trim());
  // Remove duplicates
  return [...new Set(lines)];
}

const assignCategory = (obj) => {
  let check;
  Object.keys(obj).some((key) => {
    if(key == "category") {
      check = {
        "description": obj.description,
        "category": obj.category,
        "status": false
      }
      return true;
    }
    if(typeof obj[key] === "object"){
      check = assignCategory(obj[key]);
      return check !== undefined;
    }
  });
  return check;
}

const getChecks = (result, grader) => {
  let checks = [];
  for(let spec of grader) {
    let check = assignCategory(spec);
    checks.push(check);
  }
  Object.values(checks).some((check) => {
    if(result.passed.includes(check.description))
      check.status = true;
  });
  return checks;
}

const getResult = (lines) => {
  // Separate checks from irrelevant lines
  let checkSymbols = ["✔","✘"]//,"➔","→"];
  let regexp = new RegExp(`(${checkSymbols.join("|")})`,"g");
  lines = lines.filter(line => !line.search(regexp));
  // Sort checks into object
  let checks = {
    "passed": [],
    "failed": []
  };
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
  // Get repository constants
  const repo = github.context.payload.repository.name;
  // Acquire checks from cached file
  let report = await loadFile(`${home}/work/${repo}/${repo}/report`);
  let lines = cleanLines(
      report.split("\n")
  );
  // Separate parsed checks and grader file
  let result = getResult(lines);
  let grader = await loadGrader(result);
  // Add categories from grader file
  let checks = getChecks(result, grader);
  // Get and render template
  let rendered = await loadAndRenderTemplate(checks);
  console.log(rendered);
  // Post issue
  postIssue(checks);
};

run();