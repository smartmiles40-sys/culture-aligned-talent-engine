import { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-horizontal-dark-teal.png";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link to="/vagas-abertas" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Se Tu For, Eu Vou!" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-display text-sm font-bold text-primary-foreground">Se Tu For, Eu Vou!</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
