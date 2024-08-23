/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 202:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 522:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 729:
/***/ ((module) => {

module.exports = eval("require")("async");


/***/ }),

/***/ 447:
/***/ ((module) => {

module.exports = eval("require")("js-yaml");


/***/ }),

/***/ 699:
/***/ ((module) => {

module.exports = eval("require")("mustache");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 837:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

const core = __nccwpck_require__(202);
const github = __nccwpck_require__(522);

const fs = __nccwpck_require__(147);
const path = __nccwpck_require__(17);
const util = __nccwpck_require__(837);
const async = __nccwpck_require__(729);
const yaml = __nccwpck_require__(447);

const Mustache = __nccwpck_require__(699);

const octokit = github.getOctokit(
  process.env.GITHUB_TOKEN
);

const repo = github.context.payload.repository.name;
const owner = github.context.payload.repository.owner.login;
const loadFile = (filename) => util.promisify(fs.readFile)(filename, 'utf8');

// TODO: Implment orgBy (future release)
const orgBy = core.getInput('organizing-key');
const reportFile = core.getInput('grader-report');
const issueName = core.getInput('report-name');

async function postIssue(checks) {
  let teams = await getRepoTeams();
  let lastAuthor = teams.length > 0 ? teams.flat(1) : [await getLatestAuthor()];
  let isCreated = await octokit.rest.issues.create({
    owner: owner,
    repo: repo,
    title: issueName || checks.header.title,
    body: checks.rendered,
    assignees: lastAuthor
  })
}

async function updateIssue(checks, id) {
  let teams = await getRepoTeams();
  let lastAuthor = teams.length > 0 ? teams.flat(1) : [await getLatestAuthor()];
  console.log(`THIS IS LAST AUTHOR: ${lastAuthor}`);
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
    repo: repo,
    sha: process.env.GITHUB_REF_NAME
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
  let issueTitle = issueName || template.header.title;
  let issues = await octokit.rest.issues.listForRepo({
    owner: owner,
    repo: repo
  });
  for(let issue of issues.data) {
    if(issue.title == issueTitle)
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
    ([category, specifications]) => ({category, specifications})
  );
};

const run = () => {
  fs.readFile(reportFile, async (err,data) => {
    let report = JSON.parse(data);
    // Render the template
    report.checks.percentage_score = report.percentage_score;
    const template = await loadAndRenderTemplate({
      checks: groupChecks(report.checks),
      outcome: {
        todos:  true ? report.percentage_score === 100 : 0,
        pct: report.percentage_score
        },
    });

    // Discover previously-created issues
    const issue = await getGradeIssue(template);
    // Update the issue if necessary
    if (!issue) postIssue(template);
    else updateIssue(template, issue);

  });
};

//try{
  run();
//} catch {
  // Pass blissfully.
//  process.exit();
//}

})();

module.exports = __webpack_exports__;
/******/ })()
;