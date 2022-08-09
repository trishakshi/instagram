require('dotenv').config();
const jwt = require('jsonwebtoken');

function Auth(req, res, next) {
    try {
        const token = req.cookies.token;
        if(!token) {
            return res.status(401).json({ err: "Unauthorized." });
        }

        const validatedUser = jwt.verify(token, process.env.JWT_SECRET);
        req.user = validatedUser.id;

        next();
    } catch (err) {
        return res.status(401).json({ err: "Unauthorized." })
    }
}
module.exports = Auth;