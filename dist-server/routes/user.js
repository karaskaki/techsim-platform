"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// PATCH /api/user/preferences — update user preferences (e.g. preferredTrack)
router.patch('/preferences', auth_1.authMiddleware, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { preferredTrack } = req.body;
        if (preferredTrack !== undefined && preferredTrack !== 'HLD' && preferredTrack !== 'LLD' && preferredTrack !== null) {
            return res.status(400).json({ error: 'preferredTrack must be "HLD", "LLD", or null' });
        }
        const user = await User_1.default.findById(req.user.userId);
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
