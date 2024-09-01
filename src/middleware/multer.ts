import multer, { FileFilterCallback, StorageEngine } from "multer";
import { Request } from "express";

const storage: StorageEngine = multer.memoryStorage();

const fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});

export default upload;
