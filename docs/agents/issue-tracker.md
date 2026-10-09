# Issue tracker: GitHub

Issues and specifications for this repository live in GitHub Issues for `grarizki/stocksX`. Use the `gh` CLI with `--repo grarizki/stocksX` when needed.

## Conventions

- Create specifications with `gh issue create --title "..." --body-file <spec-file> --label ready-for-agent`.
- Read an issue with `gh issue view <number> --comments`.
- List issues with `gh issue list --state open --json number,title,body,labels`.
- Comment with `gh issue comment <number> --body-file <comment-file>`.
- Apply labels with `gh issue edit <number> --add-label <label>`.
- Close completed work with `gh issue close <number> --comment "..."`.
- Publishing to the issue tracker means creating a GitHub issue, not committing a local PRD.

## Pull requests as a triage surface

**PRs as a request surface: no.** Pull requests are implementation changes, not feature requests in the triage queue.
