interface GreetingsProps {
    userName: string;
}

export function Greetings({ userName }: GreetingsProps) {
    return (
        <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-balance">
            Good morning, {userName} 👋
        </h1>
        <p className="text-gray-600 text-xs md:text-sm mt-1">
            Here&apos;s what&apos;s happening in your circles today.
        </p>
        </div>
    );
}
