

export default (err, req, res, next) => {

    if (err && err.errorCode === 403) {
        res.status(403).json({
            error_number: 403,
            error_desc: err.message
        });
    }
    else {
        next(err);
    }
}




