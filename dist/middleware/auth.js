"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFriendMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token !== null && token !== void 0 ? token : '', process.env.JWT_SECRET);
        req.body = decoded;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authMiddleware = authMiddleware;
const addFriendMiddleware = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    const { friendUsername } = req.body;
    try {
        const decoded = jsonwebtoken_1.default.verify(token !== null && token !== void 0 ? token : '', process.env.JWT_SECRET);
        req.body = { ...decoded, friendUsername };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.addFriendMiddleware = addFriendMiddleware;
