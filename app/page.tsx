import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";
import Hero from "@/components/shared/hero";
import FAQs from "@/components/shared/faq";
import { Button } from "@/components/ui/button";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <>
      <Header />
      <header className="flex justify-end items-center p-4 gap-4 h-16">
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton>
            <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h1 className="font-heading text-[2.75rem] font-normal leading-[1.05] tracking-[-0.04em] text-black sm:text-[3.5rem] lg:text-[4rem]">
            The modern way
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            to manage money together.
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
            Create savings circles, collect contributions, track every payment,
            and distribute payouts—all from one transparent platform built for
            communities.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-full bg-[#4aa054] px-8 text-base font-medium"
            >
              Create a Circle
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="h-12 rounded-full px-6 text-base font-medium"
            >
              Sign in
            </Button>
          </div>
        </div>
      </section>
      <Hero />
      <FAQs />
      <Footer />
    </>
  )
}