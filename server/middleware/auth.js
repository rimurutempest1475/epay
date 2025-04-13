import jwt from 'jsonwebtoken'
import UserModel from '../models/user.model.js';

// Middleware xác thực
const auth = async (req, res, next) => {
    try {
        console.log('Auth middleware called');
        
        // Lấy token từ cookies hoặc header (hỗ trợ cả hai cách)
        const token = req.cookies?.accessToken || 
                     (req.header('Authorization') ? req.header('Authorization').replace('Bearer ', '') : null);
        
        console.log('Token received:', token ? (token.substring(0, 10) + '...') : 'No token');
        
        if (!token) {
            console.error('Token is empty');
            return res.status(401).json({
                message: "Bạn chưa đăng nhập",
                error: true
            });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
            console.log('Decoded token id:', decoded.id);
            
            const user = await UserModel.findById(decoded.id).select('-password');
            if (!user) {
                console.error('User not found');
                return res.status(401).json({
                    message: "User not found",
                    error: true
                });
            }
            
            req.user = user;
            req.userId = decoded.id; // Cho tương thích với code cũ
            req.token = token;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError.message);
            return res.status(401).json({
                message: "Token is not valid",
                error: true
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export default auth;