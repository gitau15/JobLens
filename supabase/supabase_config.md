# JobLens Supabase Setup Guide

## Project Creation

1. Go to [supabase.com](https://supabase.com) and sign in/sign up
2. Click "New Project"
3. Enter project details:
   - Project name: `joblens`
   - Region: Select the region closest to your users
   - Database password: Create a strong password
4. Click "Create new project"

## Database Schema Setup

Once your project is created, run the schema.sql file to create all required tables:

1. Navigate to the "SQL Editor" in your Supabase dashboard
2. Copy and paste the contents of `schema.sql` from this repository
3. Click "RUN" to execute the script

**Note**: The schema is designed with proper table ordering to avoid dependency issues. The raw_jobs table is created first, followed by users, then user_preferences, cvs, and finally recommendations which references both users and raw_jobs.

Alternatively, you can use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-reference-id>

# Push the schema
supabase db push
```

## Authentication Setup

Supabase provides built-in authentication. Configure the following:

1. Go to "Authentication" > "Settings" in your dashboard
2. Configure allowed URLs for your application
3. Set up email templates if needed
4. Configure OAuth providers (Google, GitHub, etc.) if desired

## Row Level Security (RLS) Policies

The schema includes RLS policies for data security. They are automatically applied when you run the schema.sql file.

## API Keys and Connection Details

After setup, you'll need these values for connecting your services:

- **Project URL**: Available in Project Settings > General
- **Public API Key (anon)**: Available in Project Settings > API
- **Service Role API Key**: Available in Project Settings > API (keep this secure!)

## Environment Variables

Use these environment variables in your services:

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Connecting from Your Services

To connect to Supabase from your Python services, install the client library:

```bash
pip install supabase
```

Example connection code:

```python
from supabase import create_client, Client

url: str = "YOUR_SUPABASE_URL"
key: str = "YOUR_SUPABASE_ANON_KEY"
supabase: Client = create_client(url, key)
```

## Database Connection Pooling

For production use, consider using connection pooling for better performance.

## Backup and Recovery

Supabase provides automatic backups. Review backup settings in your project dashboard under Settings > Database.

## Monitoring and Logs

Monitor your database performance and query logs in the Supabase dashboard under the "Logs" section.