"use client"

import { useState } from "react"

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
    >
      {copied ? "コピー済み ✓" : "コピー"}
    </button>
  )
}
