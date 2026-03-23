// routes/auth.routes.js

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { signin,signup  } = require("../controllers/auth.controller");

const router = express.Router();

// route for user signup
router.post("/signup", asyncHandler(signup));
// route for user signin (login)
router.post("/signin", asyncHandler(signin));

module.exports = router;
