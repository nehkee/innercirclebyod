export default function SignUpPage() {
  return (
    <main className="bg-od-black min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-12 h-12 border border-od-gold flex items-center justify-center mx-auto mb-4">
            <span className="font-bebas text-od-gold text-2xl leading-none">OD</span>
          </div>
          <h1 className="font-bebas text-4xl gold-text">JOIN THE INNER CIRCLE</h1>
          <p className="font-mono text-[10px] tracking-widest text-od-muted mt-1">CREATE YOUR ACCOUNT</p>
        </div>

        {/* Clerk SignUp component goes here */}
        {/* <SignUp routing="path" path="/sign-up" /> */}

        <div className="border border-od-border p-8 text-center">
          <p className="font-mono text-xs text-od-muted tracking-widest mb-4">
            AUTH SYSTEM — COMING SOON
          </p>
          <p className="text-od-muted text-sm mb-8">
            Account creation launches with the full platform. Add your Clerk keys to enable sign-up.
          </p>
          <a href="/" className="btn-primary py-3 px-8 text-sm inline-flex">
            ← BACK TO HOME
          </a>
        </div>
      </div>
    </main>
  );
}
