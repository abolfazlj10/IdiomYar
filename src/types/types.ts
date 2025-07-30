export type Idiom = {
    english_phrase: string;
    meaning?: string;
    example?: string;
}
export type Lesson = {
    lesson_number: number;
    idioms: Idiom[];
}
export type LevelData = {
    lessons: Lesson[]
}
export type Book= {
    levels: LevelData[];
}
export type Level = 'elementry' | 'intermediate' | 'advanced'

export type LevelArray = Level[]
export type colorLevel = {
    elementry: string;
    intermediate: string;
    advanced: string;
}