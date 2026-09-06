import type { Metadata } from "next";

import { getChrome } from "@/lib/site";

import AuthForm from "../_auth/AuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignUpPage() {
  const { brand } = await getChrome();
  return <AuthForm mode="signup" brand={brand} />;
}
