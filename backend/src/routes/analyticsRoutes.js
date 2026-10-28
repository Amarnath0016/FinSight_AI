const express = require("express");
const { getUserSegmentation } = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/segmentation", getUserSegmentation);

module.exports = router;
