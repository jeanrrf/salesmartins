const { body, validationResult } = require('express-validator');

const validateAffiliateLink = [
    body('productId').isString().withMessage('Product ID must be a string'),
    body('userId').isString().withMessage('User ID must be a string'),
    body('campaignId').isString().withMessage('Campaign ID must be a string'),
    body('customParams').optional().isObject().withMessage('Custom parameters must be an object'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validateUserRegistration = [
    body('username').isString().withMessage('Username must be a string'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('email').isEmail().withMessage('Email must be valid'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = {
    validateAffiliateLink,
    validateUserRegistration
};