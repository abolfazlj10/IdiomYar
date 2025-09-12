
'use client'

import LevelSelection from '@/components/FlashCards/LevelSelection'

export default function Cards() {
  const handleLevelSelect = (levelId: string) => {
    console.log('Selected level:', levelId)
    // TODO: Navigate to lesson selection for this level
  }

  return <LevelSelection onLevelSelect={handleLevelSelect} />
}