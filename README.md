# Watchestrader CRM

> An internal CRM platform purpose-built for **Watches Traders** — bringing WhatsApp® messaging, contact management, sales pipelines, and workflow automation together in one place.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Laravel 10](https://img.shields.io/badge/Laravel-10-red?logo=laravel)](https://laravel.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-blue?logo=tailwindcss)](https://tailwindcss.com)

This application follows a modern **decoupled full-stack architecture**, where the frontend and backend are developed and deployed as independent layers. The frontend handles all visual interactions, while the backend manages data, authentication, and third-party integrations through a clean REST API.

[WatchesTraders/crm-site](https://github.com/yafetpurnama-WT-Work/Watchestrader-CRM)
([wacrm.tech](https://crm.watchestrader.id/)). This repo is the product —
clone or fork it to run your own CRM.

---

## What You Get Out of the Box

- **Shared Inbox** — Multiple agents collaborating on a single WhatsApp Business number, with per-conversation assignment, status tracking, and internal notes.
- **Contact Management** — Tags, custom fields, CSV import, and built-in deduplication to keep your records clean.
- **Sales Pipelines** — A Kanban-style board with deals linked directly to conversations, so nothing falls through the cracks.
- **Broadcasts** — Send Meta-approved templates with delivery and read tracking, plus per-recipient variable substitution.
- **No-Code Automations** — Create workflows triggered by inbound messages, new contacts, keywords, or schedules. Includes conditional branches, delays, tags, webhooks, and a visual builder.
- **Real-Time Dashboard** — Monitor response times, daily volumes, pipeline value, and a cross-module activity feed at a glance.
- **Account Management** — Email, password, avatar updates, and global sign-out in one place.

---

## 🛠️ Tech Stack & Architecture

The system is split into two independent layers for better performance, security, and developer experience:

### 1. Frontend — Next.js

| Aspect             | Details                                                                                           |
| :----------------- | :------------------------------------------------------------------------------------------------ |
| **Framework**      | Next.js (App Router) with React                                                                   |
| **Language**       | TypeScript                                                                                        |
| **Styling**        | Tailwind CSS with a custom dynamic theme system (Light & Dark mode)                               |
| **Responsibility** | User interaction, dashboard rendering, visual state management, and Kanban pipeline visualization |

### 2. Backend — Laravel API

| Aspect             | Details                                                                                                                |
| :----------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Framework**      | Laravel (PHP)                                                                                                          |
| **Authentication** | Laravel Sanctum (token-based API authentication)                                                                       |
| **Database & ORM** | Eloquent ORM with UUID support across all models                                                                       |
| **Migrations**     | Fully managed by Laravel Migrations (MySQL / PostgreSQL)                                                               |
| **Responsibility** | Core CRM data management, Meta WhatsApp webhook handling, backend automation execution, and sensitive token encryption |

---

## 📁 Project Structure

| Directory       | Purpose                                                                                      |
| :-------------- | :------------------------------------------------------------------------------------------- |
| **`/src`**      | Next.js frontend source — pages, UI components, React hooks, and global state                |
| **`/api`**      | Laravel backend — controllers, models, database migrations, and API routes                   |
| **`/public`**   | Public assets such as the Watches Traders logo and dashboard banner images                   |
| **`/supabase`** | **[Legacy]** Contains the original database schema and migration files from the Supabase era |

---

## ⚠️ About the Legacy `/supabase` Folder

As part of the architecture migration from Supabase to a Laravel-powered backend:

- **Internal API routes removed** — All Next.js API routes that previously lived under `src/app/api/...` have been permanently deleted. This prevents any duplication of backend logic and ensures that every data request flows through the Laravel API instead.
- **Migration files kept as reference** — The SQL files inside `/supabase/migrations` are preserved solely as a historical blueprint of the original table structures. They can be helpful when cross-referencing column types or table relationships during the Laravel migration process.

### 📅 When Can You Safely Remove `/supabase`?

> [!IMPORTANT]
> You can permanently delete the entire `/supabase` folder from this repository once all three conditions are met:
>
> 1. The new **Laravel API** backend has been successfully deployed and is running stably in production.
> 2. The production database (MySQL or PostgreSQL) is fully operational using Laravel Migrations.
> 3. You have thoroughly verified that no remaining code or configuration references any legacy Supabase endpoints.

---

## 🚀 Getting Started Locally

### 1. Start the Backend (Laravel)

Make sure you have **PHP ≥ 8.2** and a running **MySQL** or **PostgreSQL** instance (e.g., via [Laragon](https://laragon.org) or XAMPP).

```bash
cd api
composer install
cp .env.example .env          # Configure your database credentials
php artisan key:generate
php artisan migrate            # Create the CRM database tables
php artisan serve
```

The API server will be available at `http://127.0.0.1:8000`.

### 2. Start the Frontend (Next.js)

```bash
# From the project root directory
npm install
For .ENV can request to the admin, or you can create your own .env.local file with the following content:

# cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your Laravel backend
npm run dev
```

Then open your browser and navigate to `http://localhost:3000`.

---

## 🌿 Branching Strategy

This repository follows a structured branching workflow to keep development organized and production releases stable:

| Branch           | Purpose                                                         | Protection              |
| :--------------- | :-------------------------------------------------------------- | :---------------------- |
| **`main`**       | Active development — all feature branches merge here first      | Requires 1 PR approval  |
| **`production`** | Stable releases — only tested code from `main` is promoted here | Requires 2 PR approvals |
| **`feature/*`**  | Individual feature or task branches created from `main`         | —                       |
| **`fix/*`**      | Bug fix branches created from `main`                            | —                       |

**Workflow:** `feature/*` or `fix/*` → Pull Request to `main` → Pull Request to `production`

---

## 📄 License

Copyright © **Watches Traders**. All rights reserved.

This software is proprietary and intended for internal use only. Unauthorized copying, modification, or distribution outside of Watches Traders is strictly prohibited.
