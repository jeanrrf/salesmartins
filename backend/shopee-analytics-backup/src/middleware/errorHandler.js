const errorHandler = (err, req, res, next) => {
    console.error('Error:', {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        code: err.code,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
    });

    const response = {
        success: false,
        message: err.message || 'Internal Server Error',
        code: err.code,
    };

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    switch (err.name) {
        case 'ValidationError':
            res.status(400).json(response);
            break;
        case 'UnauthorizedError':
            res.status(401).json(response);
            break;
        case 'ForbiddenError':
            res.status(403).json(response);
            break;
        case 'NotFoundError':
            res.status(404).json(response);
            break;
        default:
            res.status(err.status || 500).json(response);
    }
};

module.exports = errorHandler;