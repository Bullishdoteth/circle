export default function Hero() {
    return (
      <section
        className="sm:p-8 relative bg-[#4aa054] w-full max-w-7xl border-white/10 border rounded-3xl mt-24 mr-auto ml-auto pt-6 pr-6 pb-6 pl-6 backdrop-blur">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 sm:gap-10">
          {/*<!-- Left content --> */}
          <div className="lg:col-span-6">
            {/* <!-- Connect pill --> */}
            <a href="#contact"
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ring-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 transition font-sans">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-lucide="circle-dot"
                className="lucide lucide-circle-dot w-4 h-4">
                <circle cx="12" cy="12" r="10" className=""></circle>
                <circle cx="12" cy="12" r="1" className=""></circle>
              </svg>
              Ready to Start?
            </a>

            {/*<!-- Headline --> */}
            <h1
              className="mt-4 text-[44px] sm:text-6xl md:text-7xl leading-[1.05] text-zinc-100 font-sans font-light tracking-tighter">Let&apos;s Build Something Extraordinary</h1>

            {/*<!-- Divider -->*/}
            <div className="h-px bg-white/10 mt-6"></div>

            {/*<!-- Service 1 --> */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl sm:text-3xl text-zinc-100 font-sans font-light tracking-tighter">Creative
                  Development</h3>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm text-zinc-200 bg-white/5 ring-1 ring-white/10 font-sans">Starting at $2,999</span>
              </div>
              <p className="text-zinc-400 text-sm sm:text-base mt-3 font-sans">Crafting digital experiences that captivate and
                convert your audience</p>
            </div>

            {/*<!-- Divider --> */}
            <div className="h-px bg-white/10 mt-6"></div>

            {/*<!-- Service 2 -->*/}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl sm:text-3xl text-zinc-100 font-sans font-light tracking-tighter">Full-Stack
                  Solutions</h3>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm text-zinc-200 bg-white/5 ring-1 ring-white/10 font-sans">Starting at $5,999</span>
              </div>
              <p className="text-zinc-400 text-sm sm:text-base mt-3 font-sans">Complete digital solutions from strategy to
                deployment and beyond.</p>
            </div>

            {/*<!-- CTAs --> */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#work"
                className="inline-flex items-center justify-center h-14 px-6 rounded-full text-base font-medium text-white bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] font-sans">View
                Our Work</a>
              <a href="#contact"
                className="inline-flex items-center justify-center h-14 px-8 rounded-full text-base font-medium text-neutral-900 bg-linear-to-b from-white to-neutral-300 hover:opacity-90 transition shadow-[0_12px_40px_rgba(0,0,0,0.35)] font-sans">Start
                Your Project</a>
            </div>
          </div>

          {/*<!-- Right showcase -->*/}
          <div className="lg:col-span-6">
            <div className="relative mx-auto w-full max-w-215" style={{ filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.6))' }}>
              {/*<!-- Outer frame --> */}
              <div className="rounded-[28px] bg-neutral-900/60 ring-1 ring-white/10 p-3">
                {/*<!-- Inner "screen" --> */}
                <div className="relative overflow-hidden rounded-[22px] bg-neutral-950 border border-white/10">
                  {/*<!-- Browser bar --> */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <span className="h-3 w-3 rounded-full bg-zinc-700"></span>
                    <span className="h-3 w-3 rounded-full bg-zinc-700/70"></span>
                    <span className="h-3 w-3 rounded-full bg-zinc-700/50"></span>
                  </div>

                  {/*<!-- Gallery grid --> */}
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                        <img src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/e5607922-3e3a-4da8-958a-13f3bb19c07c_320w.jpg" alt="Project preview 1" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/20 to-black/50"></div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                        <img src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/c7939795-f326-4a4c-9541-6cd5ee24e793_320w.jpg" alt="Project preview 2" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/20 to-black/50"></div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900 md:row-span-2">
                        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/62af90a3-7459-4c4f-be9c-04149b391218_320w.jpg" alt="Project preview 3" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent"></div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                        <img src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/5c3d7b58-631c-4dce-a85d-327c0dbb183b_320w.jpg" alt="Project preview 4" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/20 to-black/50"></div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                        <img src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/fb6b509f-d7d6-4c5a-ab4e-9cc3661e184b_320w.jpg" alt="Project preview 5" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/20 to-black/50"></div>
                      </div>
                    </div>
                  </div>

                  {/*<!-- Soft glow --> */}
                  <div className="pointer-events-none absolute -right-24 bottom-0 w-72 h-72 rounded-full bg-white/10 blur-3xl">
                  </div>
                  <div className="pointer-events-none absolute -left-24 -top-24 w-80 h-80 rounded-full bg-white/5 blur-3xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
}