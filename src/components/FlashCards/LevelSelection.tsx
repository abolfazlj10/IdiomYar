'use client'

import { motion } from 'framer-motion'
import LevelCard from './LevelCard'

interface Level {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

interface LevelSelectionProps {
  onLevelSelect: (levelId: string) => void
}

const levels: Level[] = [
  {
    id: 'elementary',
    name: 'Elementry Level',
    description: 'Basic and everyday idioms',
    color: 'from-green-400 to-green-600',
    icon: '🌱'
  },
  {
    id: 'intermediate', 
    name: 'Intermediate Level',
    description: 'Intermediate and practical idioms',
    color: 'from-blue-400 to-blue-600',
    icon: '📚'
  },
  {
    id: 'advanced',
    name: 'Advanced Level', 
    description: 'Advanced and specialized idioms',
    color: 'from-purple-400 to-purple-600',
    icon: '🎯'
  }
]

export default function LevelSelection({ onLevelSelect }: LevelSelectionProps) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 font-interVariable">
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Choose Your Learning Level
        </h1>
        <p className="text-lg text-gray-600">
          Select the appropriate level to get started
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {levels.map((level, index) => (
          <LevelCard
            key={level.id}
            level={level}
            index={index}
            onSelect={onLevelSelect}
          />
        ))}
      </div>

      {/* Additional Info */}
      <motion.div 
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <p className="text-gray-500 text-sm">
          Each level contains different lessons and idioms appropriate for that level
        </p>
      </motion.div>
    </div>
  )
}
