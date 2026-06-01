import Link from "next/link";

const footerLinks = [
  { label: "ABOUT US", href: "/about" },
  { label: "SUSTAINABILITY", href: "#" },
  { label: "SHIPPING", href: "#" },
  { label: "RETURNS", href: "#" },
  { label: "CONTACT", href: "#" },
  { label: "PRIVACY", href: "#" },
] as const;

export default function Footer() {
  return (
    <footer className="bg-neutral-bg border-t border-border-soft pt-[79px] pb-12">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-8 px-6 sm:px-16">
        <p className="font-jakarta text-2xl font-semibold text-center text-text-main">
          LUA LA
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.6px] text-text-muted transition-colors hover:text-text-main"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="text-center text-base text-text-muted opacity-80">
          © 2024 LUA LA STUDIOS. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
