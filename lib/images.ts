/** Shrinking photos in the browser before they are uploaded.
 *
 *  A phone camera or a full-resolution video frame is easily several megabytes,
 *  and every visit stores two photos for 30 days. Storage and download allowances
 *  are what the free tiers run out of first, so photos are resized here: a face is
 *  only ever shown small, while an ID photo keeps enough resolution to read.
 *
 *  Redrawing onto a canvas also drops the file's metadata, including any GPS
 *  location a phone wrote into it.
 *
 *  Never fatal: if anything goes wrong the original is sent, and the server still
 *  validates it as before.
 */

export const FACE_PHOTO = { maxDimension: 640, quality: 0.8 };
export const ID_PHOTO = { maxDimension: 1600, quality: 0.85 };

export async function shrinkImage(
  blob: Blob,
  { maxDimension, quality }: { maxDimension: number; quality: number }
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    // Keep whichever is smaller: a tiny original should not grow by re-encoding.
    return out && out.size < blob.size ? out : blob;
  } catch {
    return blob;
  }
}
