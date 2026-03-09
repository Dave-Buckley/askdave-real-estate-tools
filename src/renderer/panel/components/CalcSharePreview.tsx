import { useState } from 'react'
import { X, Share2, Copy, Check } from 'lucide-react'

interface CalcSharePreviewProps {
  initialText: string
  onClose: () => void
}

export default function CalcSharePreview({ initialText, onClose }: CalcSharePreviewProps): React.JSX.Element {
  const [message, setMessage] = useState(initialText)
  const [copied, setCopied] = useState(false)

  const handleSend = (): void => {
    window.electronAPI.openExternal(`https://wa.me/?text=${encodeURIComponent(message)}`)
    onClose()
  }

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#161617] border border-white/[0.07] rounded-xl w-[340px] max-h-[80vh] flex flex-col shadow-2xl mx-3">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
          <h3 className="text-[13px] font-semibold text-[#ededee]">Share via WhatsApp</h3>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Editable preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[10px] text-[#a1a1aa] mb-2 uppercase tracking-wider font-medium">
            Edit message before sending
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-[260px] text-[12px] text-[#ededee] bg-white/[0.06] border border-white/[0.07] rounded-lg p-3 resize-none outline-none focus:border-[#818cf8]/40 transition-colors leading-relaxed font-mono"
            spellCheck={false}
          />
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={handleSend}
            className="w-full py-2.5 text-[13px] font-medium text-white rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#25D366' }}
          >
            <Share2 size={13} />
            Send via WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="w-full py-2 text-[12px] font-medium text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04] border border-white/[0.07] rounded-md transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check size={12} className="text-[#4ade80]" />
                <span className="text-[#4ade80]">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy to Clipboard
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-[12px] font-medium text-[#a1a1aa] hover:text-[#ededee] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
