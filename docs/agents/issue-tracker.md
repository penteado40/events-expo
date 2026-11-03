# Issue tracker: Jira

Issues and specs for this repo live in Jira, accessed through the Atlassian MCP tools (`mcp__claude_ai_Atlassian_Rovo__*`).

- Site: `flpenteado.atlassian.net` (cloudId `dc9e2094-bd99-405e-b917-b16c985f8ef3`)
- Project: `PROJ`
- Epic: `PROJ-84` "Events-App"; every story for this app is a child of it and carries the label `events-expo`, plus `v2` for the current version (older stories carry `v1`)
- Canonical spec: `docs/spec.md` in this repo (the V2 PRD). The PROJ-210 description is a snapshot; edit the file, not it.
- Design: the canvas [events-expo · Design D](https://claude.ai/artifact/XBggR1iFpMS3Ht8x7Hw8k6), read with the Artifact tool.

GitHub Issues of `penteado40/events-expo` (#1–#9) are the original source the Jira stories were migrated from. They are a read-only archive: don't create or update issues there.

## Conventions

- **Read an issue**: `getJiraIssue` with `issueIdOrKey: "PROJ-85"`, `responseContentFormat: "markdown"`, fields including `comment`.
- **List the epic's stories**: `searchJiraIssuesUsingJql` with `jql: "parent = PROJ-84 ORDER BY key ASC"`.
- **Create an issue**: `createJiraIssue` in project `PROJ`, type `História` (story) or `Tarefa`, parent `PROJ-84`, labels `events-expo`, `v2`.
- **Comment**: `addCommentToJiraIssue`.
- **Change status**: `getTransitionsForJiraIssue`, then `transitionJiraIssue`.
- **Edit**: `editJiraIssue`.

Put the Jira key in commit messages (e.g. `feat: walking skeleton (PROJ-85)`).

## When a skill says "publish to the issue tracker"

Create a Jira issue under epic `PROJ-84`.

## When a skill says "fetch the relevant ticket"

Read it with `getJiraIssue`.
