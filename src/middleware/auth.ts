import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
}

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token ?? '',
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    req.body = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const addFriendMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { friendUsername } = req.body;

  try {
    const decoded = jwt.verify(
      token ?? '',
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    req.body = { ...decoded, friendUsername };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
