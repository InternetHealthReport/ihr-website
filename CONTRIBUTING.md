# Contributing to Internet Health Report

First off, thanks for taking the time to contribute! 🎉🎉

When contributing to this repository, please first discuss the change you wish to make via issue with the maintainers of this repository before making a change. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [IHR Code of Conduct](CODE_OF_CONDUCT.md), please follow it in all your interaction with the project. By participating, you are expected to uphold this code. Please report unacceptable behavior to [admin@ihr.live](mailto:admin@ihr.live)

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a
   build. Add only relevant files to commit and ignore the rest to keep the repo clean.
2. Update the [README.md](README.md) with details of changes to the interface, this includes new environment
   variables, exposed ports, useful file locations and container parameters.
3. You should request review from the maintainers once you submit the Pull Request.

## Instructions

- Git Workflow

```bash
## Step 1: Fork Repository

## Step 2: Git Set Up & Download
# Clone the repo
$ git clone git@github.com:<User-Name>/<Repo-Name>.git
# Add upstream remote
$ git remote add upstream git@github.com:InternetHealthReport/ihr-website.git 
# Fetch and merge with upstream/dev
$ git fetch upstream
$ git merge upstream/dev

## Step 2: Create and Publish Working Branch
$ git checkout -b <type>/<issue|issue-number>/{<additional-fixes>}
$ git push origin <type>/<issue|issue-number>/{<additional-fixes>}

## Types:
# wip - Work in Progress; long term work; mainstream changes;
# feat - New Feature; future planned; non-mainstream changes;
# bug - Bug Fixes
# exp - Experimental; random experimental features;
```

- On Task Completion:

```bash
## Committing and pushing your work
# Ensure branch
$ git branch
# Fetch and merge with upstream/dev
$ git fetch upstream
$ git merge upstream/dev
# Add untracked files
$ git add .
# Commit all changes with appropriate commit message and description
$ git commit -m "your-commit-message" -m "your-commit-description"
# Fetch and merge with upstream/dev again
$ git fetch upstream
$ git merge upstream/dev
# Push changes to your forked repository
$ git push origin <type>/<issue|issue-number>/{<additional-fixes>}

## Creating the PR using GitHub Website
# Create Pull Request from <type>/<issue|issue-number>/{<additional-fixes>} branch in your forked repository to the dev branch in the upstream repository
# After creating PR, add a Reviewer (Any Admin) and yourself as the assignee
# Link Pull Request to appropriate Issue, or Project+Milestone (if no issue created)
# IMPORTANT: Do Not Merge the PR unless specifically asked to by an admin.
```

- After PR Merge

```bash
# Delete branch from forked repo
$ git branch -d <type>/<issue|issue-number>/{<additional-fixes>}
$ git push --delete origin <type>/<issue|issue-number>/{<additional-fixes>}
# Fetch and merge with upstream/dev
$ git checkout dev
$ git pull upstream
$ git push origin
```

- Always follow [commit message standards](https://chris.beams.io/posts/git-commit/)
- About the [fork-and-branch workflow](https://blog.scottlowe.org/2015/01/27/using-fork-branch-git-workflow/)

## Libraries Overview

Our website uses the following libraries:

- [@intlify/unplugin-vue-i18n](https://www.npmjs.com/package/@intlify/unplugin-vue-i18n): This is a plugin for Vue.js that helps with internationalization (i18n)
- [@quasar/extras](https://www.npmjs.com/package/@quasar/extras): This includes icons, fonts, and other assets that enhance the UI
- [axios](https://www.npmjs.com/package/axios): This is a library used to make HTTP requests
- [dagre](https://www.npmjs.com/package/dagre): This is a library for laying out directed graphs
- [grid-layout-plus](https://www.npmjs.com/package/grid-layout-plus): This is an extension of grid layout systems, allowing for more flexible and responsive grid designs in web applications
- [ip-address](https://www.npmjs.com/package/ip-address): This provides utilities for working with IP addresses
- [plotly.js-dist](https://www.npmjs.com/package/plotly.js-dist): This is a library for creating interactive charts and visualizations
- [quasar](https://www.npmjs.com/package/quasar): It provides a rich set of UI components and tools
- [swagger-ui](https://www.npmjs.com/package/swagger-ui): It generates interactive API documentation from OpenAPI specifications, making it easier for developers to understand and test API endpoints
- [v-network-graph](https://www.npmjs.com/package/v-network-graph): This is used for creating network graphs in Vue.js applications
- [vue](https://www.npmjs.com/package/vue): This is a progressive JavaScript framework for building user interfaces
- [vue-i18n](https://www.npmjs.com/package/vue-i18n): This is an internationalization plugin for Vue.js
- [vue-router](https://www.npmjs.com/package/vue-router): Vue Router is the official routing library for Vue.js

## Component Descriptions


## Code Style


## Testing