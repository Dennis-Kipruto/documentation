---
title: "Installation"
description: "How to install and set up the system"
order: 2
---

# Installation

This guide will help you install and configure the documentation system.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- SQLite database

## Installation Steps

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up the database: `npx prisma db push`
4. Start the development server: `npm run dev`

## Configuration

Configure your environment variables in the `.env` file:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```
