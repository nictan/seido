# Development Guide

## Prerequisites

- Node.js 18+ and npm
- Git
- Supabase CLI (optional, for local development)
- A Supabase account with access to the project

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

The project uses Supabase as the backend. The connection is configured in:
- `src/integrations/supabase/client.ts`

No `.env` file is required for basic development as the Supabase credentials are embedded in the client file.

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Header, navigation components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   └── use-mobile.tsx  # Mobile detection hook
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── pages/              # Route components
├── types/              # TypeScript type definitions
└── lib/                # Utility functions
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to auth.users |
| `ranks` | Belt/grade definitions (10th Kyu to 5th Dan) |
| `gradings` | Grading applications and results |
| `grading_periods` | Scheduled grading events |
| `grading_configurations` | Available grades for application |
| `grading_history` | Historical grading records |

### Referee Module Tables

| Table | Purpose |
|-------|---------|
| `referee_question_banks` | Exam categories (Kumite/Kata Referee/Coach) |
| `referee_questions` | TRUE/FALSE questions with explanations |
| `referee_rule_documents` | WKF rule PDFs and documents |
| `user_quiz_attempts` | Mock exam results |
| `user_study_progress` | Learning progress per question bank |
| `user_flashcard_progress` | Spaced repetition tracking |

---

## Git Branching Workflow

### Branch Naming Convention

```
feature/   - New features (e.g., feature/add-notifications)
bugfix/    - Bug fixes (e.g., bugfix/login-redirect)
hotfix/    - Urgent production fixes (e.g., hotfix/payment-error)
refactor/  - Code refactoring (e.g., refactor/auth-flow)
docs/      - Documentation updates (e.g., docs/api-guide)
```

### Workflow

