import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm rounded-xl bg-slate-900 p-8 shadow-xl border border-slate-800">
        <h1 className="text-2xl font-bold text-white mb-1">ThreatLens</h1>
        <p className="text-slate-400 text-sm mb-6">Cyber Threat Intelligence Platform</p>

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              placeholder="analyst@threatlens.io"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Log In
          </button>

          <Link
            to="/dashboard"
            className="text-center text-sm text-blue-400 hover:text-blue-300 mt-2"
          >
            Go to Dashboard (temporary link)
          </Link>
        </form>
      </div>
    </div>
  );
}


