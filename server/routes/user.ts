import { Router, Response, NextFunction } from 'express';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// PATCH /api/user/preferences — update user preferences (e.g. preferredTrack)
router.patch('/preferences', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { preferredTrack } = req.body;

    if (preferredTrack !== undefined && preferredTrack !== 'HLD' && preferredTrack !== 'LLD' && preferredTrack !== null) {
      return res.status(400).json({ error: 'preferredTrack must be "HLD", "LLD", or null' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (preferredTrack !== undefined) {
      user.preferredTrack = preferredTrack;
    }

    await user.save();

    return res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      preferredTrack: user.preferredTrack,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
});

export default router;