1. **Create a feature branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **After PR approval, merge to main**

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting, etc.)
refactor: Code refactoring
test:     Adding tests
chore:    Maintenance tasks
```

---

## Supabase Branching (Optional)

If you've enabled Supabase Branching:

### How It Works

1. When you create a Git branch, Supabase automatically creates a preview database
2. The preview database runs all migrations from `supabase/migrations/`
3. Test data from `supabase/seed.sql` is applied (if exists)
4. Each preview branch has its own API credentials

### Working with Preview Branches

1. **Create a branch** - Supabase spins up a preview instance
2. **Develop and test** - Changes are isolated to the preview
3. **Merge to main** - Migrations are applied to production
4. **Branch deleted** - Preview instance is cleaned up

### Migration Files

Located in `supabase/migrations/`. Each file is timestamped:

```
supabase/migrations/
├── 20250127064121_remote_schema.sql
├── 20250127093800_add_profiles_policies.sql
└── ...
```

**Creating new migrations:**
- Use the Lovable migration tool (recommended)
- Or create manually with timestamp prefix

---

## User Roles

### Student (`is_student: true`)
- View/edit own profile
- Apply for gradings
- View grading results
- Access referee exam preparation

### Instructor (`is_instructor: true`)
- All student capabilities
- Review grading applications
- Manage students in their dojo
- Conduct grading sessions
- View student emergency contacts

### Admin (`is_admin: true`)
- All instructor capabilities
- Manage all dojos
- System configuration
- User management

---

## Key Features

### Grading Application Flow

1. Student selects target grade
2. Student acknowledges risk/indemnity
3. Student provides digital signature
4. Application submitted with `application_status: 'Submitted'`
5. Instructor reviews and approves/rejects
6. If approved, grading conducted with `status: 'Pass'/'Fail'`

### Referee Exam Module

- **Rules Library**: Access WKF rule documents
- **Study Mode**: Flashcard learning with spaced repetition
- **Mock Exams**: Timed practice tests
- **Progress Tracking**: Performance analytics

---

## Testing

### Manual Testing Checklist

- [ ] Authentication (login, signup, logout)
- [ ] Profile update with emergency contacts
- [ ] Grading application submission
- [ ] Instructor application review
- [ ] Referee quiz completion
- [ ] Mobile responsiveness

---

## Deployment

### Lovable Deployment

1. Click **Publish** in the Lovable editor
2. Frontend changes require clicking **Update**
3. Backend changes (edge functions, migrations) deploy automatically

### Custom Domain

Configure in Project > Settings > Domains in Lovable.

---

## Troubleshooting

### Common Issues

**"Missing data" in queries**
- Supabase has a 1000 row default limit
- Add `.limit()` or pagination

**RLS policy errors**
- Check user is authenticated
- Verify policy conditions match user's role

**Type errors after migration**
- Types in `src/integrations/supabase/types.ts` auto-update
- Restart TypeScript server if needed

---

## API Reference

### Database Functions (RPC)

#### `insert_grading_application`

Securely inserts a grading application, automatically capturing the student's current grade at submission time.

```sql
-- Function signature
insert_grading_application(
  p_student_id uuid,
  p_requested_rank_id uuid,
  p_requested_grade jsonb,
  p_indemnity jsonb
) RETURNS uuid
```

**Usage in TypeScript:**
```typescript
const { data, error } = await supabase.rpc('insert_grading_application', {
  p_student_id: userId,
  p_requested_rank_id: selectedRankId,
  p_requested_grade: { kyu: 9, belt_color: 'White', dan: null },
  p_indemnity: {
    signed_at: new Date().toISOString(),
    signature_image_url: signatureUrl,
    pdf_url: pdfUrl
  }
});
```

**Why it exists:** Ensures `grade_at_application` is captured server-side at the exact moment of submission, preventing client-side manipulation.

---

#### `handle_new_user`

Trigger function that automatically creates a profile when a new user signs up.

```sql
-- Triggered on: auth.users INSERT
-- Creates profile with:
--   - Default rank (10th Kyu White)
--   - Metadata from signup (first_name, last_name, etc.)
--   - Default dojo: 'HQ'
```

**Note:** This runs automatically - no client-side call needed.

---

#### `is_instructor`

Security definer function to check if a user is an instructor. Used in RLS policies to prevent infinite recursion.

```sql
-- Function signature
is_instructor(user_uuid uuid) RETURNS boolean
```

**Usage in RLS policies:**
```sql
-- Instead of this (causes recursion):
EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_instructor = true)

