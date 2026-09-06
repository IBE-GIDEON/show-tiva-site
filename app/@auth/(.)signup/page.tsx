import AuthForm from "@/app/_auth/AuthForm";
import AuthModal from "@/app/_auth/AuthModal";
import { getChrome } from "@/lib/site";

export default async function SignupModalPage() {
  const { brand } = await getChrome();

  return (
    <AuthModal label="Create account">
      <AuthForm mode="signup" brand={brand} surface="modal" />
    </AuthModal>
  );
}
