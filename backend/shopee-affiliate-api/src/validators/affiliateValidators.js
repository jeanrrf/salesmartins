const { body } = require('express-validator');

exports.createAffiliateLinkValidator = [
    body('productId').notEmpty().withMessage('ID do produto é obrigatório'),
    body('campaignId').optional().isString(),
    body('subId').optional().isString(),
];