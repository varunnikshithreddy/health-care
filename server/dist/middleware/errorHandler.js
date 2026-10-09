export const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Do not expose stack trace or database passwords in production
    const response = {
        error: err.name || 'Error',
        message,
    };
    if (process.env.NODE_ENV === 'development') {
        response.details = err.stack;
    }
    res.status(statusCode).json(response);
};
