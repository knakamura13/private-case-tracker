---
auto_execution_mode: 3
description: Ship changes on a PR
---
1. Check current branch:
   - If on `main`: Create a new feature branch from `origin/main`
   - If on a feature/bugfix branch, and the branch appears to be related to the uncommitted changes: Use the current branch

2. Branch creation (only if on main):
   - Create a branch from the latest version of `origin/main`
   - Name the branch descriptively based on the changes being made. Do not ask the user to provide or approve the branch name.
   - Switch to the new branch

3. Commit all changes:
   - If on main: Commit changes to the new branch
   - If on existing branch: Commit changes to the current branch
   - Group multiple isolated changes into logical commits where possible

4. Push the branch to the remote repository:
   - If on main: Push the new feature branch
   - If on existing branch: Push the current branch with updates

5. Pull request handling:
   - If on main: Create a new pull request from the feature branch to main
   - If on existing branch: Create or update the pull request from the current branch to main