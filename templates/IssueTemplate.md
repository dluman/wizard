---
name: Wizard
about: Template for Wizard reports
title: ''
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
- [{{#status}}x{{/status}}] {{.}}
{{/description}}
{{/specifications}}
{{/category}}

{{/checks}}

## Percent complete

Based on the checks achieved, this assignment is {{pct}}% complete.
