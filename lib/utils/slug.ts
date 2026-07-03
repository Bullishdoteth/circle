/**
 * Reserved slugs that should never be used as circle URLs.
 */
const RESERVED_SLUGS = new Set([
    "admin",
    "api",
    "app",
    "auth",
    "blog",
    "careers",
    "circle",
    "circles",
    "create",
    "dashboard",
    "docs",
    "explore",
    "help",
    "home",
    "invite",
    "join",
    "legal",
    "login",
    "logout",
    "onboarding",
    "pricing",
    "privacy",
    "profile",
    "register",
    "settings",
    "signin",
    "signup",
    "support",
    "terms",
]);

/**
 * Converts any string into a clean URL slug.
 *
 * Example:
 * "My Family Circle!" -> "my-family-circle"
 */
export function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD") // remove accents
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Returns true if the slug is reserved by the application.
 */
export function isReservedSlug(slug: string): boolean {
    return RESERVED_SLUGS.has(slug);
    }

    /**
     * Throws if the slug is invalid.
     */
    export function validateSlug(slug: string): void {
    if (!slug) {
        throw new Error("Slug cannot be empty.");
    }

    if (slug.length < 3) {
        throw new Error("Slug must be at least 3 characters.");
    }

    if (slug.length > 50) {
        throw new Error("Slug cannot exceed 50 characters.");
    }

    if (isReservedSlug(slug)) {
        throw new Error("This slug is reserved.");
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error("Slug contains invalid characters.");
    }
}

export async function generateUniqueSlug(
  name: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string>