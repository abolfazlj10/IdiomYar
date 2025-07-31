import { TbBoxMultiple1,TbBoxMultiple2, TbBoxMultiple3 } from "react-icons/tb";
import React from "react";
import { Level } from "@/types/types";

interface typesInput {
    levels: Level;
    handleSelect: (value: Level) => void;
    selectedLevel: Level
}

export default function LevelComponent({levels,handleSelect,selectedLevel}: typesInput) {

    const iconEachLevel = {
        elementry : <TbBoxMultiple1 />,
        intermediate : <TbBoxMultiple2 />,
        advanced : <TbBoxMultiple3 />,
    }

    const setEachLevelStyle = () :string => {
        let allStylesLevel = 'flex flex-col justify-between items-start capitalize border-2 shadow-lg hover:shadow-2xl hover:-translate-y-1.5 p-5 rounded-lg h-[200px] cursor-pointer duration-300'
        
        if(levels == 'elementry')
            allStylesLevel += ' hover:border-green-400 hover:shadow-green-300'
        else if(levels == 'intermediate')
            allStylesLevel += ' hover:border-blue-400 hover:shadow-blue-300'
        else
            allStylesLevel += ' hover:border-red-400 hover:shadow-red-300'

        if(selectedLevel == 'elementry' && levels == 'elementry')
            allStylesLevel += ' border-green-400 bg-green-300 shadow-green-300'
        else if(selectedLevel == 'intermediate' && levels == 'intermediate')
            allStylesLevel += ' border-blue-400 bg-blue-300 shadow-blue-300'
        else if(selectedLevel == 'advanced' && levels == 'advanced')
            allStylesLevel += ' border-red-400 bg-red-300 shadow-red-300'
        
        return allStylesLevel
    }
    return (
        <div onClick={() => handleSelect(levels)} className={setEachLevelStyle()}>
            <div className="p-2 rounded text-3xl px-2 py-1 border border-gray-400/10">{iconEachLevel[levels]}</div>
            <div className="text-xl font-semibold">{levels}</div>
            <div className="text-gray-500">description</div>
        </div>
    )
}