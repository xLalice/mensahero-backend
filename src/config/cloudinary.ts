import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const imageUploader = (buffer: Buffer, folder: string, filename?: string): Promise<UploadApiResponse> => {
    const stream = streamifier.createReadStream(buffer);

    return new Promise<UploadApiResponse>((resolve, reject) => {
        const cloudinaryStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: folder,
                public_id: filename || undefined
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result!);
            }
        );

        stream.pipe(cloudinaryStream);
    });
};

export default cloudinary;
