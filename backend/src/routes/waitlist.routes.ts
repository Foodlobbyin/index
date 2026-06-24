import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import waitlistRepository from '../repositories/waitlist.repository';

const router = new Hono<AppBindings>();

/**
 * POST /api/waitlist/join
 * Public — anyone without an invite can join the waitlist
 */
router.post('/join', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { first_name, last_name, email, mobile_number, gstn, business_description } = body;

  if (!first_name || !email) {
    return c.json({ error: 'First name and email are required.' }, 400);
  }

  // Check if email already on waitlist
  const existing = await waitlistRepository.findByEmail(db, email);
  if (existing) {
    if (existing.status === 'waiting') {
      return c.json({ error: 'You are already on the waitlist. We will be in touch soon.' }, 409);
    }
    if (existing.status === 'invited') {
      return c.json({ error: 'You have already been invited. Please check your email.' }, 409);
    }
    if (existing.status === 'registered') {
      return c.json({ error: 'This email is already registered.' }, 409);
    }
  }

  // Check if already a registered user
  const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (userCheck.rows.length > 0) {
    return c.json({ error: 'This email is already registered. Please login.' }, 409);
  }

  await waitlistRepository.create(db, {
    first_name,
    last_name,
    email,
    mobile_number,
    gstn,
    business_description,
  });

  return c.json({
    message: 'You have been added to the waitlist. Our team will review your profile and reach out if you are a good fit for the community.',
  }, 201);
});

export default router;
