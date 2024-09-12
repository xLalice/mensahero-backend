"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUploader = void 0;
const cloudinary_1 = require("cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const imageUploader = (buffer, folder, filename) => {
    const stream = streamifier_1.default.createReadStream(buffer);
    return new Promise((resolve, reject) => {
        const cloudinaryStream = cloudinary_1.v2.uploader.upload_stream({
            resource_type: 'auto',
            folder: folder,
            public_id: filename || undefined
        }, (error, result) => {
            if (error)
                reject(error);
            else
                resolve(result);
        });
        stream.pipe(cloudinaryStream);
    });
};
exports.imageUploader = imageUploader;
exports.default = cloudinary_1.v2;
