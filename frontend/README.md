# Cursus Frontend

## Run locally

1. Install dependencies:

```bash
npm install
```

1. Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=cursus
```

1. Start the dev server:

```bash
npm run dev
```

1. Open `http://localhost:3000`.

## MongoDB setup

This project now includes:

- A reusable MongoDB connection utility in `lib/mongodb.ts`.
- A health endpoint at `GET /api/health/mongo`.

If MongoDB is configured correctly, `GET /api/health/mongo` returns:

```json
{
  "ok": true,
  "message": "MongoDB connection is healthy."
}
```

## Usage example

Use `getDb()` in server code (Route Handlers, Server Actions, or Server Components):

```ts
import { getDb } from '@/lib/mongodb';

export async function GET() {
  const db = await getDb();
  const students = await db.collection('students').find().limit(10).toArray();
  return Response.json(students);
}
```
