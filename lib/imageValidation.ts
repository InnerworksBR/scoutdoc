export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_CHAT_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_AVATAR_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

export function validateImageFile(file: File, maxSize = MAX_CHAT_IMAGE_SIZE): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        return "Use PNG, JPG ou WebP.";
    }
    if (file.size > maxSize) {
        return `Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)} MB.`;
    }
    return null;
}
