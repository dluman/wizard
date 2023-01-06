![8-bit wizard hat and name in type in gradations of red and blue](https://github.com/ReadyResearchers/wizard/blob/media/media/wizard.png)

# Wizard

The GatorGrader-to-GitHub issue magician!

## Features

`wizard` is a complement for [GatorGrader](https://github.com/GatorEducator/gatorgrader), the automated grading system (AGS) used
and developed by the Allegheny College Department of Computer Science. Where `wizard` steps in: GatorGrader's outcome of specifications-
based grading checks appears as an issue on a student's repository with checked/unchecked checkboxes representing both achieved
and missed grader checks.

This tool helps surface _actionable_ items for students to complete in the form of an interactive checklist that mimics best practices
of using the GitHub platform to surface technical issues with open source software packages/community projects. Beginning acculturation
of students to GitHub processes benefits them in internships, future coursework and, eventually, positions as developers -- regardless
of version control platform or workflow.

Of course, it helps that GitHub is pretty ubiquitous. That written, this project helps to build a transferrable skill that allows students
to be more ready contributors to their education in computer science.

## Installation requirements

### Software dependencies

* `aiohttp`
* `gidgethub`
* `mustache`

### Hardware dependencies

This program requires a high-uptime/availability server to respond to webhook requests from GitHub. We encourage a domain name to resolve to.
rather than just an IP address. (Because, of course, that seems like you're trying to steal someone's credit card information.)

### GitHub requirements

`wizard` requires an organization-level webhook to the URL endpoint of the application host.

## Running `wizard`

This software is compatible with a number of "daemonizing" applications, with a preference for `pm2` -- the application configuration for
this platform is included in this repository.
