import { Mail } from "lucide-react";

export default function EmailInspector({
  theme,
  selectedEmail,
  setSelectedEmail,
  onApprove
}) {
  if (!selectedEmail) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className={`${theme === 'dark' ? 'bg-[#0c0f17] border-[#182030] text-slate-350' : 'bg-white border-slate-200 text-slate-700 shadow-2xl'} border rounded-xl w-full max-w-2xl overflow-hidden relative`}>
        <div className={`border-b px-6 py-4 flex justify-between items-center ${theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]' : 'border-slate-100 bg-slate-50'}`}>
          <h3 className={`font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-slate-808'}`}>
            <Mail className="w-4 h-4 text-blue-400" />
            <span>Autonomous Procurement Agent Draft</span>
          </h3>
          <button 
            onClick={() => setSelectedEmail(null)}
            className={`text-slate-505 transition-colors duration-150 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-slate-800'}`}
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className={`rounded-lg p-4 font-mono text-xs space-y-1.5 border ${theme === 'dark' ? 'bg-[#06080c] border-[#182030]/80 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
            <div><span className="text-slate-500">From:</span> <span className="text-emerald-400">{selectedEmail.from}</span></div>
            <div><span className="text-slate-555">To:</span> <span className="text-blue-400">{selectedEmail.to}</span></div>
            <div><span className="text-slate-555">Subject:</span> <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedEmail.subject}</span></div>
            <div><span className="text-slate-555">Date:</span> <span className="text-slate-400">{selectedEmail.date}</span></div>
          </div>
          
          <div className={`rounded-lg p-4 font-mono text-[11px] max-h-80 overflow-y-auto border leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'bg-[#06080c] border-[#182030]/80 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
            {selectedEmail.body}
          </div>
        </div>

        <div className={`border-t px-6 py-4 flex justify-end space-x-3 font-mono text-xs ${theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]' : 'border-slate-100 bg-slate-50'}`}>
          <button 
            onClick={() => setSelectedEmail(null)}
            className={`px-4 py-2 rounded transition-colors duration-150 ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/50'}`}
          >
            Dismiss
          </button>
          <button 
            onClick={() => {
              if (onApprove) {
                onApprove(selectedEmail);
              } else {
                alert("Expedited dispatch webhook triggered! Order confirmed.");
              }
              setSelectedEmail(null);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors duration-150"
          >
            Approve & Send
          </button>
        </div>
      </div>
    </div>
  );
}
