import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, forgotPassword, resetPassword, changePassword, deleteAccount } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
    ],
    register
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').exists().withMessage('Password is required')
    ],
    login
);

router.post(
    '/forgot-password',
    [body('email').isEmail().withMessage('Please enter a valid email')],
    forgotPassword
);

router.post(
    '/reset-password',
    [
        body('token').exists().withMessage('Token is required'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
    ],
    resetPassword
);

router.post(
    '/change-password',
    auth,
    [
        body('currentPassword').exists().withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters long')
    ],
    changePassword
);

router.delete('/delete-account', auth, deleteAccount);

export default router;
