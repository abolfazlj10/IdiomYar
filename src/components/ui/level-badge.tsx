'use client'

import { motion } from 'framer-motion'

interface LevelBadgeProps {
  levelId: string
  color: string
  animationDelay?: number
  className?: string
}

export default function LevelBadge({ 
  levelId, 
  color, 
  animationDelay = 0,
  className = ''
}: LevelBadgeProps) {
  const getLevelText = (id: string) => {
    switch (id) {
      case 'elementary':
        return 'Level 1'
      case 'intermediate':
        return 'Level 2'
      case 'advanced':
        return 'Level 3'
      default:
        return 'Level'
    }
  }

  return (
    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 z-10 ${className}`}>
      <motion.div
        className={`px-5 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r ${color} shadow-xl border-2 border-white`}
        initial={{ scale: 0, opacity: 0, y: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: animationDelay,
          type: "spring",
          stiffness: 200
        }}
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 8px 25px -5px rgba(0, 0, 0, 0.3)"
        }}
      >
        {getLevelText(levelId)}
      </motion.div>
    </div>
  )
}
