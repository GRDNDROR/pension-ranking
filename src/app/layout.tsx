import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מדד איכות קרנות פנסיה",
  description:
    "מדד איכותי לדירוג קרנות פנסיה בישראל - תשואות, דמי ניהול, איזון אקטוארי ועוד",
};

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
            <header className="border-b border-border">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold">
                    <a href="/">מדד איכות קרנות פנסיה</a>
                  </h1>
                  <nav className="flex gap-6 text-sm text-muted-foreground">
                    <a href="/" className="hover:text-foreground transition-colors">
                      דירוג
                    </a>
                    <a href="/portfolio" className="hover:text-foreground transition-colors">
                      בונה תיק
                    </a>
                    <a href="/methodology" className="hover:text-foreground transition-colors">
                      מתודולוגיה
                    </a>
                    <a href="/about" className="hover:text-foreground transition-colors">
                      אודות
                    </a>
                  </nav>
                </div>
              </div>
            </header>
            <main>{children}</main>
            <footer className="border-t border-border mt-16">
              <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground">
                <p>
                  המידע באתר זה הינו אינפורמטיבי בלבד ואינו מהווה ייעוץ פנסיוני
                  או המלצה. מקור הנתונים: data.gov.il, פנסיה נט.
                </p>
              </div>
            </footer>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
