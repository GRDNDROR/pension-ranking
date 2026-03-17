import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מדד איכות קרנות פנסיה",
  description:
    "מדד איכותי לדירוג קרנות פנסיה בישראל - תשואות, איזון אקטוארי, שירות, אישור תביעות ועוד",
};

const NAV_LINKS = [
  { href: "/", label: "דירוג" },
  { href: "/portfolio", label: "מצא קרן" },
  { href: "/methodology", label: "מתודולוגיה" },
  { href: "/about", label: "אודות" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased`}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  <a href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                      פ
                    </div>
                    <h1 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      מדד איכות פנסיה
                    </h1>
                  </a>
                  {/* Desktop nav */}
                  <nav className="hidden md:flex gap-1 text-sm">
                    {NAV_LINKS.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all font-medium"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                  {/* Mobile nav */}
                  <MobileNav links={NAV_LINKS} />
                </div>
              </div>
            </header>
            <main>{children}</main>
            <footer className="border-t border-border/50 mt-16 bg-muted/30">
              <div className="container mx-auto px-4 py-8 text-sm text-muted-foreground">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <p className="max-w-xl">
                    המידע באתר זה הינו אינפורמטיבי בלבד ואינו מהווה ייעוץ פנסיוני
                    או המלצה. מקור הנתונים: data.gov.il, פנסיה נט.
                  </p>
                  <div className="flex gap-4 text-xs">
                    <a href="/methodology" className="hover:text-foreground transition-colors">מתודולוגיה</a>
                    <a href="/about" className="hover:text-foreground transition-colors">אודות</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
