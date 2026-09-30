import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { AuthProviderRoot } from "@/features/auth/auth-context";
import { BrandingProviderRoot } from "@/features/branding/branding-context";
import { router } from "./routes";
import "../styles/globals.css";

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProviderRoot>
        <BrandingProviderRoot>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
          <Toaster />
        </BrandingProviderRoot>
      </AuthProviderRoot>
    </ThemeProvider>
  );
}
