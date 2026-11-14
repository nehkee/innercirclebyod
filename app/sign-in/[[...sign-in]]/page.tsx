import { SignIn } from '@clerk/nextjs';
import { AuthShell } from '@/components/auth/AuthShell';
import { isClerkConfigured } from '@/lib/auth';

export const metadata = { title: 'Sign in | Inner Circle by OD' };

export default function SignInPage() {
  return (
    <AuthShell title="INNER CIRCLE" subtitle="SIGN IN TO ACCESS">
      {isClerkConfigured() ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" /> : null}
    </AuthShell>
  );
}
