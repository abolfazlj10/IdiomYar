'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface Level {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

interface LevelCardProps {
  level: Level
  index: number
  onSelect: (levelId: string) => void
}

export default function LevelCard({ level, index, onSelect }: LevelCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.2,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -8, 
        scale: 1.05,
        transition: { 
          duration: 0.4,
          ease: "easeInOut"
        }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="relative group cursor-pointer bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden transition-all duration-300 ease-out"
        onClick={() => onSelect(level.id)}
        whileHover={{ 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          borderColor: "rgb(229, 231, 235)"
        }}
        transition={{ 
          duration: 0.4,
          ease: "easeInOut"
        }}
      >
        {/* Gradient Background */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${level.color}`}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.1 }}
          transition={{ 
            duration: 0.5,
            ease: "easeInOut"
          }}
        />
        
        {/* Card Content */}
        <div className="relative p-8 text-center">
          {/* Icon */}
          <motion.div 
            className="text-6xl mb-6"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            {level.icon}
          </motion.div>
          
          {/* Level Name */}
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {level.name}
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {level.description}
          </p>
          
          {/* Select Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className={`w-full bg-gradient-to-r ${level.color} text-white font-semibold py-3`}
            >
              Select This Level
            </Button>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <motion.div 
          className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent rounded-full"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ 
            duration: 0.6,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-tr from-white/20 to-transparent rounded-full"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ 
            duration: 0.6,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </motion.div>
  )
}
