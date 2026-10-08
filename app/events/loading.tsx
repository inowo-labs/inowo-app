import Nav from "../components/Nav";
import Spinner from "../components/Spinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-slate-400">
        <Spinner size="lg" />
        <p className="text-sm">Reading from the contract…</p>
      </div>
    </div>
  );
}
