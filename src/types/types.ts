export type Idiom = {
    english_phrase: string;
    persian_phrase_meaning?: string | null;
    english_definition?: string | null;
    persian_definition_meaning?: string | null;
    english_explanation?: string | null;
    persian_explanation_meaning?: string | null;
    examples?: Array<{
        english_text: string;
        persian_meaning: string;
    }>;
}
export type Lesson = {
    lesson_number: number;
    lesson_name?: string;
    idioms: Idiom[];
}
export type LevelData = {
    level_name?: string;
    lessons: Lesson[]
}
export type Book= {
    levels: LevelData[];
}
export type LevelId = 'elementary' | 'intermediate' | 'advanced'
export type Level = 'elementry' | 'intermediate' | 'advanced'

export type LevelArray = Level[]
export type colorLevel = {
    elementry: string;
    intermediate: string;
    advanced: string;
}
