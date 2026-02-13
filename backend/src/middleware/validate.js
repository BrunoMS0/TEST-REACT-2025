function validate(requiredFields) {
    return (req, res, next) => {
        const missing = requiredFields.filter(field => !req.body[field] && req.body[field] !== 0);
        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
        }
        next();
    };
}

module.exports = validate;
