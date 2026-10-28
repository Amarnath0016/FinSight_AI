const express = require("express");
const { previewCsv, commitCsv } = require("../controllers/uploadController");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

// Enforce authentication on upload endpoints
router.use(protect);

// Upload and validate CSV (memory preview, zero persistence)
router.post("/preview", upload.single("file"), previewCsv);

// Persist confirmed transactions to MongoDB
router.post("/commit", commitCsv);

module.exports = router;
