# Git Pull + Merge Playbook (Divergent Branches)

Use this when `git pull` fails with divergent branches / local changes that would be overwritten, and you need a **merge** (not rebase).

## Goal

1. Pull remote into the current branch using **merge**
2. Do **not** change `git config`
3. Preserve uncommitted local work
4. Resolve conflicts carefully
5. Restore local uncommitted changes afterward

## Starting situation (example)

```text
git pull
# fatal: Need to specify how to reconcile divergent branches.

# After retry with merge:
# Your local changes would be overwritten by merge: app.json
# Please commit your changes or stash them before you merge.
```

Also common:

```text
Your branch and 'origin/main' have diverged,
and have N and M different commits each, respectively.
```

## Rules for the AI agent

- Prefer `git pull --no-rebase` (merge). Do **not** run `git config pull.rebase ...`
- Do **not** force push, hard reset, or amend unless the user explicitly asks
- Do **not** discard local uncommitted changes
- Only commit when needed to finish the merge (merge commit), or when the user asks
- After success, report status: ahead/behind remote, remaining uncommitted files, conflicts resolved

## Step-by-step procedure

### 1) Inspect state

```bash
git status
git branch -vv
```

Confirm:

- current branch (e.g. `main`)
- divergence from remote
- uncommitted local changes

### 2) Stash local work (including untracked if needed)

```bash
git stash push -u -m "temp before pull merge"
```

### 3) Pull with merge (no rebase, no config change)

```bash
git pull --no-rebase
```

If already fetched / merge in progress alternatives:

```bash
git fetch origin
git merge origin/main
```

### 4) If merge conflicts appear

1. List conflicts:

```bash
git status
git diff --name-only --diff-filter=U
```

2. Open each conflicted file and compare both sides:

```bash
git show HEAD:path/to/file
git show MERGE_HEAD:path/to/file
```

3. Resolve intentionally (do not blindly keep one side unless asked).
4. Mark resolved and finish merge:

```bash
git add <resolved-files>
git commit -m "$(cat <<'EOF'
Merge origin/main into main

Briefly explain conflict resolution choices.
EOF
)"
```

### 5) Restore stashed local changes

```bash
git stash pop
```

If stash pop conflicts:

- resolve those files
- `git add` resolved files
- leave as working-tree changes unless user asks to commit
- drop stash only after successful apply (`stash pop` does this automatically on success)

### 6) Verify final state

```bash
git status
```

Expected healthy outcome example:

- branch ahead of `origin/main` by N commits (includes merge commit)
- previous local uncommitted edits restored as unstaged changes
- no leftover merge/rebase/cherry-pick state

## Conflict resolution example used here

### File

`utils/pushNotifications.ts`

### What each side had

- **Local (HEAD):**
  - Notification tap routing helpers:
    - `NotificationPayload`
    - `handleNotificationResponse`
    - `registerNotificationListeners`
  - Expo push token via `Notifications.getExpoPushTokenAsync({ projectId })`
  - Used `expo-constants` + `expo-router`

- **Remote (origin/main):**
  - FCM token fetch (backend expects FCM):
    - iOS: `@react-native-firebase/messaging` (`registerDeviceForRemoteMessages` + `getFcmToken`)
    - Android: `Notifications.getDevicePushTokenAsync()`
  - JSDoc for FCM behavior
  - No notification tap listeners

### Correct merged result

Keep **both** capabilities:

1. Keep remote FCM token acquisition logic (matches `FCM_TOKEN_STORAGE_KEY` and backend expectations)
2. Keep local notification tap listeners/navigation
3. Keep needed imports from both sides:
   - Firebase messaging imports
   - `expo-router` for navigation
4. Drop local Expo-token-only path (`getExpoPushTokenAsync` / `Constants`) if FCM path is the intended source of truth

### Merge intent summary (for future similar conflicts)

```text
Prefer functional union when both sides add different features.
Prefer remote token strategy when it is an intentional backend/protocol fix.
Prefer local UX/navigation listeners if remote only changed token plumbing.
```

## One-liner command sequence (no conflicts)

```bash
git stash push -u -m "temp before pull merge" \
  && git pull --no-rebase \
  && git stash pop \
  && git status
```

## One-liner with conflict handling reminder

```bash
git stash push -u -m "temp before pull merge"
git pull --no-rebase
# if conflicts: resolve -> git add -> git commit (merge commit)
git stash pop
git status
```

## Abort options (only if user asks)

```bash
# abort in-progress merge
git merge --abort

# restore stash without completing merge
git stash pop
```

## What to report back to the user

- Pull/merge succeeded or failed
- Files conflicted + how resolved
- Whether stash was restored cleanly
- Whether branch is ahead of remote
- Ask before `git push`
