import type { Metadata } from "next";
import AboutPage from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "About — CozyPaws",
  description:
    "CozyPaws is a pet store run by dog people, for dog people. Meet the pack behind the shop.",
};

export default function About() {
  return <AboutPage />;
}
