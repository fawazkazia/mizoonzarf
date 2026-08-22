import { StorefrontChrome } from "@/components/StorefrontChrome";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
