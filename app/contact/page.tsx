import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Contact — CozyPaws",
  description:
    "Get in touch with CozyPaws — questions about orders, products, or just to say hi.",
};

export default function Contact() {
  return <ContactPage />;
}
