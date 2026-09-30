import { Link } from "react-router-dom";
import { ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "@/components/site/ProductPreview";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { homeFor } from "@/features/auth/api";
import { useAuth } from "@/features/auth/use-auth";
import { useBranding } from "@/features/branding/use-branding";

export function LandingPage() {
  const { user } = useAuth();
  const { name } = useBranding();
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 bg-background">
        <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="rx-meta rx-mark">{name} · Support</p>
          <h1 className="mt-5 max-w-3xl text-balance text-[clamp(2.6rem,5.2vw,4.4rem)] font-bold leading-[1.05] tracking-[-0.03em] text-headline">
            How can we help?
          </h1>
          <p className="mt-5 max-w-xl text-[1.02rem] text-muted-foreground">
            Open a ticket, and follow the whole conversation with our support team in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <Button asChild size="lg" className="px-6">
              <Link to={user ? homeFor(user) : "/portal/tickets/new"}>
                {user ? "Go to my dashboard" : "Submit a ticket"}
                <ArrowRight />
              </Link>
            </Button>
            {user ? null : (
              <Button asChild variant="bracket">
                <Link to="/login">Log in</Link>
              </Button>
            )}
          </div>
          <div className="mt-14 w-full max-w-4xl">
            <ProductPreview />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
