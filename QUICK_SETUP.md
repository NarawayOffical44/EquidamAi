# Evaldam AI - Quick Setup Checklist

## Your Supabase Project
- **URL:** https://otefuquqcjpbzkmjmovh.supabase.co ✅
- **ANON KEY:** [NEEDED]

---

## Step 1: Get Your ANON Key (2 minutes)

1. Go to: https://supabase.com/dashboard
2. Select your project (evaldam or whatever name you used)
3. Go to **Settings → API** (left sidebar under Project Settings)
4. Look for the section that says **Project API keys**
5. You'll see two keys:
   - One labeled `anon` / `public`
   - One labeled `service_role` (DO NOT USE)
6. **Copy the `anon` public key** (starts with `eyJ...` or similar)

---

## Step 2: Update .env.local

Replace `PASTE_ANON_KEY_HERE` with the key you copied:

```env
NEXT_PUBLIC_SUPABASE_URL=https://otefuquqcjpbzkmjmovh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your key)
```

**Important:**
- Keep these private!
- The URL is safe to share
- The ANON KEY should be kept secret in production

---

## Step 3: Create Database Schema (5 minutes)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (in left sidebar)
4. Click **New Query**
5. Delete the default text
6. Copy the entire content from: `lib/supabase/schema.sql`
7. Paste it into the SQL editor
8. Click **Run** (or press Ctrl+Enter)
9. Wait for "Success" confirmation

---

## Step 4: Enable Email Authentication

1. Go to **Authentication → Providers**
2. Make sure **Email** is toggled ON
3. Go to **Authentication → Settings**
4. Under "Site URL", set it to: `http://localhost:3000`
5. Click Save

---

## Step 5: Start Development Server

```bash
cd D:\Apps\GrantsDetector\Evaldam\evaldam
npm run dev
```

This will restart with your new Supabase connection.

---

## Step 6: Test Complete Flow

### Test 1: Sign Up (New User)
- Open http://localhost:3000
- Click **"Get Started"**
- Click **"Start Free Trial"** (for Plus plan)
- Fill in signup form
- Should see Dashboard with "No valuations yet"

### Test 2: Create Startup
- Click **"Add New Startup"**
- Should see sidebar with 5 sections
- Try uploading pitch deck or pasting text in "Upload Details"
- Fill in other sections using sidebar
- Click **"Generate Valuation"**
- Wait 30-60 seconds
- Should see Report with all 5 methods

### Test 3: View Dashboard
- Should see startup card with valuation
- Click on card to view full report
- Can logout and login again

### Test 4: Login (Returning User)
- Logout (button in top right of dashboard)
- Click **"Login"** on landing page
- Enter your test email and password
- Should see your startup in dashboard

---

## If You Get Errors

### Error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined"
**Solution:**
- Check `.env.local` has the ANON key (not publishable key)
- Restart dev server: `npm run dev`

### Error: "Failed to extract profile"
**Solution:**
- Check Groq API key in `.env.local`
- Or try pasting text instead of uploading PDF

### Error: "Error creating startup"
**Solution:**
- Make sure schema.sql was run successfully
- Check Supabase SQL Editor for errors
- Look at Supabase logs

### Error: "Cannot read property 'user' of null"
**Solution:**
- Make sure you're logged in
- Try signing up again
- Clear browser cache

---

## Success Indicators

When everything works, you'll see:

1. ✅ Can sign up and see dashboard
2. ✅ Can add a startup with sidebar sections
3. ✅ Can extract profile from pitch deck
4. ✅ Can generate valuation (30-60 sec wait)
5. ✅ Can see report with all 5 methods
6. ✅ Can logout and login
7. ✅ Startup persists in dashboard

---

## What to Do Next

Once all tests pass:

1. **Test with real pitch deck** - Try uploading an actual startup pitch
2. **Generate 3-5 valuations** - Test the system with real data
3. **Check database** - Go to Supabase and see your startups in the table
4. **Invite team members** - Test multi-user functionality
5. **Prepare for deployment** - Ready to deploy to production

---

## Important Notes

- **Development:** Uses http://localhost:3000
- **Production:** Will need different Supabase project + new URL in `.env.local`
- **API Keys:** Keep ANON key secret in production
- **Database:** Supabase handles backups automatically
- **Free Tier:** Includes 50MB database and 2GB storage

---

## Questions?

Check these files for more details:
- `SETUP_GUIDE.md` - Complete setup instructions
- `BUILD_SUMMARY.md` - Full architecture overview

---

**Status:** Ready for ANON key → Database schema → Testing

Once you provide the ANON key, I'll help you test the complete flow!
