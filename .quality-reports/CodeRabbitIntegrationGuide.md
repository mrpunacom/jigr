# CodeRabbit Integration Guide - JiGR Platform

## 🎯 Overview

This document explains the three-layer code quality system for the JiGR Hospitality Compliance Platform:

1. **CodeRabbit** - Automated review on GitHub PRs
2. **Claude (Chat)** - Strategic architecture review  
3. **Claude Code** - Implementation and fixes

---

## 🚀 Quick Start for Claude Code

### Fetch Latest CodeRabbit Feedback:
```bash
./scripts/SyncCodeRabbitFeedback.sh
```

### Review Feedback:
```bash
# Human-readable summary
cat .quality-reports/CodeRabbitSummary.md

# Full JSON data
cat .quality-reports/CodeRabbitLatestFeedback.json
```

### Act on Feedback:
Claude Code should read these files and address issues automatically when in AUTO-ACCEPT mode.

---

## 📋 Complete Workflow

### 1. Developer Makes Changes
```bash
git checkout -b feature/NewFeature
# Make changes
git commit -m "feat: Add new feature"
git push origin feature/NewFeature
```

### 2. Create Pull Request
```bash
gh pr create --title "Add new feature" --body "Description here"
```

### 3. CodeRabbit Reviews (Automatic)
- CodeRabbit automatically reviews the PR on GitHub
- Comments on code quality, security, best practices
- Suggests improvements

### 4. Sync Feedback Locally
```bash
./scripts/SyncCodeRabbitFeedback.sh
```

### 5. Claude Code Reads and Fixes
```bash
# Claude Code command
claude --project hospitality-compliance

# Then in Claude Code:
"Read .quality-reports/CodeRabbitSummary.md and fix all issues"
```

### 6. Claude (Chat) Strategic Review
Developer shares code with Claude Chat for:
- Architecture validation
- Business logic review
- Security pattern assessment
- Compliance with JiGR standards

---

## 🔧 Available Scripts

### Main Scripts:

**SyncCodeRabbitFeedback.sh**
```bash
./scripts/SyncCodeRabbitFeedback.sh
```
Fetches all open PRs with CodeRabbit feedback and creates local reports.

**CheckCodeRabbitFeedback.sh**  
```bash
./scripts/CheckCodeRabbitFeedback.sh
```
Quick check of latest PR feedback.

**CheckCodeRabbitPR.sh**
```bash
./scripts/CheckCodeRabbitPR.sh <PR_NUMBER>
```
Check specific PR feedback.

---

## 📊 Report Files

### CodeRabbitLatestFeedback.json
Complete JSON data with all PR information:
- PR numbers and titles
- Review states
- Comments
- Authors
- Timestamps

### CodeRabbitSummary.md
Human-readable markdown summary:
- List of open PRs
- Review status
- Key comments
- Action items

---

## 🎯 Integration with Claude Code

### Automated Workflow:

Claude Code should check for feedback on startup:
```bash
# Automatically run when Claude Code starts
./scripts/SyncCodeRabbitFeedback.sh

# Then read feedback
cat .quality-reports/CodeRabbitSummary.md
```

### Auto-Fix Pattern:

When Claude Code sees CodeRabbit feedback, it should:

1. **Read the feedback**
2. **Categorize issues** (critical/major/minor)
3. **Fix critical issues immediately**
4. **Ask approval for major changes**
5. **Queue minor issues for batch fixing**

---

## 🔒 Security & Best Practices

### GitHub CLI Authentication:
```bash
# First time setup
gh auth login

# Verify authentication
gh auth status
```

### Required Permissions:
- Read access to PRs
- Read access to PR reviews
- Read access to PR comments

### Rate Limits:
GitHub API has rate limits. The sync script handles this gracefully by:
- Using authenticated requests (higher limits)
- Caching results locally
- Providing clear error messages

---

## 💡 Pro Tips

### Daily Workflow:
1. Start of day: Run `SyncCodeRabbitFeedback.sh`
2. Review summary with coffee ☕
3. Let Claude Code fix routine issues
4. Focus on strategic work

### Before Major Changes:
1. Sync latest feedback
2. Review with Claude Chat for strategy
3. Let Claude Code implement
4. Create PR for CodeRabbit review
5. Iterate

### CI/CD Integration:
```yaml
# .github/workflows/quality-check.yml
name: Quality Sync
on: [pull_request_review]
jobs:
  sync-feedback:
    runs-on: ubuntu-latest
    steps:
      - name: Sync CodeRabbit Feedback
        run: ./scripts/SyncCodeRabbitFeedback.sh
      - name: Commit Reports
        run: |
          git add .quality-reports/
          git commit -m "chore: Update quality reports"
          git push
```

---

## 🐛 Troubleshooting

### "gh command not found"
```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login
```

### "No open PRs found"
This is normal if you don't have any open PRs. The script will create an empty report.

### Python parsing failed
The summary generation fallback works fine. To fix Python parsing:
```bash
# Ensure Python 3 is available
python3 --version
```

### Reports are empty
Check GitHub CLI authentication:
```bash
gh auth status
gh pr list  # Test if you can see PRs
```

---

## 📈 Metrics & Tracking

Track your code quality improvement over time:

```bash
# Count open PRs over time
grep "PR #" .quality-reports/CodeRabbitSummary.md | wc -l

# Track review states
grep -i "approved\|changes_requested" .quality-reports/CodeRabbitLatestFeedback.json
```

---

## 🎓 Best Practices

### For Developers:
- Run sync script before starting work
- Address CodeRabbit feedback promptly
- Use Claude Code for routine fixes
- Consult Claude Chat for strategic decisions

### For Claude Code:
- Read feedback files on session start
- Prioritize critical security issues
- Ask approval for architecture changes
- Update reports after fixes

### For Claude Chat:
- Review architecture decisions
- Validate business logic
- Assess security patterns
- Guide strategic direction

---

## 📞 Support

### Issues with Integration:
1. Check GitHub CLI authentication
2. Verify script permissions (`chmod +x scripts/*.sh`)
3. Review error messages in sync output
4. Consult this guide

### Enhancement Requests:
Add new features to the integration by updating scripts in `/scripts/` directory.

---

**Last Updated:** 2025-01-14  
**Maintained by:** JiGR Development Team  
**Version:** 1.0
