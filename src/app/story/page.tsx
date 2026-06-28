'use client'
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
// ________ ts types ________
import type { Book, Level, LevelArray } from "@/types/types";
// __________ jsons the Book __________
import elementry from '../../data/book/elementry.json'
import intermediate from '../../data/book/intermediate.json'
import advanced from '../../data/book/advanced.json'
// _______ icons _______
import { TbBoxMultiple1,TbBoxMultiple2, TbBoxMultiple3 } from "react-icons/tb";
import { TbTimeline } from "react-icons/tb";
import { FaSpinner , FaCheck } from "react-icons/fa";
import Appbar from "@/components/appbar";
import SideBarDetail from '@/components/story/sidebar'
import Stepper from "@/components/story/stepper"
import ResultStory from "@/components/story/result";
import { useScrollFade } from "@/hooks/useScrollFade";
import { useStoryGenerator } from "@/hooks/useStory";
import { addStory } from "@/lib/storage";
import { toast } from 'react-hot-toast';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

export default function Story () {

    const router = useRouter();
    
    const [books] = useState<Record<Level,Book>>({'elementry':elementry,'intermediate':intermediate,'advanced':advanced})
    const [level,setLevel] = useState<LevelArray>(['elementry'])
    const [lessons,setLessons] = useState<Array<number>>([])
    const [currentViewingLesson, setCurrentViewingLesson] = useState<number | null>(null)
    const scroller = useRef<HTMLDivElement | null>(null)
    const mobileScroller = useRef<HTMLDivElement | null>(null)
    const [steper,setSteper] = useState<number>(1)
    const [words,setWords] = useState<Array<string>>([])
    const [wordLevels, setWordLevels] = useState<Record<string, Level>>({})
    const [wordLessons, setWordLessons] = useState<Record<string, number>>({})
    const [currentSelectedLevel, setCurrentSelectedLevel] = useState<Level>('elementry')
    const [information, setInformation] = useState<string>("");
    const [loadingStory, setLoadingStory] = useState<boolean>(false);
    const [showStory, setShowStory] = useState<boolean>(false);
    const [isLargeScreen, setIsLargeScreen] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState(false)
    const [story, setStory] = useState<string>("");
    const [storyFa, setStoryFa] = useState<string>("");
    const [storyEn, setStoryEn] = useState<string>("");
    const {mutate: storyCreator} = useStoryGenerator()

    const scrollFade = useScrollFade();


    const selectLevel = (theLevel: Level): void => {
        setCurrentSelectedLevel(theLevel)
        setLevel([theLevel])
        setLessons([])
        setCurrentViewingLesson(null)
        setWords([])
        setWordLevels({})
        setWordLessons({})
        setSteper(1)
    }

    const selectLesson = (lessonNumber: number): void => {
        const lesson = books[currentSelectedLevel]?.levels[0]?.lessons.find((item: any) => item.lesson_number === lessonNumber)
        const lessonWords = lesson?.idioms.map((item: any) => item.english_phrase).filter(Boolean) ?? []
        const nextWordLevels = Object.fromEntries(lessonWords.map((word: string) => [word, currentSelectedLevel])) as Record<string, Level>
        const nextWordLessons = Object.fromEntries(lessonWords.map((word: string) => [word, lessonNumber])) as Record<string, number>

        setCurrentViewingLesson(lessonNumber)
        setLessons([lessonNumber])
        setLevel([currentSelectedLevel])
        setWords(lessonWords)
        setWordLevels(nextWordLevels)
        setWordLessons(nextWordLessons)
    }

    const StoryCreator = async (): Promise<void> => {
        setLoadingStory(true);
        setStory("");
        setStoryFa("");
        setStoryEn("");
        setShowStory(false);
        
        storyCreator({
            idioms: words,
            information: information
        }, {
            onSuccess: (data: any) => {
                if (data && data.status) {
                    setStory(data.story || "");
                    setStoryFa(data.storyFa || "");
                    setStoryEn(data.storyEn || "");
                    setShowStory(true);
                    addStory({
                        idioms: words,
                        information,
                        story: data.story || "",
                        storyFa: data.storyFa || "",
                        storyEn: data.storyEn || "",
                    });
                    toast.success("Story saved to Archive.");
                } else {
                    setStory(data?.error || data?.story || "Story creation failed.");
                    setStoryFa("");
                    setStoryEn("");
                    toast.error(data?.error || "Story creation failed. Please try again.");
                }
                setLoadingStory(false);
            },
            onError: (err: any) => {
                setStory("Error generating story: " + (err && err.message ? err.message : "Unknown error"));
                setStoryFa("");
                setStoryEn("");
                toast.error("Story creation failed. Please try again.");
                setLoadingStory(false);
            }
        });
    }
    
    useEffect(() => {
        if(scroller.current){
            scroller.current?.scrollTo(0,0)
            mobileScroller.current?.scrollTo(0,0)
        }
    }, [currentSelectedLevel]);

    useEffect(()=>{
        if(words.length != 0)
            setSteper(3)
        else if(words.length == 0 && lessons.length != 0)
            setSteper(2)
        else
            setSteper(1)
    },[lessons, words])

    const NewStorySetting = () => {
        // Reset all story-related data
        setShowStory(false)
        setStory("")
        setStoryFa("")
        setStoryEn("")
        setLoadingStory(false)
        
        // Reset all selection data
        setWords([])
        setWordLevels({})
        setWordLessons({})
        setLessons([])
        setLevel(['elementry'])
        setCurrentSelectedLevel('elementry')
        setCurrentViewingLesson(null)
        setInformation("")
        setSteper(1)
        
        // Reset scroll positions
        if (scroller.current) {
            scroller.current.scrollTo(0, 0)
        }
        if (mobileScroller.current) {
            mobileScroller.current.scrollTo(0, 0)
        }
    }

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1280px)');
        const handleChange = (e: MediaQueryListEvent) => setIsLargeScreen(e.matches);

        setIsLargeScreen(mediaQuery.matches);
        
        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    const hasSelectedLesson = words.length > 0;

    return(
        <div className="min-h-[calc(100dvh-2rem)] min-w-0 overflow-y-auto pb-4 pt-2 max-mobile:min-h-dvh max-mobile:overflow-visible">
            <div className="flex h-full min-w-0 flex-col gap-3 max-mobile:h-auto">
                {showStory ? (
                    <ResultStory isShow={setShowStory} newStory={NewStorySetting} theStory={story} storyPersian={storyFa} storyEnglish={storyEn}  />
                ) : (
                    <>
                        <Appbar onBackClick={()=> router.push('/')} title='Story Creator' iconSrc="/icon/Otter.svg" rightButton={isLargeScreen ? false : <button type="button" aria-label="Open story timeline" className="min-h-10 rounded-lg border border-border bg-white p-2 text-xl text-slate-700 shadow-sm transition-colors duration-150 hover:bg-accent max-tablet:text-lg max-tablet:px-2 max-tablet:py-[6px]" onClick={()=>setDialogOpen(true)}><TbTimeline /></button>}/>
                        <Stepper steper={steper} />
                        <div className="grid desktop:grid-cols-[7fr_2fr] max-desktop:grid-cols-none gap-3 flex-1 max-[1500px]:gap-3 max-laptop:gap-0">
                            {/* Level - Lessons - Words */}
                            <div ref={scrollFade} className={`flex flex-col gap-5 max-desktop:gap-5 overflow-hidden max-laptop:overflow-y-scroll max-tablet:min-h-[200px] fade-bottom`}>
                                {/* desktop => Level Selection */}
                                <div className="flex flex-col gap-3 max-mobile:px-0">
                                    <div className="flex flex-col gap-1 max-laptop:gap-1 select-none px-2 max-mobile:px-0">
                                        <div className="text-2xl max-laptop:text-lg max-tablet:text-base font-semibold">Select Level</div>
                                        <div className="text-gray-400 text-sm max-laptop:text-xs max-tablet:text-xs">Choose a level, then select one lesson. All idioms from that lesson are included automatically.</div>
                                    </div>
                                    <div className="flex gap-10 px-2 max-mobile:px-0 max-mobile:pr-2 max-[2000px]:gap-3 max-tablet:gap-3 max-laptop:flex-col">
                                        <div onClick={()=> selectLevel('elementry')} className={`border-2 max-laptop:border-2 flex-1 p-6 max-laptop:py-4 max-[2000px]:p-4 max-[1500px]:py-2 max-tablet:py-2 max-tablet:px-2 rounded-xl shadow-lg flex flex-col max-laptop:grid max-laptop:grid-cols-[auto_8fr] gap-5 max-[2000px]:gap-3 items-start duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl relative ${currentSelectedLevel === 'elementry' ? 'border-green-400' : 'border-gray-300 hover:border-green-300'}`}>
                                            {currentSelectedLevel === 'elementry' && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 max-tablet:w-4 max-tablet:h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs">✓</span>
                                                </div>
                                            )}
                                            <div className="text-3xl max-tablet:text-3xl max-mobile:lg px-2 py-1 border border-gray-400/10 rounded-lg"><TbBoxMultiple1 /></div>
                                            <div className="text-base font-semibold flex select-none items-center gap-2 max-laptop:flex-col max-laptop:gap-1 max-laptop:hidden"><span>Elementary</span><span className="text-2xs text-blue-400 max-[1340px]:text-xs">{elementry.levels[0].lessons.length} lessons</span></div>
                                            <div className="text-gray-400 max-[2000px]:text-xs max-[1315px]:text-sm max-laptop:mt-auto max-laptop:hidden">Core idioms for everyday situations.</div>
                                            <div className="min-laptop:hidden flex flex-col gap-2 max-tablet:gap-1">
                                                <div className="font-semibold grid grid-cols-[auto_1fr] gap-4 items-center select-none text-lg max-tablet:text-base max-mobile:text-sm"><span>Elementary</span><span className="text-sm text-blue-400 max-[1340px]:text-xs max-tablet:text-[10px]">{elementry.levels[0].lessons.length} lessons</span></div>
                                                <div className="text-gray-400 max-laptop:text-sm max-tablet:text-xs">Core idioms for everyday situations.</div>
                                            </div>
                                        </div>
                                        <div onClick={()=> selectLevel('intermediate')} className={`border-2 max-laptop:border-2 flex-1 p-6 max-laptop:py-4 max-[2000px]:p-4 max-[1500px]:py-2 max-tablet:py-2 max-tablet:px-2 rounded-xl shadow-lg flex flex-col max-laptop:grid max-laptop:grid-cols-[auto_8fr] gap-5 max-[2000px]:gap-3 items-start duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl relative ${currentSelectedLevel === 'intermediate' ? 'border-blue-400' : 'border-gray-300 hover:border-blue-300'}`}>
                                            {currentSelectedLevel === 'intermediate' && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 max-tablet:w-4 max-tablet:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs">✓</span>
                                                </div>
                                            )}
                                            <div className="text-3xl max-tablet:text-3xl max-mobile:lg px-2 py-1 border border-gray-400/10 rounded-lg"><TbBoxMultiple2 /></div>
                                            <div className="text-base font-semibold flex select-none items-center gap-2 max-laptop:flex-col max-laptop:gap-1 max-laptop:hidden"><span>Intermediate</span><span className="text-2xs text-blue-400 max-[1340px]:text-xs">{intermediate.levels[0].lessons.length} lessons</span></div>
                                            <div className="text-gray-400 max-[2000px]:text-xs max-[1315px]:text-sm max-laptop:mt-auto max-laptop:hidden">Practical idioms for richer expression.</div>
                                            <div className="min-laptop:hidden flex flex-col gap-2 max-tablet:gap-1">
                                                <div className="font-semibold grid grid-cols-[auto_1fr] gap-4 items-center select-none text-lg max-tablet:text-base max-mobile:text-sm"><span>Intermediate</span><span className="text-sm text-blue-400 max-[1340px]:text-xs max-tablet:text-[10px]">{intermediate.levels[0].lessons.length} lessons</span></div>
                                                <div className="text-gray-400 max-laptop:text-sm max-tablet:text-xs">Practical idioms for richer expression.</div>
                                            </div>
                                        </div>
                                        <div onClick={()=> selectLevel('advanced')} className={`border-2 max-laptop:border-2 flex-1 p-6 max-laptop:py-4 max-[2000px]:p-4 max-[1500px]:py-2 max-tablet:py-2 max-tablet:px-2 rounded-xl shadow-lg flex flex-col max-laptop:grid max-laptop:grid-cols-[auto_8fr] gap-5 max-[2000px]:gap-3 items-start duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl relative ${currentSelectedLevel === 'advanced' ? 'border-red-400' : 'border-gray-300 hover:border-red-300'}`}>
                                            {currentSelectedLevel === 'advanced' && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 max-tablet:w-4 max-tablet:h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs">✓</span>
                                                </div>
                                            )}
                                            <div className="text-3xl max-tablet:text-3xl max-mobile:lg px-2 py-1 border border-gray-400/10 rounded-lg"><TbBoxMultiple3 /></div>
                                            <div className="text-base font-semibold flex select-none items-center gap-2 max-laptop:flex-col max-laptop:gap-1 max-laptop:hidden"><span>Advanced</span><span className="text-2xs text-blue-400 max-[1340px]:text-xs">{advanced.levels[0].lessons.length} lessons</span></div>
                                            <div className="text-gray-400 max-[2000px]:text-xs max-[1315px]:text-sm max-laptop:mt-auto max-laptop:hidden">Nuanced idioms for confident fluency.</div>
                                            <div className="min-laptop:hidden flex flex-col gap-2 max-tablet:gap-1">
                                                <div className="font-semibold grid grid-cols-[auto_1fr] gap-4 items-center select-none text-lg max-tablet:text-base max-mobile:text-sm"><span>Advanced</span><span className="text-sm text-blue-400 max-[1340px]:text-xs max-tablet:text-[10px]">{advanced.levels[0].lessons.length} lessons</span></div>
                                                <div className="text-gray-400 max-laptop:text-sm max-tablet:text-xs">Nuanced idioms for confident fluency.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* desktop => Lesson idioms preview  */}
                                <div className="flex flex-col gap-3 flex-1 overflow-hidden max-tablet:overflow-visible px-2 max-mobile:px-0 max-tablet:min-h-[300px] max-mobile:min-h-auto">
                                    {/* desktop => title Lesson Idioms */}
                                    <div className="flex flex-col gap-1 max-laptop:gap-1 select-none">
                                        <div className="text-2xl max-laptop:text-lg max-tablet:text-base font-semibold">Select Lesson</div>
                                        <div className="text-gray-400 text-sm max-laptop:text-base max-tablet:text-xs">Pick a lesson to include all of its idioms in your story.</div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-100 rounded-full h-[6px] max-laptop:h-1 shadow-inner border border-gray-200">
                                                <div 
                                                    className="h-[6px] max-laptop:h-1 rounded-full transition-all duration-500 ease-out shadow-sm bg-gradient-to-r from-bgColor to-primaryColor/100"
                                                    style={{ 
                                                        width: hasSelectedLesson ? "100%" : "0%",
                                                        boxShadow: hasSelectedLesson
                                                            ? "0 0 12px rgba(92, 107, 236, 0.3)"
                                                            : 'none'
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="flex flex-col items-center min-w-[60px]">
                                                <span className="text-xs max-tablet:text-xs font-bold text-primaryColor/80">{words.length}</span>
                                                <span className="text-2xs max-tablet:text-[9px] font-medium text-gray-500">
                                                    {hasSelectedLesson ? 'Auto included' : 'Choose lesson'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* desktop => Lesson list - Words list */}
                                    <div className="hidden mobile:flex flex-1 max-tablet:min-h-[200px] max-mobile:max-h-[300px] bg-white/20 backdrop-blur-sm border border-primaryColor/20 rounded-xl shadow-lg px-2 py-4 overflow-hidden gap-5 mb-5">
                                        <div ref={scroller} className="scroll-smooth overflow-y-auto h-full max-h-[300px] w-3/12 max-[1800px]:w-4/12 max-[1440px]:w-full max-[1440px]:flex-1 max-desktop:flex-none max-desktop:w-4/12 customScrollBarStyle" dir="rtl">
                                            <div className="h-full w-full grid grid-cols-2 max-[892px]:grid-cols-1 gap-2 p-2" dir="ltr">
                                                {books[currentSelectedLevel]?.levels[0]?.lessons.map((item: any,index: number)=>(
                                                    (() => {
                                                        // پیدا کردن سطح درس
                                                        let lessonLevel: Level = 'elementry';
                                                        for (const levelKey of Object.keys(books) as Level[]) {
                                                            const found = books[levelKey]?.levels[0]?.lessons.some((lesson: any) => lesson.lesson_number === item.lesson_number);
                                                            if (found) {
                                                                lessonLevel = levelKey;
                                                                break;
                                                            }
                                                        }
                                                        // تعیین کلاس‌های انتخاب‌شده بر اساس سطح
                                                        const selectedBg = lessonLevel === 'elementry' ? 'bg-green-100' : lessonLevel === 'intermediate' ? 'bg-blue-100' : 'bg-red-100';
                                                        const selectedBorder = lessonLevel === 'elementry' ? 'border-green-400' : lessonLevel === 'intermediate' ? 'border-blue-400' : 'border-red-400';
                                                        const selectedText = lessonLevel === 'elementry' ? 'text-green-700' : lessonLevel === 'intermediate' ? 'text-blue-700' : 'text-red-700';
                                                        const selectedDot = lessonLevel === 'elementry' ? 'bg-green-500' : lessonLevel === 'intermediate' ? 'bg-blue-500' : 'bg-red-500';
                                                        return (
                                                            <div dir="ltr" onClick={() => selectLesson(item.lesson_number)}
                                                                className={`border-1 rounded-lg pl-3 py-2 select-none bg-white/20 backdrop-blur-sm hover:bg-white/40 cursor-pointer duration-200 flex flex-col items-start gap-1 transition-all
                                                                    ${lessons.includes(item.lesson_number)
                                                                        ? lessonLevel === 'elementry'
                                                                            ? 'border-green-400'
                                                                            : lessonLevel === 'intermediate'
                                                                                ? 'border-blue-400'
                                                                                : 'border-red-400'
                                                                        : 'border-gray-200/40'}
                                                                    ${currentViewingLesson === item.lesson_number ? `${selectedBg} ${selectedBorder} shadow-md scale-[1.04] ${selectedText} border-2` : ''}
                                                                `}
                                                                style={{ fontWeight: 500 }}
                                                                key={index}
                                                            >
                                                                <div className="flex items-center gap-[6px]">
                                                                    <span className={`w-[6px] h-[6px] rounded-full inline-block ${lessonLevel === 'elementry' ? 'bg-green-300' : ''} ${lessonLevel === 'intermediate' ? 'bg-blue-300' : ''} ${lessonLevel === 'advanced' ? 'bg-red-300' : ''} ${currentViewingLesson === item.lesson_number ? selectedDot : ''}`}></span>
                                                                    <span className="text-sm max-[1440px]:text-xs font-semibold">Lesson {item.lesson_number}</span>
                                                                </div>
                                                                <div className="text-2xs text-gray-400">{item.idioms.length} idioms</div>
                                                            </div>
                                                        );
                                                    })()
                                                ))}
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 flex-2 space-y-3 border-l-2 border-bgColor max-desktop:py-0">
                                            {currentViewingLesson !== null ? 
                                                <div ref={scrollFade} className="space-y-3 h-full flex flex-col overflow-y-auto fade-bottom customScrollBarStyle">
                                                    <div className="text-sm max-desktop:text-sm max-[1440px]:hidden desktop:block max-desktop:hidden font-semibold text-gray-600 border-b pb-2">
                                                        Lesson {currentViewingLesson}
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 overflow-y-auto desktop:flex-none p-2 pb-5 customScrollBarStyle">
                                                        {(() => {
                                                            const lessonIndex = books[currentSelectedLevel]?.levels[0]?.lessons.findIndex((lesson: any) => lesson.lesson_number === currentViewingLesson)
                                                            return lessonIndex !== -1 ? 
                                                                books[currentSelectedLevel]?.levels[0]?.lessons[lessonIndex]?.idioms.map((item: any, key: number) => {
                                                                    return (
                                                                        <div 
                                                                            className="text-sm max-[1440px]:text-xs select-none font-bold shadow border-2 transition-all duration-200 rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 bg-primaryColor/10 text-primaryColor border-primaryColor/40"
                                                                            key={key}
                                                                            title="Included automatically from the selected lesson."
                                                                        >
                                                                            {item.english_phrase}
                                                                            <FaCheck className="text-xs max-[1440px]:text-xs" />
                                                                        </div>
                                                                    )
                                                                })
                                                            : []
                                                        })()}
                                                    </div>
                                                </div>
                                            : 
                                                <div className="h-full flex items-center justify-center text-xs">Select a lesson to see its idioms.</div>
                                            }
                                        </div>
                                    </div>
                                    {/* mobile => Lesson - Words Selection */}
                                    <div className="mobile:hidden flex-1 flex flex-col gap-5 overflow-hidden">
                                        <div ref={mobileScroller} className={`flex-1 grid grid-cols-3 gap-2 max-h-[200px] min-h-[200px] overflow-y-scroll border rounded-xl p-2 scroll-smooth customScrollBarStyle`}>
                                            {books[currentSelectedLevel]?.levels[0]?.lessons.map((item: any,index: number)=>(
                                                    (() => {
                                                        // پیدا کردن سطح درس
                                                        let lessonLevel: Level = 'elementry';
                                                        for (const levelKey of Object.keys(books) as Level[]) {
                                                            const found = books[levelKey]?.levels[0]?.lessons.some((lesson: any) => lesson.lesson_number === item.lesson_number);
                                                            if (found) {
                                                                lessonLevel = levelKey;
                                                                break;
                                                            }
                                                        }
                                                        // تعیین کلاس‌های انتخاب‌شده بر اساس سطح
                                                        const selectedBg = lessonLevel === 'elementry' ? 'bg-green-100' : lessonLevel === 'intermediate' ? 'bg-blue-100' : 'bg-red-100';
                                                        const selectedBorder = lessonLevel === 'elementry' ? 'border-green-400' : lessonLevel === 'intermediate' ? 'border-blue-400' : 'border-red-400';
                                                        const selectedText = lessonLevel === 'elementry' ? 'text-green-700' : lessonLevel === 'intermediate' ? 'text-blue-700' : 'text-red-700';
                                                        const selectedDot = lessonLevel === 'elementry' ? 'bg-green-500' : lessonLevel === 'intermediate' ? 'bg-blue-500' : 'bg-red-500';
                                                        return (
                                                            <div dir="ltr" onClick={() => selectLesson(item.lesson_number)}
                                                                className={`border rounded-lg pl-3 py-2 select-none bg-white/20 backdrop-blur-sm hover:bg-white/40 cursor-pointer duration-200 flex flex-col items-start gap-1 transition-all
                                                                    ${lessons.includes(item.lesson_number)
                                                                        ? lessonLevel === 'elementry'
                                                                            ? 'border-green-400'
                                                                            : lessonLevel === 'intermediate'
                                                                                ? 'border-blue-400'
                                                                                : 'border-red-400'
                                                                        : 'border-gray-200/40'}
                                                                    ${currentViewingLesson === item.lesson_number ? `${selectedBg} ${selectedBorder} shadow-md scale-[1.04] ${selectedText} border-2` : ''}
                                                                `}
                                                                style={{ fontWeight: 500 }}
                                                                key={index}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    <span className={`w-[6px] h-[6px] rounded-full inline-block ${lessonLevel === 'elementry' ? 'bg-green-300' : ''} ${lessonLevel === 'intermediate' ? 'bg-blue-300' : ''} ${lessonLevel === 'advanced' ? 'bg-red-300' : ''} ${currentViewingLesson === item.lesson_number ? selectedDot : ''}`}></span>
                                                                    <span className="text-[12px] font-semibold">Lesson {item.lesson_number}</span>
                                                                </div>
                                                                <div className="text-[9px] text-gray-400">{item.idioms.length} idioms</div>
                                                            </div>
                                                        );
                                                    })()
                                            ))}
                                        </div>
                                        <div className={`flex-1 max-h-[200px] min-h-[200px] overflow-y-scroll border rounded-xl p-2 customScrollBarStyle`}>
                                            {currentViewingLesson !== null ? 
                                                <div className="flex flex-wrap gap-3 desktop:flex-none p-2">
                                                    {(() => {
                                                        const lessonIndex = books[currentSelectedLevel]?.levels[0]?.lessons.findIndex((lesson: any) => lesson.lesson_number === currentViewingLesson)
                                                        return lessonIndex !== -1 ? 
                                                            books[currentSelectedLevel]?.levels[0]?.lessons[lessonIndex]?.idioms.map((item: any, key: number) => {
                                                                return (
                                                                    <div 
                                                                        className="text-xs select-none font-bold shadow border-2 transition-all duration-200 rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 bg-primaryColor/10 text-primaryColor border-primaryColor/40"
                                                                        key={key}
                                                                        title="Included automatically from the selected lesson."
                                                                    >
                                                                        {item.english_phrase}
                                                                        <FaCheck className="text-2xs" />
                                                                    </div>
                                                                )
                                                            })
                                                        : []
                                                    })()}
                                                </div>
                                            : 
                                                <div className="h-full flex items-center justify-center max-desktop:text-sm max-laptop:text-xs">Select a lesson to see its idioms.</div>
                                            }
                                        </div>
                                    </div>
                                </div>
                                {/* mobile => input infomation * bottom selection lesson words */}
                                <div className="mx-2 desktop:hidden">
                                    <div className="select-none px-2 max-mobile:px-0 mb-3 max-laptop:mb-1">
                                        <div className="text-[30px] max-laptop:text-[25px] max-tablet:text-base font-semibold">Story Details</div>
                                    </div>
                                    <textarea
                                        className="border min-h-[100px] max-tablet:min-h-0 w-full rounded-xl p-2 outline-0 text-sm placeholder:max-tablet:text-sm max-tablet:text-sm"
                                        placeholder="Add a topic, setting, or character for the story."
                                        value={information}
                                        onChange={(event) => setInformation(event.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Sidebar Detail */}
                            <SideBarDetail 
                                level={level}
                                lessons={lessons}
                                wordLessons={wordLessons}
                                books={books}
                                words={words}
                                wordLevels={wordLevels}
                                information={information}
                                setInformation={setInformation}
                                loadingStory={loadingStory}
                                StoryCreator={StoryCreator}
                            />
                        </div>
                        {/* mobile - tablet => button create story bootom of information input */}
                        <div className={`desktop:hidden text-[22px] max-tablet:text-lg max-mobile:text-base text-center font-bold mt-auto border rounded-xl max-mobile:rounded-lg py-4 max-tablet:py-3 max-mobile:py-[10px] shadow-xl duration-200 select-none flex justify-center items-center ${
                            loadingStory ? 'bg-gradient-to-br from-primaryColor/50 to-blue-600/50 text-white cursor-default': words.length >= 1 ? 'bg-gradient-to-br from-primaryColor to-blue-600 text-white hover:shadow-2xl hover:scale-105 cursor-pointer' : 'bg-gradient-to-br from-blue-600/60 to-blue-600/60 text-white cursor-not-allowed shadow-none'}`}
                            onClick={() => {
                                if (words.length >= 1 && !loadingStory) {
                                    StoryCreator()
                                }
                            }}
                        >
                            {loadingStory ? <span className="flex items-center gap-2">Generating<FaSpinner className="animate-spin text-2xl" /></span> : 'Create Story ->'}
                        </div>
                        {/* mobile => dialog modal details */}
                        <DialogPrimitive.Root open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogPrimitive.Portal>
                                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                                    <div className="bg-white p-0 rounded-xl border border-gray-400/10 relative overflow-hidden shadow-lg">
                                        <img className="absolute select-none top-1/2 -right-20 z-20 scale-x-150" src="./blob-haikei.svg" />
                                        <img className="absolute select-none top-0 -left-40 z-20 scale-x-150" src="./blob-haikei.svg" />
                                        <div className="bg-white/30 h-full w-full backdrop-blur-2xl z-30 relative pt-7 pb-4 px-6 flex flex-col gap-4">
                                            <DialogPrimitive.Close className="absolute right-3 top-3 border bg-white rounded-lg shadow-lg p-2 cursor-pointer duration-100 hover:bg-bgColor backdrop-blur-2xl">
                                                <XIcon className="size-4" />
                                            </DialogPrimitive.Close>
                                            <div>
                                                <div className="border-3 backdrop-blur-2xl justify-self-start py-1 px-4 font-semibold rounded-xl bg-blue-500/50 -mb-5 -ml-4 z-20 relative select-none text-sm">Levels :</div>
                                                <div className="text-[25px] font-semibold text-center rounded-xl bg-white/20 border py-5 px-5 flex justify-center items-center">
                                                    {level.length > 0 ? (
                                                        <div className="grid grid-cols-2 max-mobile:grid-cols-1 gap-3 w-full">
                                                            {level.map((levelName, index) => {
                                                                const iconColor = levelName === 'elementry' ? 'text-green-600' : levelName === 'intermediate' ? 'text-blue-600' : 'text-red-600';
                                                                const IconComponent = levelName === 'elementry' ? TbBoxMultiple1 : levelName === 'intermediate' ? TbBoxMultiple2 : TbBoxMultiple3;
                                                                const isLastAndOdd = index === level.length - 1 && level.length % 2 !== 0;

                                                                return (
                                                                    <div key={index} className={`px-4 py-3 rounded-xl text-base flex items-center justify-center gap-3 transition-all duration-200 bg-white/20 backdrop-blur-sm border-primaryColor hover:bg-white/40`} style={{ borderWidth: 1 }}>
                                                                        <IconComponent className={`${iconColor} text-2xl`} />
                                                                        <span className="font-semibold text-gray-800">{levelName === "elementry" ? "Elementary" : levelName.charAt(0).toUpperCase() + levelName.slice(1)}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-400 text-sm">No levels selected</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="border-3 backdrop-blur-2xl justify-self-start py-1 px-4 font-semibold rounded-xl bg-blue-500/50 -mb-5 -ml-4 z-20 relative select-none text-sm">Lessons :</div>
                                                <div className="font-semibold text-center rounded-xl bg-white/20 border py-5 px-5 flex justify-center items-center">
                                                    {lessons.length > 0 ? (
                                                        <div className="grid grid-cols-2 gap-3 w-full">
                                                            {lessons.map((lessonNumber, index) => {
                                                                const wordsFromLesson = Object.values(wordLessons).filter(lesson => lesson === lessonNumber).length;
                                                                
                                                                let lessonLevel: Level = 'elementry';
                                                                for (const levelKey of Object.keys(books) as Level[]) {
                                                                    const found = books[levelKey]?.levels[0]?.lessons.some((lesson: any) => lesson.lesson_number === lessonNumber);
                                                                    if (found) {
                                                                        lessonLevel = levelKey;
                                                                        break;
                                                                    }
                                                                }

                                                                const isLastAndOdd = index === lessons.length - 1 && lessons.length % 2 !== 0;
                                                                const badgeClass = lessonLevel === 'elementry' ? 'bg-green-500 text-white' : lessonLevel === 'intermediate' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white';
                                                                const isSemiActive = wordsFromLesson === 0;

                                                                return (
                                                                    <div key={index} className={`relative px-3 py-2 rounded-xl text-sm flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${isLastAndOdd ? 'col-span-2' : ''} ${isSemiActive ? 'bg-white/10 border-primaryColor/40 opacity-70 hover:opacity-100 hover:bg-white/20' : 'bg-white/20 border-primaryColor hover:bg-white/40'}`}
                                                                        style={{ fontWeight: 500, borderWidth: 1 }}
                                                                        title={isSemiActive ? "Select a lesson to include its idioms." : `${wordsFromLesson} idiom(s) included`}
                                                                    >
                                                                        {wordsFromLesson > 0 && (
                                                                            <span className={`absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 w-5 h-5 rounded-full text-[9px] font-semibold z-10 border-2 border-white flex items-center justify-center ${badgeClass}`}>
                                                                                {wordsFromLesson}
                                                                            </span>
                                                                        )}
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`
                                                                                w-[6px] h-[6px] rounded-full inline-block
                                                                                ${lessonLevel === 'elementry' ? 'bg-green-400' : ''}
                                                                                ${lessonLevel === 'intermediate' ? 'bg-blue-400' : ''}
                                                                                ${lessonLevel === 'advanced' ? 'bg-red-400' : ''}
                                                                            `}></span>
                                                                            <span className="text-gray-800">Lesson {lessonNumber}</span>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-400 text-sm">Select lessons to continue</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="border-3 backdrop-blur-2xl justify-self-start py-1 px-4 font-semibold rounded-xl bg-blue-500/50 -mb-5 -ml-4 z-20 relative select-none text-sm">Idioms :</div>
                                                <div
                                                    ref={scrollFade}
                                                    className={`rounded-xl bg-white/20 border py-5 px-5 flex gap-2 flex-wrap overflow-y-auto w-full max-h-[200px] relative customScrollBarStyle customScrollBarStyle`}
                                                >
                                                    {words.length ?
                                                        words.map((item,index)=>{
                                                            const level = wordLevels[item];
                                                            const dot = level === 'elementry' ? 'bg-green-400' : level === 'intermediate' ? 'bg-blue-400' : 'bg-red-400';
                                                            return (
                                                                <div key={index} className={`w-full justify-between py-2 relative rounded-full px-3 flex items-center gap-2 bg-white/20 backdrop-blur-sm border-2 border-primaryColor border-dashed text-gray-800 transition-all duration-150 hover:shadow-sm hover:bg-white/30`}>
                                                                    <span className={`w-[6px] h-[6px] rounded-full inline-block ${dot}`}></span>
                                                                    <span className="font-medium text-xs select-none">{item}</span>
                                                                    <FaCheck className="ml-1 text-primaryColor text-2xs" />
                                                                </div>
                                                            )
                                                        })
                                                        :
                                                        <div className="m-auto text-gray-400 text-sm">Select a lesson to include its idioms</div>
                                                    }
                                                </div>
                                                {/* Idiom count and legend row */}
                                                <div className="flex items-center justify-between flex-wrap gap-2 mt-2 mb-3 text-xs max-mobile:text-[10px]">
                                                    <div className="flex gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <div className="h-2 w-2 max-mobile:h-[6px] max-mobile:w-[6px] bg-green-400 rounded-full"></div>
                                                            <span>Elementary</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="h-2 w-2 max-mobile:h-[6px] max-mobile:w-[6px] bg-blue-400 rounded-full"></div>
                                                            <span>Intermediate</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="h-2 w-2 max-mobile:h-[6px] max-mobile:w-[6px] bg-red-400 rounded-full"></div>
                                                            <span>Advanced</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs ml-auto font-semibold text-gray-600">{words.length} idioms</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </DialogPrimitive.Content>
                            </DialogPrimitive.Portal>
                        </DialogPrimitive.Root>
                    </>
                )}
            </div>
        </div>
    )
}
