export default function GatewayConfig({ adminId, setAdminId }) {
  return (
    <div className="bg-[#080d16]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">
        Gateway Configuration
      </h2>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Admin Link ID
        </label>
        <input
          type="text"
          required
          placeholder="e.g. ADM-8A9F"
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          className="w-full max-w-xs bg-[#04060a] border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none font-mono"
        />
      </div>
    </div>
  );
}
