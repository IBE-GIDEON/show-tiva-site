import type { Metadata } from "next";

import { getChrome } from "@/lib/site";

import AuthForm from "../_auth/AuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in — Show Tiva",
};

export default async function SignInPage() {
  const { brand } = await getChrome();
  return <AuthForm mode="signin" brand={brand} />;
}
