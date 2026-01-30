import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Request, Response } from "express";
import { errorHandler } from "../errorHandler";

const uploadRoutes: Router = Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

const uploadFile = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
    }

    const b64 = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
    });

    return res.json({
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        format: uploadResponse.format,
        width: uploadResponse.width,
        height: uploadResponse.height,
    });
};

uploadRoutes.post("/", upload.single("file"), errorHandler(uploadFile));

export default uploadRoutes;
