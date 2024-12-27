import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

interface JwtPayload {
    userId: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.userId } });

        if (!user) {
            throw new Error();
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};
