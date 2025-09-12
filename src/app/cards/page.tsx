
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

const levels: Level[] = [
  {
    id: 'elementary',
    name: 'Beginner Level',
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

export default function Cards() {
  const handleLevelSelect = (levelId: string) => {
    console.log('Selected level:', levelId)
    // TODO: Navigate to lesson selection for this level
  }

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
          <motion.div
            key={level.id}
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
              onClick={() => handleLevelSelect(level.id)}
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