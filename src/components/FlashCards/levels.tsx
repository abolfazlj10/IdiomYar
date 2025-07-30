import { TbBoxMultiple1,TbBoxMultiple2, TbBoxMultiple3 } from "react-icons/tb";
import React from "react";
import { Level } from "@/types/types";

interface typesInput {
    levels: Level;
    handleSelect: (value: Level) => void;
    selectedLevel: Level
}

export default function LevelComponent({levels,handleSelect,selectedLevel}: typesInput) {
    return (
        <div onClick={() => handleSelect(levels)} className={`flex flex-col justify-between items-start capitalize border-2 shadow-lg hover:shadow-2xl hover:-translate-y-1.5 p-5 rounded-lg h-[200px] cursor-pointer duration-300 ${levels === 'elementry' && 'hover:border-green-400'} ${levels === 'intermediate' && 'hover:border-blue-400'} ${levels === 'advanced' && 'hover:border-red-400'}`}>
            <div className="p-2 rounded border text-3xl"><TbBoxMultiple1 /></div>
            <div className="text-xl font-semibold">{levels}</div>
            <div className="text-gray-400">description</div>
        </div>
    )
}