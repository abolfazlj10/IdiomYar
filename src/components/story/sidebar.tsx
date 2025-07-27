import { Level, LevelArray, Book } from "@/types/types";
import { TbBoxMultiple1, TbBoxMultiple2, TbBoxMultiple3 } from "react-icons/tb";
import React from "react";
import { FaSpinner } from "react-icons/fa";
import { useScrollFade } from "@/hooks/useScrollFade";

interface SideBarDetailProps {
  level: LevelArray;
  lessons: number[];
  wordLessons: Record<string, number>;
  books: Record<Level, Book>;
  words: string[];
  wordLevels: Record<string, Level>;
  information: string;
  setInformation: (info: string) => void;
  loadingStory: boolean;
  StoryCreator: () => void;
  removeWord: (index: number) => void;
  MAX_WORDS_LIMIT: number;
}

const SideBarDetail: React.FC<SideBarDetailProps> = ({
  level,
  lessons,
  wordLessons,
  books,
  words,
  wordLevels,
  information,
  setInformation,
  loadingStory,
  StoryCreator,
  removeWord,
  MAX_WORDS_LIMIT,
}) => {
  const scrollFade = useScrollFade()
  return (
    <div className="border border-gray-400/10 rounded-xl relative overflow-hidden min-w-[370px] max-[1500px]:min-w-[320px] shadow-lg mx-2 mb-5 hidden desktop:block">
      <img className="absolute select-none top-1/2 -right-20 z-20 scale-x-150" src="./blob-haikei.svg" />
      <img className="absolute select-none top-0 -left-40 z-20 scale-x-150" src="./blob-haikei.svg" />
      <div className="bg-white/30 h-full w-full backdrop-blur-2xl z-30 relative py-3 flex flex-col gap-2">
        <div ref={scrollFade} className="overflow-y-auto customScrollBarStyle px-5 flex flex-col gap-4">
          <div>
            <div className="border-3 text-sm backdrop-blur-2xl justify-self-start py-1 px-4 font-semibold rounded-xl bg-blue-500/50 -mb-5 -ml-4 z-20 relative select-none">Levels :</div>
            <div className="text-[25px] font-semibold text-center rounded-xl bg-white/20 border py-5 px-5 flex justify-center items-center">
              {level.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 w-full">
                  {level.map((levelName, index) => {
                    const iconColor = levelName === 'elementry' ? 'text-green-600' : levelName === 'intermediate' ? 'text-blue-600' : 'text-red-600';
                    const IconComponent = levelName === 'elementry' ? TbBoxMultiple1 : levelName === 'intermediate' ? TbBoxMultiple2 : TbBoxMultiple3;
                    const isLastAndOdd = index === level.length - 1 && level.length % 2 !== 0;
                    return (
                      <div key={index} className={`px-4 py-3 rounded-xl text-base flex items-center justify-center gap-3 transition-all duration-200 bg-white/20 backdrop-blur-sm border-primaryColor hover:bg-white/40 ${isLastAndOdd ? 'col-span-2' : ''}`} style={{ borderWidth: 1 }}>
                        <IconComponent className={`${iconColor} text-2xl`} />
                        <span className="font-semibold text-gray-800">{levelName.charAt(0).toUpperCase() + levelName.slice(1)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No levels selected</div>
              )}
            </div>
          </div>
          <div>
            <div className="border-3 text-sm backdrop-blur-2xl justify-self-start py-1 px-4 font-semibold rounded-xl bg-blue-500/50 -mb-5 -ml-4 z-20 relative select-none">Lessons :</div>
            <div className="text-[25px] font-semibold text-center rounded-xl bg-white/20 border py-5 px-5 flex justify-center items-center">
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
                      <div
                        key={index}
                        className={`
                          relative
                          px-3 py-2 rounded-xl text-sm
                          flex items-center justify-center
                          transition-all duration-200 backdrop-blur-sm
                          ${isLastAndOdd ? 'col-span-2' : ''}
                          ${isSemiActive
                            ? 'bg-white/10 border-primaryColor/40 opacity-70 hover:opacity-100 hover:bg-white/20'
                            : 'bg-white/20 border-primaryColor hover:bg-white/40'
                          }
                        `}
                        style={{ fontWeight: 500, borderWidth: 1 }}
                        title={isSemiActive ? "This lesson has no selected words yet." : `${wordsFromLesson} word(s) selected`}
                      >
                        {wordsFromLesson > 0 && (
                          <span className={`absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 w-5 h-5 rounded-full text-xs font-semibold z-10 border-2 border-white flex items-center justify-center ${badgeClass}`}>
                            {wordsFromLesson}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`
                            w-2 h-2 rounded-full inline-block
                            ${lessonLevel === 'elementry' ? 'bg-green-400' : ''}
                            ${lessonLevel === 'intermediate' ? 'bg-blue-400' : ''}
                            ${lessonLevel === 'advanced' ? 'bg-red-400' : ''}
                          `}></span>
                          <span className="text-gray-800">Lesson {lessonNumber}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 text-sm font-normal">Select lessons to continue</div>
              )}
            </div>
          </div>
          <div>
            <div className="border-3 text-sm backdrop-blur-2xl justify-self-start py-1 px-4 font-semibold rounded-xl bg-blue-500/50 -mb-5 -ml-4 z-20 relative select-none">Idioms :</div>
            <div className="rounded-xl bg-white/20 border py-5 px-5 flex gap-2 flex-wrap overflow-y-auto customScrollBarStyle w-full max-h-[200px] [&::-webkit-scrollbar]:w-[7px] [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-2xl [&::-webkit-scrollbar-thumb]:rounded-2xl [&::-webkit-scrollbar-thumb]:bg-bgColor/80 [&::-webkit-scrollbar-thumb:hover]:bg-bgColor ">
              {words.length ?
                words.map((item, index) => {
                  const level = wordLevels[item];
                  const dot = level === 'elementry' ? 'bg-green-400' : level === 'intermediate' ? 'bg-blue-400' : 'bg-red-400';
                  const removeHover = level === 'elementry' ? 'hover:text-green-600' : level === 'intermediate' ? 'hover:text-blue-600' : 'hover:text-red-600';
                  return (
                    <div key={index} className={`max-[1500px]:w-full max-[1500px]:justify-between max-[1500px]:py-2 relative rounded-full px-3 py-1 flex items-center gap-2 bg-white/20 backdrop-blur-sm border-2 border-primaryColor border-dashed text-gray-800 transition-all duration-150 hover:shadow-sm hover:bg-white/30`}>
                      <span className={`w-[6px] h-[6px] rounded-full inline-block ${dot}`}></span>
                      <span className="font-medium text-sm select-none">{item}</span>
                      <button onClick={() => removeWord(index)} className={`ml-1 rounded-full bg-transparent text-gray-500 ${removeHover} transition-colors duration-150 select-none cursor-pointer text-base leading-none`}>×</button>
                    </div>
                  );
                })
                :
                <div className="m-auto text-gray-400 text-sm">Choose your favorite words</div>
              }
            </div>
            {/* Word count and legend row */}
            <div className="flex items-center justify-between max-[1500px]:flex-wrap gap-2 mt-2 mb-3 text-2xs max-[2432px]:text-2xs">
              <div className="flex gap-1 max-[2432px]:gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full max-[2432px]:h-[6px] max-[2432px]:w-[6px]"></div>
                  <span>Elementary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full max-[2432px]:h-[6px] max-[2432px]:w-[6px]"></div>
                  <span>Intermediate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full max-[2432px]:h-[6px] max-[2432px]:w-[6px]"></div>
                  <span>Advanced</span>
                </div>
              </div>
              <div className={`text-xs ml-auto font-semibold ${words.length >= MAX_WORDS_LIMIT ? 'text-primaryColor' : 'text-gray-600'}`}>{words.length} / {MAX_WORDS_LIMIT}</div>
            </div>
          </div>
          <div>
            <div className="border-3 text-sm backdrop-blur-2xl justify-self-start py-1 px-4 font-semibold rounded-xl bg-blue-500/50 -mb-5 -ml-4 z-20 relative select-none">Information :</div>
            <textarea placeholder="Write some information for the story that you want!" className="placeholder:select-none resize-none min-h-[100px] text-base font-semibold text-center rounded-xl bg-white/20 border pt-6 px-5 w-full outline-0 placeholder:text-xs placeholder:text-gray-400" 
              value={information}
              onChange={e => setInformation(e.target.value)}
            />
          </div>
        </div>
        <div className={`text-lg text-center font-bold border rounded-xl py-3 mx-3 mt-auto  shadow-xl duration-200 select-none flex justify-center items-center ${
            loadingStory
              ? 'bg-gradient-to-br from-primaryColor/50 to-blue-600/50 text-white cursor-default'
              : words.length >= 1
                ? 'bg-gradient-to-br from-primaryColor to-blue-600 text-white hover:shadow-2xl hover:scale-105 cursor-pointer'
                : 'bg-gradient-to-br from-primaryColor/50 to-blue-600/50 text-white cursor-not-allowed'
          }`}
          onClick={() => {
            if (words.length >= 1 && !loadingStory) {
              StoryCreator();
            }
          }}
        >
          {loadingStory ? <span className="flex items-center gap-2">Generating<FaSpinner className="animate-spin text-2xl" /></span> : 'Create Story =>'}
        </div>
      </div>
    </div>
  );
};

export default SideBarDetail;