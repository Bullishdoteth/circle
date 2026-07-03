type CreateCircleInput = {
    name: string
    slug: string
    description?: string
    imageUrl?: string
    visibility?: "private" | "invite_only"
}