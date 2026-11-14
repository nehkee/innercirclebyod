import { SignUp } from '@clerk/nextjs';
import { AuthShell } from '@/components/auth/AuthShell';
import { isClerkConfigured } from '@/lib/auth';

export const metadata = { title: 'Join | Inner Circle' };

export default function SignUpPage() {
  return (
    <AuthShell title="JOIN THE INNER CIRCLE" subtitle="CREATE YOUR ACCOUNT">
      {isClerkConfigured() ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" /> : null}
    </AuthShell>
  );
}
