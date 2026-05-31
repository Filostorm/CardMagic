// Rewrites a Supabase Storage public object URL into an on-the-fly image
// transform URL so the community feed downloads a right-sized image instead of
// the full-resolution export PNG. WebP/AVIF is negotiated automatically via the
// request Accept header (Supabase Pro image transformations).
//
// Example:
//   .../storage/v1/object/public/community-card-images/abc.png
// becomes
//   .../storage/v1/render/image/public/community-card-images/abc.png?width=720&quality=72&resize=contain

const OBJECT_PUBLIC_SEGMENT = "/storage/v1/object/public/";
const RENDER_PUBLIC_SEGMENT = "/storage/v1/render/image/public/";
const MAX_FEED_IMAGE_WIDTH = 1024;

export function getResizedCommunityImageUrl(
  url: string | undefined | null,
  displayWidth: number,
): string | undefined {
  if (!url) {
    return undefined;
  }

  // Only Supabase public storage objects can be transformed; leave anything else
  // (data URIs, external hosts, already-transformed URLs) untouched.
  if (!url.includes(OBJECT_PUBLIC_SEGMENT) || url.includes(RENDER_PUBLIC_SEGMENT)) {
    return url;
  }

  // ~2x the display width for crisp rendering on high-DPR screens, capped.
  const targetWidth = Math.min(MAX_FEED_IMAGE_WIDTH, Math.max(1, Math.round(displayWidth * 2)));
  const transformed = url.replace(OBJECT_PUBLIC_SEGMENT, RENDER_PUBLIC_SEGMENT);
  const separator = transformed.includes("?") ? "&" : "?";

  return `${transformed}${separator}width=${targetWidth}&quality=72&resize=contain`;
}
