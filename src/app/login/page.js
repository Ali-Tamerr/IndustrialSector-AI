import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-[#06080c] text-slate-200">
      <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        Sign in to Industrial Control Tower
      </h1>
      <button
        onClick={() => signIn("google")}
        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="24"
          height="24"
        >
          <path fill="#FFC107" d="M43.6 20.4h-2.6v-2.6h-2.8v5.2h5.4v-2.6z" />
          <path fill="#FF3D00" d="M9.2 20.4h-2.6v2.6H4v-5.2h5.2v2.6z" />
          <path fill="#4CAF50" d="M31.2 16.2h-14v5.2h9.6c-.4 2.2-2 4-4.4 5.2l7.2 5.6c4.4-4 6.8-9.8 6.8-16.2 0-1.4-.2-2.8-.4-4.2z" />
          <path fill="#1976D2" d="M31.2 33.2c-3.2 2.2-7.2 3.4-11.6 3.4-9.2 0-16.8-7-16.8-15.6s7.6-15.6 16.8-15.6c4.2 0 8.2 1.4 11.2 3.8l6.8-6.8C40.8 5.6 46 12.6 46 20c0 7.4-5.2 14.4-12.6 17.8l-2-4z" />
        </svg>
        <span>Continue with Google</span>
      </button>
    </section>
  );
}
