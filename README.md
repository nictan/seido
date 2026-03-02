# Seido Student Portal
**Hayashi-Ha Shitoryu Karate-do Singapore**

Seido is a comprehensive student portal designed to manage karate practitioners' journeys, track grading progressions, and facilitate instructor/admin operations.

## Features

* **Karate Profile Management**: Students can view and manage their personal details, training history, and instructor status.
* **Grading Card & Progression**: Track current ranks, view upcoming grading requirements, and maintain a complete history of belt promotions.
* **Role-Based Access**:
  * **Students**: Access personal profiles and grading history.
  * **Instructors**: Dedicated dashboard to manage their students, evaluate gradings, and track class progress.
  * **Administrators**: Full administrative control over users, rank systems, and system settings.
* **Interactive Training Tools**: Dedicated practice tools for scoring and learning competition rules.

## Tech Stack

This project is built with modern web technologies:
* **Frontend Framework**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS, Shadcn UI (Radix UI)
* **Routing**: React Router
* **State Management**: TanStack React Query
* **Authentication**: Better Auth
* **Database & ORM**: Neon Database (Serverless Postgres) + Drizzle ORM

## Getting Started

### Prerequisites

Ensure you have Node.js and `npm` installed.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with the necessary database and authentication keys (refer to your infrastructure details).

3. Start the development server:
   ```bash
   npm run dev
   ```

### Scripts
- `npm run dev`: Starts the local Vite development server.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run lint`: Runs ESLint for code formatting and standardizing.
- `npm run test`: Runs the test suite via Vitest.
