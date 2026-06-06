import type { Metadata } from "next";
export const metadata: Metadata = { title: "Grocery Lists — FoodWise" };

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}