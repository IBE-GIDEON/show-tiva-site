import AuthForm from "@/app/_auth/AuthForm";
import AuthModal from "@/app/_auth/AuthModal";
import { getChrome } from "@/lib/site";

export default async function SigninModalPage() {
  const { brand } = await getChrome();

  return (
    <AuthModal label="Sign in">
      <AuthForm mode="signin" brand={brand} surface="modal" />
    </AuthModal>
  );
}
