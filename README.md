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

This project aims to help build a transferrable skill that allows students to be more ready contributors to their education in computer 
science.

## Using `wizard`

To integrate `wizard` into your GitHub Actions workflow, complete a few steps:

1. Create a GitHub Issue Template; we suggest you use the example template in `templates/wizard.md` to get started
2. Add a `category` field to your GatorGrader checks (it can be anything you choose):

```yaml
- writing/reflection.md:
  - description: No TODO markers left in reflection.md
    category: Documentation
    check: MatchFileFragment
    options:
      fragment: "TODO"
      count: 0
      exact: true
```

3. Insert a step for `wizard` in your GitHub Actions workflow:

```yaml
- name: Create Wizard report
    id: wizard
    uses: term-world/wizard@v0.3.2
    with:
        # Substitute your GatorGrade config file here
        gatorgrade-config: '.gatorgrade.yml'
    if: always()
env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The above example uses the stock `GITHUB_TOKEN` to authenticate as the GitHub Actions bot account.

## Current limitations

The above suggestions are (as of this writing -- `v0.3.2`) probably _requirements_. Technically, this version
also supports custom templates located elsewhere _and_ custom sorting. However, those features are more-or-less
"pre-alpha." Once the project gets to `v1.0.0`, we anticipate many more congfigurable features.