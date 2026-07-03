import Link from "next/link"

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 relative mx-auto mt-24 w-full max-w-7xl rounded-3xl border border-white/10 bg-[#4AA054] p-6 backdrop-blur sm:p-8">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        {/* Left Content */}
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="1" />
            </svg>
            Simple. Transparent. Community-first.
          </span>

          <h2 className="mt-5 font-space-grotesk text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Here&apos;s how Circle works
          </h2>

          <p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
            Create your savings circle, invite members with a secure link, and
            assign everyone a unique payment account. Every contribution is
            automatically tracked, reconciled, and reflected in your dashboard
            so you always know who has paid, who hasn&apos;t, and what&apos;s due next.
          </p>

          <div className="mt-8 h-px bg-white/10" />

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-neutral-900 transition hover:opacity-90"
            >
              Create a Circle
            </Link>
          </div>
        </div>

        {/* Video */}
        <div className="lg:col-span-6">
          <div
            className="mx-auto w-full max-w-4xl"
            style={{
              filter: "drop-shadow(0 20px 60px rgba(0,0,0,.45))",
            }}
          >
            <div className="rounded-[28px] border border-white/10 bg-neutral-900/60 p-3">
              <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-neutral-950">
                {/* Browser Header */}
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-neutral-600" />
                  <span className="h-3 w-3 rounded-full bg-neutral-600/80" />
                  <span className="h-3 w-3 rounded-full bg-neutral-600/60" />
                </div>

                <div className="aspect-video p-4 sm:p-6">
                  <iframe
                    className="h-full w-full rounded-xl"
                    src="https://www.youtube.com/embed/19g66ezsKAg"
                    title="How Circle Works"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}