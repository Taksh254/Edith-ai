# E.D.I.T.H. HUD - Setup and Troubleshooting Guide

## 🔧 Quick Setup

### 1. Environment Configuration
Make sure your `.env` file contains:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Groq AI (Optional)
VITE_GROQ_API_KEY=your-groq-api-key
```

### 2. Database Setup
**CRITICAL**: You must run the SQL setup in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** → **New Query**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run** to execute the setup

This creates:
- `profiles` table (user data)
- `chats` table (chat sessions)
- `messages` table (chat messages)
- Row Level Security (RLS) policies
- Proper indexes for performance

### 3. Email Confirmation Settings
In Supabase dashboard:
1. Go to **Authentication** → **Settings**
2. Under **Email**, ensure "Enable email confirmations" is set appropriately
3. If you want to skip email confirmation during development, disable it temporarily

## 🐛 Common Issues & Solutions

### Issue 1: "Missing Supabase environment variables"
**Solution**: 
- Verify `.env` file is in the project root
- Ensure variables start with `VITE_` prefix
- Restart development server after changing `.env`

### Issue 2: "Invalid login credentials"
**Possible Causes**:
- User hasn't confirmed their email (if email confirmation is enabled)
- Wrong password
- User doesn't exist in database

**Solutions**:
- Check email for confirmation link
- Try signing up again
- Disable email confirmation temporarily for development

### Issue 3: "Database relation does not exist"
**Solution**: Run the `supabase-setup.sql` in your Supabase dashboard

### Issue 4: "Access denied" errors
**Solution**: 
- Verify RLS policies are properly set up
- Check that tables exist in Supabase
- Ensure user is authenticated

## 🔍 Debugging Steps

### 1. Test Supabase Connection
Open `debug-auth.html` in your browser to test:
- Basic connection to Supabase
- Database table access
- Authentication flow

### 2. Check Browser Console
Open browser dev tools and look for:
- Supabase URL and API key logs
- Authentication error messages
- Network request failures

### 3. Verify Database Tables
In Supabase dashboard → **Table Editor**, check:
- `profiles` table exists
- `chats` table exists  
- `messages` table exists
- RLS policies are enabled

## 🚀 Running the Application

### Frontend
```bash
npm run dev
```
Opens at: http://localhost:3000

### Backend (Optional - for AI features)
```bash
cd server
npm install
npm start
```
Runs on: http://localhost:3001

## 📧 Email Confirmation (Development)

To skip email confirmation during development:
1. Go to Supabase dashboard → Authentication → Settings
2. Uncheck "Enable email confirmations"
3. Save changes
4. Restart your app

**⚠️ Remember to re-enable this in production!**

## 🛠️ Testing Authentication Flow

1. **Signup**: Create a new account
2. **Email**: Check for confirmation (if enabled)
3. **Login**: Use credentials to sign in
4. **Dashboard**: Should redirect to HUD interface

## 📞 Support

If issues persist:
1. Check browser console for detailed errors
2. Verify all environment variables are set
3. Ensure database setup SQL was executed
4. Test with `debug-auth.html` for isolated testing

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use strong passwords in production
- Enable email confirmation for production
- Review RLS policies before going live
