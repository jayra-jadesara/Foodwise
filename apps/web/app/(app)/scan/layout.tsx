import type { Metadata } from "next";
export const metadata: Metadata = { title: "Scan — FoodWise" };

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}