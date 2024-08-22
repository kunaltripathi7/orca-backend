import dotenv from "dotenv";
dotenv.config({ path: ".env" });

export const PORT = process.env.PORT;
export const CLERK_PUBLISHABLE = process.env.CLERK_PUBLISHABLE_KEY;
export const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
export const DB_URL = process.env.DATABASE_URL;
export const CLOUD_NAME = process.env.CLOUDINARY_NAME;
export const CLOUD_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUD_API_SECRET = process.env.CLOUDINARY_API_SECRET;
