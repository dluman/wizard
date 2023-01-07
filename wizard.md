---
name: Wizard
about: Template for Wizard reports
title: 'Assignment Progress'
labels: bug
assignees: ''

---

# Failures

Looks like we've still got some stuff to work on.

{{#checks}}
{{#category}}
## {{category}}

{{#specifications}}
{{#description}}
- [{{#status}}x{{/status}}{{^status}} {{/status}}] {{.}}
{{/description}}
{{/specifications}}
{{/category}}

{{/checks}}

## Percent complete

Based on the checks achieved, this assignment is `{{#checks}}{{pct}}{{/checks}}%` complete.
