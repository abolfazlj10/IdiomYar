import { TbBoxMultiple1,TbBoxMultiple2, TbBoxMultiple3 } from "react-icons/tb";
import React from "react";
import { Level } from "@/types/types";

interface typesInput {
    levels: Level;
    handleSelect: (value: Level) => void
}

export default function LevelComponent({levels,handleSelect}: typesInput) {
    return (
        <div onClick={() => handleSelect(levels)} className={`flex-1 capitalize hover border cursor-pointer border-gray-500 p-2 rounded-xl bg-gray-300`}>
            {levels}
        </div>
    )
}