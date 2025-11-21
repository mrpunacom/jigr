# Google Sheets Integration - Quick Setup Guide

**Time Required:** 15 minutes  
**Prerequisites:** Existing Google Cloud Project (JiGR Document AI)

---

## ✅ You Already Have

Since you're already using Google Cloud Document AI for document scanning:
```
✓ Google Cloud Project exists
✓ Billing enabled
✓ Cloud Console access
✓ Project ID known
```

**We'll just add OAuth credentials to your existing project!**

---

## 🔧 Step 1: Enable Additional APIs (2 mins)

**Go to:** https://console.cloud.google.com/apis/library

**Your existing project dropdown** → Select your JiGR project

**Enable these 2 APIs:**

1. **Google Sheets API**
   - Search: "Google Sheets API"
   - Click the result
   - Click **"Enable"**
   - Wait ~10 seconds

2. **Google Drive API**
   - Search: "Google Drive API"  
   - Click the result
   - Click **"Enable"**
   - Wait ~10 seconds

**✓ Done!** You now have Document AI + Sheets + Drive APIs enabled.

---

## 🔐 Step 2: Configure OAuth Consent Screen (5 mins)

**Go to:** https://console.cloud.google.com/apis/credentials/consent

### If You Already Have Consent Screen:
**Skip to Step 3!** (Your Document AI setup likely already created this)

### If You Need to Create One:

**User Type:**
- Select **"External"** (allows any Google account)
- Click **"Create"**

**App Information:**
```
App name: JiGR Stock Management
User support email: [your email]
App logo: [optional - use your JiGR logo]
```

**App Domain:**
```
Application home page: https://app.jigr.app
Application privacy policy: https://app.jigr.app/privacy
Application terms of service: https://app.jigr.app/terms
```

**Developer Contact:**
```
Email: [your email]
```

**Scopes:**
Click **"Add or Remove Scopes"**

Search and add these scopes:
```
✓ Google Sheets API (read-only)
  https://www.googleapis.com/auth/spreadsheets.readonly

✓ Google Drive API (read-only)
  https://www.googleapis.com/auth/drive.readonly
```

Click **"Update"** → **"Save and Continue"**

**Test Users (Optional):**
- Add your email for testing
- Click **"Save and Continue"**

**Summary:**
- Review and click **"Back to Dashboard"**

---

## 🎫 Step 3: Create OAuth Client ID (5 mins)

**Go to:** https://console.cloud.google.com/apis/credentials

Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**

### Application Type:
- Select **"Web application"**

### Name:
```
JiGR Stock Import - Google Sheets
```

### Authorized JavaScript Origins:

**Development:**
```
http://localhost:3000
```

**Production:**
```
https://app.jigr.app
```

Click **"+ Add URI"** for each.

### Authorized Redirect URIs:

**Development:**
```
http://localhost:3000/api/auth/google/callback
```

**Production:**
```
https://app.jigr.app/api/auth/google/callback
```

Click **"+ Add URI"** for each.

### Create:
Click **"Create"**

---

## 📝 Step 4: Copy Credentials (1 min)

**You'll see a popup with:**
```
Your Client ID
[long string].apps.googleusercontent.com

Your Client Secret  
[secret string]
```

**Copy these!** You need them for environment variables.

**Download JSON (Optional):**
- Click the download button
- Save as `google-oauth-credentials.json`
- **DO NOT commit to git!**
- Add to `.gitignore`

---

## 🔐 Step 5: Add to Environment Variables (2 mins)

### Local Development

Add to `.env.local`:
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE

# Already have these from Document AI:
# GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
# GOOGLE_CLOUD_PROJECT=your-project-id
```

### Production (Netlify/Vercel)

**Netlify:**
1. Go to: Site Settings → Environment Variables
2. Add:
```
   GOOGLE_CLIENT_ID = [paste Client ID]
   GOOGLE_CLIENT_SECRET = [paste Client Secret]
```

**Vercel:**
1. Go to: Project Settings → Environment Variables
2. Add:
```
   GOOGLE_CLIENT_ID = [paste Client ID]
   GOOGLE_CLIENT_SECRET = [paste Client Secret]
```

---

## ✅ Step 6: Test OAuth Flow (3 mins)

### Start Development Server:
```bash
npm run dev
```

### Test Connection:

1. Open: http://localhost:3000/stock/import
2. Click: **"Connect Google Sheets"**
3. **Expected:** Google login popup appears
4. **Grant:** Permissions (Sheets + Drive read-only)
5. **Expected:** Redirects back to JiGR
6. **Verify:** Can see your Google Sheets list

### If It Works:
✅ **Setup Complete!** Move to implementation.

### If It Fails:
Check these:

**"Redirect URI mismatch"**
- Verify redirect URI exactly matches in Google Console
- No trailing slashes
- Correct http/https

**"Access denied"**
- Check OAuth consent screen is configured
- Verify scopes added correctly
- Try adding your email as test user

**"Invalid client"**
- Verify CLIENT_ID and CLIENT_SECRET copied correctly
- No extra spaces
- Restart dev server after adding env vars

---

## 📊 Quick Verification Checklist
```
✓ Google Sheets API enabled in your project
✓ Google Drive API enabled in your project
✓ OAuth consent screen configured
✓ OAuth Client ID created
✓ Redirect URIs match exactly
✓ Environment variables added
✓ .env.local includes GOOGLE_CLIENT_ID and SECRET
✓ Can click "Connect Google Sheets" button
✓ Google popup appears and accepts credentials
✓ Redirects back successfully
✓ Can see list of spreadsheets
```

---

## 🎯 Common Issues & Solutions

### Issue: "This app isn't verified"

**Solution:** Click **"Advanced"** → **"Go to JiGR Stock Management (unsafe)"**

This is normal for apps in development. Once you publish, you can verify the app.

**To Remove Warning (Optional):**
1. Go to OAuth consent screen
2. Click **"Publish App"**
3. Submit for verification (takes 1-2 weeks)

### Issue: Can't see my spreadsheets

**Check:**
1. Granted correct permissions in OAuth popup?
2. Google Drive API enabled?
3. Token stored in database? (Check `google_oauth_tokens` table)

### Issue: Token expired error

**Solution:** Token refresh should happen automatically. If not:
1. Check `refresh_token` is stored in database
2. Verify `getGoogleAccessToken()` function is called
3. Try disconnecting and reconnecting Google account

### Issue: Rate limits hit

**Quota:**
- Free: 100 requests/100 seconds/user
- Should be plenty for normal usage

**If Hit:**
- Implement caching for spreadsheet lists
- Reduce polling frequency
- Request quota increase in Google Cloud Console

---

## 🔗 Useful Links

**Google Cloud Console:**
https://console.cloud.google.com

**APIs & Services:**
https://console.cloud.google.com/apis

**OAuth Credentials:**
https://console.cloud.google.com/apis/credentials

**OAuth Consent Screen:**
https://console.cloud.google.com/apis/credentials/consent

**Google Sheets API Docs:**
https://developers.google.com/sheets/api

**Google Drive API Docs:**
https://developers.google.com/drive/api

---

## 📞 Support

**If you get stuck:**

1. **Check the browser console** - OAuth errors show here
2. **Check server logs** - Token refresh errors show here
3. **Verify credentials** - Copy-paste errors are common
4. **Check database** - Is token stored in `google_oauth_tokens`?

---

## 🎉 You're Ready!

Once you see the Google login popup and can list your spreadsheets, you're all set!

**Next:** Hand off to Claude Code for full implementation.

**Estimated Time:** 15 minutes setup + 4-6 hours implementation = **Same day launch!** 🚀