'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  percentage: number
  color: string
  showPercentage?: boolean
  height?: 'sm' | 'md' | 'lg'
  animationDelay?: number
  className?: string
}

export default function ProgressBar({ 
  percentage, 
  color, 
  showPercentage = true, 
  height = 'md',
  animationDelay = 0,
  className = ''
}: ProgressBarProps) {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-1.5', 
    lg: 'h-2'
  }

  return (
    <div className={`mb-4 ${className}`}>
      {showPercentage && (
        <div className="flex justify-end items-center mb-2">
          <span className="text-sm text-gray-600">
            {percentage}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heightClasses[height]}`}>
        <motion.div
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 0.8, 
            delay: animationDelay,
            ease: "easeOut"
          }}
        />
      </div>
    </div>
  )
}
