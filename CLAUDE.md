# Working on this site

`main` is the single source of truth: it should always hold the most recent version of the site.

## Before making any change

Each session starts on a fresh `claude/...` branch cut from `main`. Work from an earlier session that was
never merged is invisible from there, so check first:

```sh
git fetch origin
git branch -r --no-merged origin/main
```

If any `origin/claude/*` branch is listed, it holds unmerged work. Merge it into your branch before
editing (`git merge origin/<branch>`), keep its edits when resolving conflicts, and tell the user which
branch it was. Never start from `main` while unmerged work exists.

## When finishing a session

Tell the user that the changes are on a branch and are not on `main` until it is merged, and offer to open
a pull request so they can merge it. Unmerged branches are how edits went missing on 2026-09-25.

## Previews

The private preview artifact is https://claude.ai/artifact/GRRugeAmFaGTzek64rVb9q. Republish it from the
latest merged code rather than creating a new one. Page links like `community/` need rewriting to
`community/index.html` in the preview copy only; the repo files keep the directory-style links.
