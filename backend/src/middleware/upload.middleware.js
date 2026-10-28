const multer = require("multer");
const path = require("path");
const ApiError = require("../utils/ApiError");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  const validExts = [".csv", ".txt"];
  const validMimes = [
    "text/csv",
    "text/plain",
    "application/vnd.ms-excel",
    "application/csv",
    "text/x-csv",
  ];

  if (validExts.includes(ext) || validMimes.includes(mime)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        "Invalid file type. Only CSV files (.csv) are supported."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter,
});

module.exports = upload;
