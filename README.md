# Seido Karate Club Management System

A comprehensive web application for managing karate club members, grading periods, applications, and referee training.

## 🥋 Features

- **Member Management**: Track members with profiles, ranks, and personal information
- **Grading System**: 
  - Students can apply for grading during open periods
  - Instructors can create grading periods and enter results with remarks
  - Complete grading history tracking
- **Referee Training Module**:
  - WKF rules and learning materials
  - Interactive quizzes for referee and coach exams
  - Progress tracking
- **Role-Based Access**: Student, Instructor, and Admin dashboards
- **Admin Functions**: Override capabilities, rank changes, and audit logging

## 🚀 Tech Stack

- **Frontend**: Vite + React + TypeScript + shadcn-ui + Tailwind CSS
- **Database**: Neon PostgreSQL (serverless, auto-scaling)
- **Authentication**: Supabase Auth
- **Storage**: Cloudflare R2
- **Hosting**: Vercel
- **Cost**: $0/month on free tiers! 🎉

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- A Neon account (free tier)
- A Supabase account (for auth only)
- A Cloudflare account (for R2 storage)

### Setup Steps

1. **Clone and install dependencies**

```bash
npm install
```

2. **Set up Neon Database**

- Go to [Neon Console](https://console.neon.tech)
- Create a new project
- Copy the connection string
- Run migrations:

```bash
# Connect to your Neon database
psql "your-neon-connection-string"

# Run all migration files from supabase/migrations/ directory
# Execute them in order by timestamp
```

3. **Set up Cloudflare R2**

- Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
- Navigate to R2 Object Storage
- Create a new bucket (e.g., `seido-karate-files`)
- Create API tokens with read/write permissions
- Note down your Account ID, Access Key, and Secret Key

4. **Configure Environment Variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=seido-karate-files
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

5. **Run Development Server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🎨 Theme Customization

The application uses a **separated theming system** for easy customization. All theme values are centralized in the `src/theme/` directory:

### Theme Structure

```
src/theme/
  ├── config/
  │   ├── colors.ts       # Color palette (light & dark modes)
  │   ├── typography.ts   # Fonts, sizes, weights
  │   ├── spacing.ts      # Spacing scale, border radius
  │   └── layout.ts       # Breakpoints, grid, z-index
  └── index.ts            # Main theme export
```

### Changing Colors

Edit `src/theme/config/colors.ts`:

```typescript
export const colors = {
  light: {
    primary: '0 0% 10%',      // Change to your primary color
    accent: '45 100% 50%',    // Change to your accent color
    // ... other colors
  },
  dark: {
    // Dark mode variants
  }
}
```

All colors use **HSL format** for better manipulation. The CSS variables in `src/index.css` automatically update.

### Changing Typography

Edit `src/theme/config/typography.ts` to change fonts:

```typescript
export const typography = {
  fontFamily: {
    sans: 'Your Font, system-ui, sans-serif',
  },
  // ... other typography settings
}
```

## 🚢 Deployment to Vercel

1. **Install Vercel CLI** (optional)

```bash
npm i -g vercel
```

2. **Deploy**

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

3. **Configure Environment Variables in Vercel**

Go to your Vercel project settings and add all environment variables from `.env`:

- `DATABASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

4. **Deploy**

```bash
vercel --prod
```

## 📊 Database Schema

Key tables:

- `profiles` - User profiles with roles (student, instructor, admin)
- `ranks` - Belt ranking system
- `gradings` - Grading applications
- `grading_history` - Immutable grading records
- `grading_periods` - Time windows for grading applications
- `referee_question_banks` - Question sets for referee exams
- `referee_questions` - Individual exam questions
- `referee_rule_documents` - WKF rule documentation
- `referee_progress` - User progress tracking

## 🔐 Default Admin Account

After running migrations, a default admin account is created:

- **Email**: `contact@hayashiha.sg`
- **Password**: `Password`

**⚠️ Change this immediately in production!**

## 📝 Development

### Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components (routes)
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client and types
├── theme/           # Theme configuration (NEW!)
├── types/           # TypeScript type definitions
└── lib/             # Utility functions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🆘 Troubleshooting

### Database Connection Issues

- Ensure your Neon database is not suspended (it auto-suspends after 5 min of inactivity)
- Check that your connection string includes `?sslmode=require`
- Verify your IP is not blocked by Neon's firewall

### Authentication Issues

- Verify Supabase URL and Anon Key are correct
- Check that Supabase project is active
- Ensure email confirmation is disabled for development

### File Upload Issues

- Verify R2 credentials are correct
- Check bucket CORS settings allow your domain
- Ensure bucket is publicly accessible (for profile pictures)

## 📄 License

This project is proprietary and confidential.

## 🤝 Support

For issues or questions, contact the development team.
