import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const userRepository = AppDataSource.getRepository(User);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT!),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = userRepository.create({
            email,
            password: hashedPassword
        });

        await userRepository.save(user);

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.status(201).json({ user: { id: user.id, email: user.email }, token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.json({ user: { id: user.id, email: user.email }, token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordToken = await bcrypt.hash(resetToken, 12);

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await userRepository.save(user);

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        
        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
        });

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        const user = await userRepository.findOne({
            where: {
                resetPasswordExpires: new Date(Date.now())
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const isValidToken = await bcrypt.compare(token, user.resetPasswordToken!);
        if (!isValidToken) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await userRepository.save(user);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await userRepository.findOne({ where: { id: req.user!.id } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await userRepository.save(user);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const user = await userRepository.findOne({ where: { id: req.user!.id } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await userRepository.remove(user);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
