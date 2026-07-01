import { SignIn } from '@clerk/nextjs'

export default function Page() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-green-600 via-green-500 to-green-400">
            <SignIn />
        </div>
    )
}