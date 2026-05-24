import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifySessionToken } from '@/lib/auth';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Validates the file buffer against known image magic bytes.
 * Prevents basic extension-spoofing attacks.
 */
function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // 1. Check PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // 2. Check JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // 3. Check WEBP: 52 49 46 46 (RIFF) at offset 0 and 57 45 42 50 (WEBP) at offset 8
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  return false;
}

/**
 * Helper to upload buffer to Cloudinary via write stream.
 */
const uploadToCloudinary = (buffer: Buffer): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'artisanal-henna',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary response was empty.'));
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize Request
    const token = request.cookies.get('admin-session')?.value;
    const decoded = token ? await verifySessionToken(token) : null;

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 2. Parse Multipart Form Payload
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // 3. Check File Size Limit (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 5MB limit.' }, { status: 400 });
    }

    // 4. Validate Magic Bytes of file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidImageMagicBytes(buffer)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only actual JPG, PNG, and WEBP image files are allowed.' },
        { status: 400 }
      );
    }

    // 5. Upload buffer to Cloudinary
    console.log(`Uploading file ${file.name} to Cloudinary...`);
    const uploadResult = await uploadToCloudinary(buffer);

    return NextResponse.json(
      {
        url: uploadResult.url,
        publicId: uploadResult.public_id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Image Upload Failure:', error);
    return NextResponse.json(
      { error: 'An error occurred during file upload processing.' },
      { status: 500 }
    );
  }
}

