const core = require('@actions/core');
const github = require('@actions/github');

const fs = require('fs');
const path = require('path');
const util = require('util');
const async = require('async');
const yaml = require('js-yaml');

const Mustache = require('mustache');

const octokit = github.getOctokit(
  process.env.GITHUB_TOKEN
);

const repo = github.context.payload.repository.name;
const owner = github.context.payload.repository.owner.login;

// Issue with orgBy here -- trouble making this principle dynamic?
const orgBy = core.getInput('organizing-key');
const reportFile = core.getInput('grader-report');

async function postIssue(checks) {
  let teams = await getRepoTeams();
  let lastAuthor = teams.length > 0 ? teams.flat(1) : [await getLatestAuthor()];
  let isCreated = await octokit.rest.issues.create({
    owner: owner,
    repo: repo,
    title: checks.header.title,
    //labels: [checks.header.labels],
    body: checks.rendered,
    assignees: lastAuthor,
    login: 'gradewizard'
  })
}

async function updateIssue(checks, id) {    
  let teams = await getRepoTeams();
  let lastAuthor = teams.length > 0 ? teams.flat(1) : [await getLatestAuthor()];

  let response = await octokit.rest.issues.update({
    owner: owner,
    repo: repo,
    issue_number: id,
    body: checks.rendered,
    assignees: lastAuthor
  });
}


const getLatestAuthor = async () => {
  let info = await octokit.rest.repos.listCommits({
    owner: owner,
    repo: repo
  });
  return info.data[0].author.login;
};

const getRepoTeams = async() => {
  let slugs = [];
  let list = await octokit.rest.repos.listTeams({
    owner: owner,
    repo: repo
  });
  let teams = list.data;
  async.map(teams, (value, fn) => {
    fn(null, value.slug);
  }, (err, res) => {
    for(let item in res){
      slugs.push(res[item]);
    }
  });
  return await getTeamMembers(slugs);
};

const getTeamMembers = async(teams) => {
  if(!teams) return undefined;
  let logins = [];
  for(let team of teams) {
    let members = await octokit.rest.teams.listMembersInOrg({
      org: owner,
      team_slug: team
    });
    let users = members.data.map((member) => {
      return member.login;
    });
    logins.push(users.flat(1))
  }
  return logins;
};

const getTemplateHeader = (content) => {
  let header = /(?!---)[a-zA-Z:'\s]+(?!---)/.exec(content);
  let parsed = yaml.load(header);
  return parsed;
}

const loadAndRenderTemplate = async (checks) => {
  let template = await loadFile(
    `${process.cwd()}/${core.getInput('issue-template')}`
  );
  // Remove the header from the issue template; it's JANK!
  let header = getTemplateHeader(template);
  let body = template.replace(
    /---[a-zA-Z:'\s]+---/,''
  ).trim()
  let rendered = Mustache.render(body, checks);
  return {
    header: header,
    rendered: rendered
  }
}

const getGradeIssue = async (template) => {
  let issues = await octokit.rest.issues.listForRepo({
    owner: owner,
    repo: repo
  });
  for(let issue of issues.data) {
    if(issue.title == template.header.title)
      return issue.number;
  }
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
    ([category, specifications]) => ({
      category, 
      specifications: specifications.map(spec => ({
        ...spec,
        diagnostic: spec.diagnostic // Add diagnostic field here
      }))
    })
  );
};

const run = () => {
  fs.readFile(reportFile, async (err,data) => {
    let report = JSON.parse(data);

    // Render the template
    const template = await loadAndRenderTemplate({
      checks: groupChecks(report.checks),
      outcome: {
        todos: true ? report.percentage_score === 100 : false,
      },
    });

    // Discover previously-created issues
    const issue = await getGradeIssue(template);

    // Update the issue if necessary
    if (!issue) postIssue(template);
    else updateIssue(template, issue);
    
  });
};

run();