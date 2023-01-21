/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 252:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 341:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 501:
/***/ ((module) => {

module.exports = eval("require")("js-yaml");


/***/ }),

/***/ 613:
/***/ ((module) => {

module.exports = eval("require")("mustache");


/***/ }),

/***/ 81:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

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
const github = __nccwpck_require__(341);
const core = __nccwpck_require__(252);

const fs = __nccwpck_require__(147);
const path = __nccwpck_require__(17);
const util = __nccwpck_require__(837);
const yaml = __nccwpck_require__(501);

const Mustache = __nccwpck_require__(613);

const octokit = github.getOctokit(
  process.env.GITHUB_TOKEN
);

const repo = github.context.payload.repository.name;
const owner = github.context.payload.repository.owner.login;
// Issue with orgBy here -- trouble making this principle dynamic?
const orgBy = core.getInput('organizing-key');

const {spawn} = __nccwpck_require__(81);
const loadFile = (filename) => util.promisify(fs.readFile)(filename, 'utf8');

async function postIssue(checks) {
  let lastAuthor = await getLatestAuthor();
  let isCreated = await octokit.rest.issues.create({
    owner: owner,
    repo: repo,
    title: checks.header.title,
    labels: [checks.header.labels],
    body: checks.rendered,
    assignees: [lastAuthor],
    login: 'gradewizard'
  })
}

async function updateIssue(checks, id) {
  let lastAuthor = await getLatestAuthor();
  let isUpdated = await octokit.rest.issues.update({
    owner: owner,
    repo: repo,
    issue_number: id,
    labels: [checks.header.labels],
    body: checks.rendered,
    assignees: [lastAuthor]
  })
}

const getLatestAuthor = async () => {
  let info = await octokit.rest.repos.listCommits({
    owner: owner,
    repo: repo
  });
  return info.data[0].author.login;
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

const loadGrader = async (checks) => {
  let definitions = await loadFile(
    `${process.cwd()}/${core.getInput('gatorgrade-config')}`
  );
  let data = yaml.load(definitions);
  return data;
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
    if(key == orgBy) {
      check = {
        [orgBy]: obj[orgBy],
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
    if(status == "✓") checks.passed.push(body);
    // TODO: Really, combine failures into a "check" and annotation
    //       (see above regex commented out)
    else checks.failed.push(body);
  }
  return checks;
}

const calcPct = (grouped) => {
  // Get count of checks; this assumes
  // that we're looking for only two categories:
  // passes and fails
  let counts = { 
    total: 0,
    achieved: 0
  };
  Object.keys(grouped).some((group) => {
    let category = grouped[group];
    let count = category.specifications.length;
    counts.total += count;
    let passed = category.specifications.filter(
      result => result.status
    );
    counts.achieved += passed.length;
  });
  return Math.trunc(
    (counts.achieved / counts.total) * 100
  );
}

const run = async () => {
  // Acquire checks from running process
  let report = [];
  const proc = spawn(
    "gatorgrade",
    ["--config",`${core.getInput('gatorgrade-config')}`]
  );
  for await (let data of proc.stdout){
    report.push(Buffer.from(data).toString());
  }
  report = cleanLines(report);
  // Separate parsed checks and grader file
  let result = getResult(report);
  let grader = await loadGrader(result);
  // Add categories from grader file
  let checks = getChecks(result, grader);
  let grouped = groupChecks(checks);
  let completion = calcPct(grouped);
  grouped.push(
    {pct: completion}
  )
  // Get and render template
  let template = await loadAndRenderTemplate(
    {
      checks: grouped,
      outcome: {
        "todos":  true ? completion == 100: 0
      }
    }
  );
  // Discover previously-created issues
  let issue = await getGradeIssue(template);
  // FINISH HIM
  if(!issue) postIssue(template)
  else updateIssue(template, issue)
};

run();

})();

module.exports = __webpack_exports__;
/******/ })()
;