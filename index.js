const github = require('@actions/github');
const core = require('@actions/core');

const fs = require('fs');
const path = require('path');
const util = require('util');
const yaml = require('js-yaml');

const Mustache = require('mustache');

const octokit = github.getOctokit(
 process.env.GITHUB_TOKEN
);

const repo = github.context.payload.repository.name;
const owner = github.context.payload.repository.owner.login;

const exec = util.promisify(require('child_process').exec);
const loadFile = (filename) => util.promisify(fs.readFile)(filename, 'utf8');

const getTemplateHeader = (content) => {
  let header = /---[a-zA-Z:'\s]+---/.exec(templ);
  return header;
}

const loadAndRenderTemplate = async (checks) => {
  let template = await loadFile(
    `${process.cwd()}/.github/ISSUE_TEMPLATE/wizard.md`
  );
  // Remove the header from the issue template; it's JANK!
  let body = template.replace(
    /---[a-zA-Z:'\s]+---/,''
  ).trim()
  let rendered = Mustache.render(body, checks);
  return rendered;
}

const loadGrader = async (checks) => {
  let definitions = await loadFile(
    `${process.cwd()}/.gatorgrade.yml`
  );
  let data = yaml.load(definitions);
  return data;
}

async function postIssue(checks) {
  let isCreated = await octokit.rest.issues.create({
    owner: owner,
    repo: repo,
    title: "Assignment Progress",
    body: checks
  })
  console.log(isCreated);
}

const getGradeIssue = async () => {
  let issues = await octokit.rest.issues.listForRepo({
    owner: owner,
    repo: repo
  });
  return issues.data;
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
        "category": obj.category,
        "description": obj.description,
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

const groupChecks = (checks) => {
  return Array.from(
    checks.reduce((prev, next) => {
      prev.set(
        next.category,
        (prev.get(next.category) || []).concat(next)
      )
      return prev
    }, new Map).entries(),
    ([category, specifications]) => ({category, specifications})
  )
}

const getResult = (lines) => {
  // Separate checks from irrelevant lines
  let checkSymbols = ["✔","✘","✓","✕"]; //,"➔","→"];
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
    if(status == "✔" || status == "✓") checks.passed.push(body);
    // TODO: Really, combine failures into a "check" and annotation
    //       (see above regex commented out)
    else checks.failed.push(body);
  }
  return checks;
}

const run = async () => {
  // Acquire checks from running process
  let {stdout, stderr} = await exec(
    "gatorgrade --config .gatorgrade.yml"
  );
  let report = stdout;
  let lines = cleanLines(
      report.split("\n")
  );
  // Separate parsed checks and grader file
  let result = getResult(lines);
  let grader = await loadGrader(result);
  // Add categories from grader file
  let checks = getChecks(result, grader);
  let grouped = groupChecks(checks);
  // Get and render template
  let rendered = await loadAndRenderTemplate(
    {checks: grouped}
  );
  // Post issue
  let issue = await getGradeIssue();
  // FINISH HIM
  postIssue(rendered);
};

run();