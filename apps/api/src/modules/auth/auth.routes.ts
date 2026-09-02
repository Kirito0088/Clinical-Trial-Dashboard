import { Router } from 'express';
import { loginSchema, registerSchema, type PublicUser } from '@gvhax/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, signToken } from '../../middleware/auth.js';
import { HttpError, ok, wrap } from '../../lib/http.js';
import { User } from './user.model.js';

export const authRouter: Router = Router();

const toPublic = (u: {
  _id: unknown;
  name: string;
  email: string;
  role: PublicUser['role'];
  createdAt: Date;
}): PublicUser => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt.toISOString(),
});

authRouter.post(
  '/register',
  validate(registerSchema),
  wrap(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (await User.exists({ email })) throw HttpError.conflict('That email is already registered');

    // First account bootstraps as admin — otherwise a fresh database has
    // nobody who can reach the admin-only routes.
    const isFirst = (await User.estimatedDocumentCount()) === 0;
    const user = await User.create({
      name,
      email,
      password,
      role: isFirst ? 'admin' : (role ?? 'user'),
    });

    ok(res, { token: signToken({ id: String(user._id), email, role: user.role }), user: toPublic(user) });
  }),
);

authRouter.post(
  '/login',
  validate(loginSchema),
  wrap(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    // Same message either way — don't reveal which emails exist.
    if (!user || !(await user.checkPassword(password))) {
      throw HttpError.unauthorized('Incorrect email or password');
    }
    ok(res, { token: signToken({ id: String(user._id), email, role: user.role }), user: toPublic(user) });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw HttpError.notFound('User no longer exists');
    ok(res, toPublic(user));
  }),
);
