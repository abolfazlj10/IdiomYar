'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import ProgressBar from '@/components/ui/progress-bar'
import LevelBadge from '@/components/ui/level-badge'

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
        y: -4, 
        scale: 1.02,
        transition: { 
          duration: 0.3,
          ease: "easeInOut"
        }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="relative group cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-visible transition-all duration-300 ease-out"
        onClick={() => onSelect(level.id)}
        whileHover={{ 
          boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.12)",
          borderColor: "rgb(156, 163, 175)",
          y: -4
        }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        {/* Subtle Background */}
        <motion.div 
          className="absolute inset-0 bg-gray-50/30"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
        />
        
        {/* Level Badge */}
        <LevelBadge 
          levelId={level.id}
          color={level.color}
          animationDelay={0.4 + (index * 0.1)}
        />

        {/* Card Content */}
        <div className="relative p-8 pt-12 text-center">
          {/* Icon */}
          <motion.div 
            className="mb-6 flex justify-center"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={`/icon/${level.icon}`}
              alt={`${level.name} icon`}
              width={64}
              height={64}
              className="text-gray-600"
            />
          </motion.div>
          
          {/* Level Name */}
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {level.name}
          </h3>
          
          {/* Progress Bar */}
          <ProgressBar 
            percentage={level.id === 'elementary' ? 25 : level.id === 'intermediate' ? 60 : 90}
            color={level.color}
            animationDelay={0.3 + (index * 0.1)}
          />
          
          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            {level.description}
          </p>
          
          {/* Select Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              Get Started
            </Button>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <motion.div 
          className="absolute top-6 right-6 w-3 h-3 bg-gray-300 rounded-full"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.4,
            delay: 0.8 + (index * 0.1)
          }}
        />
        <motion.div 
          className="absolute bottom-6 left-6 w-2 h-2 bg-gray-200 rounded-full"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.4,
            delay: 1.0 + (index * 0.1)
          }}
        />
      </motion.div>
    </motion.div>
  )
}
