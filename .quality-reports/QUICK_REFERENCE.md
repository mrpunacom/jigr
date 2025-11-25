# CodeRabbit Integration - Quick Reference

## 🚀 Quick Commands

### Sync All Open PRs
```bash
./scripts/SyncCodeRabbitFeedback.sh
```

### Check Specific PR
```bash
./scripts/CheckCodeRabbitPR.sh 123
```

### For Claude Code
```
"Read .quality-reports/CodeRabbitSummary.md and fix the issues"
```

```
"Read .quality-reports/PR-123-Summary.md and implement the suggested changes"
```

## 📋 File Locations

- **All PRs Summary:** `.quality-reports/CodeRabbitSummary.md`
- **Specific PR:** `.quality-reports/PR-{NUMBER}-Summary.md`
- **Raw JSON:** `.quality-reports/*.json`

## ⚡ Pro Tips

1. **Before starting work:** Run sync script to get latest feedback
2. **For specific PR fixes:** Use CheckCodeRabbitPR.sh with PR number
3. **With Claude Code:** Always point to the markdown summary files
4. **Automated:** GitHub Actions will sync on every PR event

## 🎯 Quality Workflow

```
Code → Push → CodeRabbit Reviews → Sync Feedback → Claude Code Reads → Fixes Applied
```

## 🔄 Integration Points

- **Manual Scripts:** When you want control
- **GitHub Actions:** Fully automated on PR events
- **Claude Code:** Reads summaries and implements fixes
- **Claude Chat (Me):** Strategic reviews and architecture guidance

---

**Status:** ✅ Integration Active  
**Last Updated:** $(date)