-- Use this:
is_instructor(auth.uid())
```

---

#### `update_updated_at_column`

Trigger function that automatically updates the `updated_at` timestamp on row modifications.

```sql
-- Applied to tables: profiles, ranks, gradings, etc.
-- Automatically sets: NEW.updated_at = now()
```

---

### Row-Level Security (RLS) Policies

#### `profiles` Table

| Policy | Command | Condition |
|--------|---------|-----------|
| Users can view their own profile | SELECT | `auth.uid() = user_id` |
| Users can update their own profile | UPDATE | `auth.uid() = user_id` |
| Users can insert their own profile | INSERT | `auth.uid() = user_id` |
| Instructors can view all profiles | SELECT | `is_instructor(auth.uid())` |
| Instructors can update student profiles | UPDATE | `EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_instructor = true)` |

**Note:** No DELETE policy - profiles cannot be deleted.

---

#### `gradings` Table

| Policy | Command | Condition |
|--------|---------|-----------|
| Students can view their own gradings | SELECT | `auth.uid() = student_id` |
| Students can insert their own gradings | INSERT | `auth.uid() = student_id` |
| Instructors can view all gradings | SELECT | Instructor check |
| Instructors can update gradings | UPDATE | Instructor check |

**Note:** No DELETE policy - grading records are permanent.

---

#### `grading_history` Table

| Policy | Command | Condition |
|--------|---------|-----------|
| Students can view their own history | SELECT | `auth.uid() = student_id` |
| Instructors can view all history | SELECT | Instructor check |
| Instructors can insert history | INSERT | Instructor check |

**Note:** No UPDATE or DELETE - history is immutable.

---

#### `grading_periods` Table

| Policy | Command | Condition |
|--------|---------|-----------|
| Instructors can view all grading periods | SELECT | Instructor check |
| Instructors can create grading periods | INSERT | Instructor check AND `auth.uid() = created_by` |
| Instructors can update grading periods | UPDATE | Instructor check |
| Instructors can delete grading periods | DELETE | Instructor check |

---

#### `ranks` Table

| Policy | Command | Condition |
|--------|---------|-----------|
| Everyone can view ranks | SELECT | `true` |
| Only admins can manage ranks | ALL | Admin check |

---

#### `grading_configurations` Table

| Policy | Command | Condition |
|--------|---------|-----------|
| Everyone can view grading configurations | SELECT | `true` |
| Only admins can manage grading configurations | ALL | Admin check |

---

#### Referee Module Tables

**`referee_question_banks`**
| Policy | Command | Condition |
|--------|---------|-----------|
| Anyone can view active question banks | SELECT | `is_active = true` |
| Admins can manage question banks | ALL | Admin check |

**`referee_questions`**
| Policy | Command | Condition |
|--------|---------|-----------|
| Anyone can view questions | SELECT | `true` |
| Admins can manage questions | ALL | Admin check |

**`referee_rule_documents`**
| Policy | Command | Condition |
|--------|---------|-----------|
| Anyone can view rule documents | SELECT | `true` |
| Admins can manage rule documents | ALL | Admin check |

**`user_quiz_attempts`**
| Policy | Command | Condition |
|--------|---------|-----------|
| Users can view own quiz attempts | SELECT | `auth.uid() = user_id` |
| Users can insert own quiz attempts | INSERT | `auth.uid() = user_id` |

**`user_study_progress`**
| Policy | Command | Condition |
|--------|---------|-----------|
| Users can view own study progress | SELECT | `auth.uid() = user_id` |
| Users can insert own study progress | INSERT | `auth.uid() = user_id` |
| Users can update own study progress | UPDATE | `auth.uid() = user_id` |

**`user_flashcard_progress`**
| Policy | Command | Condition |
|--------|---------|-----------|
| Users can view own flashcard progress | SELECT | `auth.uid() = user_id` |
| Users can insert own flashcard progress | INSERT | `auth.uid() = user_id` |
| Users can update own flashcard progress | UPDATE | `auth.uid() = user_id` |

---

### Storage Bucket Policies

| Bucket | Visibility | Access Rules |
|--------|------------|--------------|
| `profile-pictures` | Public | Users can upload to their own folder |
| `signatures` | Private | Users can upload; instructors can view |
| `indemnities` | Private | Users can upload; instructors can view |
| `certificates` | Public | Instructors can upload; everyone can view |

---

### Security Patterns Used

#### Avoiding RLS Recursion

When RLS policies need to check the same table, use a `SECURITY DEFINER` function:

```sql
-- ❌ BAD: Causes infinite recursion
CREATE POLICY "Instructors can view all"
ON profiles FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_instructor));

-- ✅ GOOD: Use security definer function
CREATE POLICY "Instructors can view all"
ON profiles FOR SELECT
USING (is_instructor(auth.uid()));
```

#### Role Separation

Roles (`is_student`, `is_instructor`, `is_admin`) are stored in the `profiles` table. For production systems with higher security requirements, consider migrating to a separate `user_roles` table with proper security definer functions.

---

## Useful Links

- [Supabase Dashboard](https://supabase.com/dashboard/project/tngvatrvsoafszxyaxzu)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/tngvatrvsoafszxyaxzu/sql/new)
- [Supabase Auth Users](https://supabase.com/dashboard/project/tngvatrvsoafszxyaxzu/auth/users)
- [Lovable Documentation](https://docs.lovable.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
