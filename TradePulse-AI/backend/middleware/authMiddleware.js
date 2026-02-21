const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({ message: 'Not authenticated.' });

    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ message: 'User not found.' });

        // Block banned users from all API routes
        if (user.isBanned) {
            return res.status(403).json({
                message: 'Your account has been banned.',
                isBanned: true,
                banReason: user.banReason || 'No reason provided.',
            });
        }

        req.user = user;
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};
