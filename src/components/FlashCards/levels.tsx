import React from "react";

interface typesInput {
    level: 'elementry' | 'intermediate' | 'advanced'
}

export default function LevelComponent({level}: typesInput) {
    return (
        <div className="flex-1 border capitalize">{level}</div>
    )
}