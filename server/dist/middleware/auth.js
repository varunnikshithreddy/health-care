import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // In development, if a mock token is passed or dev-mode header
            const devUser = req.headers['x-dev-user-id'];
            if (!isLiveSupabase && devUser) {
                req.user = {
                    id: devUser,
                    email: `${devUser}@demo.lifecare.ai`,
                };
                return next();
            }
            res.status(401).json({
                error: 'Unauthorized',
                message: 'No authorization token provided. Please log in to continue.',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!isLiveSupabase) {
            // Dev mode mock authorization
            req.user = {
                id: token.length === 36 ? token : '00000000-0000-0000-0000-000000000001',
                email: 'demo@lifecare.ai',
            };
            return next();
        }
        // Verify token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired session. Please log in again.',
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email || '',
        };
        next();
    }
    catch (err) {
        res.status(500).json({
            error: 'AuthenticationError',
            message: 'Failed to verify authentication credentials.',
        });
    }
};
