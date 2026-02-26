import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg animate-pulse">
      <div className="h-7 w-32 bg-slate-200 rounded" />
      <div className="mt-2 h-4 w-48 bg-slate-100 rounded" />
      <div className="mt-6 space-y-4">
        <div className="h-11 bg-slate-100 rounded-xl" />
        <div className="h-11 bg-slate-100 rounded-xl" />
        <div className="h-10 bg-slate-200 rounded-xl w-full" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-background)] px-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
