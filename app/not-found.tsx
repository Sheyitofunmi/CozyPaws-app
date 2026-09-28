import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { IconArrowRight } from "@/components/icons";

export const metadata = {
  title: "Page not found | CozyPaws",
};

export default function NotFound() {
  return (
    <div className="cozy-page not-found">
      <SiteHeader />
      <main className="not-found__main">
        <img
          src="/assets/Footer-Sticker SVG/footer-sticker-smiley.svg"
          alt=""
          aria-hidden="true"
          className="not-found__sticker"
        />
        <p className="not-found__code">404</p>
        <h1 className="not-found__title">
          this page <span className="accent">wandered off</span>
        </h1>
        <p className="not-found__lead">
          We sniffed around and couldn&apos;t find it. It was probably chasing a squirrel.
        </p>
        <div className="not-found__actions">
          <Link href="/shop" className="cozy-btn-orange">
            shop the good stuff <IconArrowRight className="cozy-btn-orange__icon" />
          </Link>
          <Link href="/" className="not-found__home">
            back home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
