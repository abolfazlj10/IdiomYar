import { useEffect } from "react"

interface inputTypes {
    lessonNum: number
}
export default function Lesson ({lessonNum}: inputTypes) {
    
    return (
        <div className="border h-[150px] p-4 rounded-xl shadow">Lesson {lessonNum}</div>
    )
}