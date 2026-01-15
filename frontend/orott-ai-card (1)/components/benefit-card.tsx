"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, Check } from "lucide-react"
import type { Benefit } from "@/app/page"

interface BenefitCardProps {
  benefit: Benefit
  index: number
  alternatives: Benefit[]
  onSwap: (newBenefit: Benefit) => void
}

export function BenefitCard({ benefit, index, alternatives, onSwap }: BenefitCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className="relative"
    >
      <div
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="bg-white/5 border border-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center text-xl">
            {benefit.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium text-sm">{benefit.title}</h3>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </div>
            <p className="font-bold text-base text-white">{benefit.discount}</p>

            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-full max-w-full">
              <span className="text-xs flex-shrink-0">{benefit.reasonIcon}</span>
              <span className="text-[10px] text-gray-300 font-medium truncate max-w-[120px]">{benefit.reason}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-1 bg-[#1a1625] border border-white/10 rounded-xl overflow-hidden z-10 shadow-2xl"
        >
          <div className="p-2 border-b border-white/5">
            <p className="text-[10px] text-gray-400 px-2">다른 혜택으로 교체할까요?</p>
          </div>
          {alternatives.map((alt) => (
            <button
              key={alt.id}
              onClick={() => {
                onSwap({ ...alt, id: benefit.id })
                setIsDropdownOpen(false)
              }}
              className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors"
            >
              <span className="text-lg">{alt.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-white text-xs font-medium">{alt.title}</p>
                <p className="text-xs text-gray-400">{alt.discount}</p>
              </div>
              <Check className="w-4 h-4 text-transparent" />
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
