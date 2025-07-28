'use client'
import { useState } from "react";
import LevelComponent from "./levels";
// ________ ts types ________
import type { Book, Level, LevelArray } from "@/types/types";
// __________ jsons the Book __________
import elementry from '../../data/book/elementry.json'
import intermediate from '../../data/book/intermediate.json'
import advanced from '../../data/book/advanced.json'


interface typeColors {
    elementry: 'bg-green-400'
    intermediate: 'bg-blue-400'
    advanced: 'bg-red-400'
}

export default function SelectionStep () {
    const [books] = useState<Record<Level,Book>>({'elementry':elementry,'intermediate':intermediate,'advanced':advanced})
    const [colors] = useState<typeColors>({
        elementry: 'bg-green-400',
        intermediate: 'bg-blue-400',
        advanced: 'bg-red-400'
    })
    return (
        <div className="flex h-full p-2">
            <div className="flex-2 flex flex-col gap-2">
                {Object.keys(books).map((levelInp, idx) => (
                    <LevelComponent key={idx} level={levelInp as Level} />
                ))}
            </div>
            <div className="flex-5">lessons</div>
        </div>
    )
}