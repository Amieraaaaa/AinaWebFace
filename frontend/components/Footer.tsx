import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-outline-variant/20">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 py-12 w-full max-w-7xl mx-auto">
        <div className="mb-8 md:mb-0 text-center md:text-left">
          <div className="font-headline font-bold text-primary text-xl mb-2">SkinSight</div>
          <p className="font-body text-xs tracking-widest uppercase text-on-surface-variant">
            © 2025 SkinSight. All rights reserved.
          </p>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Not a medical diagnosis. Consult a dermatologist for clinical concerns.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <Link href="/about" className="font-body text-xs tracking-widest uppercase text-on-surface-variant hover:text-secondary transition-colors">
            About
          </Link>
          <Link href="/privacy" className="font-body text-xs tracking-widest uppercase text-on-surface-variant hover:text-secondary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/disclaimer" className="font-body text-xs tracking-widest uppercase text-on-surface-variant hover:text-secondary transition-colors">
            Medical Disclaimer
          </Link>
          <Link href="/contact" className="font-body text-xs tracking-widest uppercase text-on-surface-variant hover:text-secondary transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
