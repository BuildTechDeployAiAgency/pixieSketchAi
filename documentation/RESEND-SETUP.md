# Resend Email Setup Guide

## 🚀 Quick Resend Setup (Recommended)

Resend is the easiest email service to set up for your receipts.

### Step 1: Sign Up for Resend
1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your account

### Step 2: Get API Key
1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it "PixieSketch Receipts"
4. Copy the key (starts with `re_`)

### Step 3: Add to Supabase
Run these commands:
```bash
supabase secrets set EMAIL_SERVICE=resend
supabase secrets set EMAIL_API_KEY=re_your_api_key_here
```

### Step 4: Domain Setup (Optional but Recommended)
1. Go to [Domains](https://resend.com/domains) in Resend
2. Add your domain: `pixiesketch.com`
3. Follow DNS setup instructions
4. This allows emails from `receipts@pixiesketch.com`

## 📧 What Happens Next

Once configured, users will automatically receive:
- ✅ Beautiful HTML receipt emails
- ✅ Purchase details and transaction IDs
- ✅ Direct links back to your app
- ✅ Professional branding

## 🧪 Testing
- Resend has a generous free tier (100 emails/day)
- Test emails in development mode
- All emails are logged in Resend dashboard

## 💡 Why Resend?
- ✅ Simple setup (just API key needed)
- ✅ Great deliverability
- ✅ Free tier included
- ✅ Modern dashboard
- ✅ Built for developers