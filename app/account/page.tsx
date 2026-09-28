import type { Metadata } from "next";
import AccountPage from "@/components/AccountPage";

export const metadata: Metadata = {
  title: "Your account · CozyPaws",
  description: "Sign in, see your orders and saved details.",
};

export default function Page() {
  return <AccountPage />;
}
