// Questions are no longer seeded from files. The admin writes them in the document editor at
// /docs/ai, /docs/hr and /docs/sql (see src/lib/docs). This file stays so `prisma db seed` does not fail.
console.log('Nothing to seed. Add questions at /docs/<category> while signed in as an admin.');