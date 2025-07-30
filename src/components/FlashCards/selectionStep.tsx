'use client'
import { useEffect, useState } from "react";
import LevelComponent from "./levels";
// ________ ts types ________
import type { Book, Level } from "@/types/types";
// __________ jsons the Book __________
import elementry from '../../data/book/elementry.json'
import intermediate from '../../data/book/intermediate.json'
import advanced from '../../data/book/advanced.json'
import Lesson from "./lesson";

export default function SelectionStep () {
    const [books] = useState<Record<Level,Book>>({'elementry':elementry,'intermediate':intermediate,'advanced':advanced})
    const [selectedLevel,setSelectedLevel] = useState<Level>('elementry')

    return (
        <div className="h-full flex flex-1 p-4 gap-5">
            <div className="h-full flex-1 flex flex-col gap-5 border-r pr-10">
                {Object.keys(books).map((levelInp, idx) => (
                    <LevelComponent key={idx} levels={levelInp as Level} handleSelect={setSelectedLevel} selectedLevel={selectedLevel} />
                ))}
            </div>
            <div className="flex-5 flex flex-col">
                <div className="grid grid-cols-5 content-start items-start gap-4 p-4 rounded-xl">
                    {books[selectedLevel]?.levels[0]?.lessons.map((item: any,idx: number)=>(
                        <Lesson key={idx} lessonNum={item.lesson_number} />
                    ))}                    
                </div>
                <button className="mt-auto ml-auto w-max cursor-pointer shadow-lg text-xl font-semibold px-4 py-2 rounded-lg border bg-primaryColor text-white duration-100 hover:scale-105 hover:shadow-xl ">next step</button>
            </div>
        </div>
    )
}