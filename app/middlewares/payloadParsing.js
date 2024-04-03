
export default (req, res, next) => {
    try {
        let payload = null;
        if (typeof req.body.payload === 'string') {
            payload = JSON.parse(req.body.payload);
        } else {
            payload = req.body.payload;
        }

        // Set payload on request object
        Object.assign(req, { payload });

    } catch (err) {
        res.json({ error: 'Could not parse payload json' });
        // TODO: Add rest middleware
        // res.rest(false, 550, 'Could not parse payload json');
        return;
    }
    next();
};