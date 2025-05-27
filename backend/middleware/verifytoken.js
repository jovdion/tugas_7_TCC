import jwt from 'jsonwebtoken';

// Verify Access Token Middleware
export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];  // Extract the token

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {  // Use the secret from .env
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.userId = decoded.userId;  // Attach user info to request
    next();  // Proceed to the next middleware or route handler
  });
};
