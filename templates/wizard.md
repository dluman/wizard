---
name: Wizard
about: Template for Wizard reports
title: Assignment Progress
labels: bug
assignees: ''

---

# `TODO`s

{{#outcome}}
{{#todos}}
The latest run of the GatorGrader on this assignment shows you've finished all the tasks!
{{/todos}}
{{^todos}}
Based on the GatorGrader report for this run, here's a summary of what you've got left to do.
{{/todos}}
{{/outcome}}

{{#checks}}
{{#category}}
## {{category}}

{{#specifications}}
{{#description}}
- [{{#status}}x{{/status}}{{^status}} {{/status}}] {{.}}
{{/description}}
{{#diagnostic}}- {{diagnostic}} {{/diagnostic}}
{{/specifications}}
{{/category}}

{{/checks}}

## Percent complete

Based on the checks achieved, this assignment is `{{#outcome}}{{pct}}{{/outcome}}%` complete.
