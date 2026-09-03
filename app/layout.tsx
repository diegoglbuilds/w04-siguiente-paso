import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siguiente Paso | Empieza hacia adelante",
  description: "Una experiencia privada para empezar con una acción breve y descubrir posibilidades.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="es"><body>{children}</body></html>;
}
