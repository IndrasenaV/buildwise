const express = require("express");
const router = express.Router();
const upload = require("../middleware/fileupload");
const { addFile, deleteFile } = require("../controllers/uploadFileToStorageController");

router.delete("/delete", deleteFile);
router.post("/upload", upload.single("file"), addFile);

module.exports = router;


