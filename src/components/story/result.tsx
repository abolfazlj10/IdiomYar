import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import { RxLineHeight } from "react-icons/rx";
import { TbLineHeight } from "react-icons/tb";
import GroupButton from "@/components/ui/group-button";
import { useState } from "react";
import Appbar from "../appbar";
import { toast } from 'react-hot-toast';

interface resultProps {
    isShow: (value: boolean) => void;
    theStory: string;
    storyPersian: string;
    storyEnglish: string;
    newStory?: () => void;
    title?: string;
    iconSrc?: string;
    actionLabel?: string;
}

type StoryLanguage = 'en' | 'fa';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatStoryText(text: string, highlight: boolean): string {
    const escapedText = escapeHtml(text);

    if (!highlight) {
        return escapedText.replace(/\[([^\]]+)\]/g, "$1");
    }

    return escapedText.replace(
        /\[([^\]]+)\]/g,
        '<span class="rounded-md bg-primaryColor/15 px-1.5 py-0.5 font-extrabold text-primaryColor ring-1 ring-primaryColor/20">$1</span>'
    );
}

function splitStoryParagraphs(text: string, lang: StoryLanguage): string[] {
    const paragraphs = text
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .filter(Boolean);

    if (paragraphs.length > 1) {
        return paragraphs;
    }

    const sentencePattern = lang === 'fa' ? /(?<=[.!؟])\s+/ : /(?<=[.!?])\s+/;
    const sentences = text.split(sentencePattern).map((part) => part.trim()).filter(Boolean);
    if (sentences.length <= 2) {
        return sentences.length ? sentences : paragraphs;
    }

    const grouped: string[] = [];
    for (let index = 0; index < sentences.length; index += 2) {
        grouped.push(sentences.slice(index, index + 2).join(" "));
    }

    return grouped;
}

export const ResultStory = ({
    isShow,
    theStory,
    storyEnglish,
    storyPersian,
    newStory,
    title = "Lesson story",
    iconSrc = "/icon/Seedling.svg",
    actionLabel = "New Story",
}: resultProps) => {
    const [fontSize, setFontSize] = useState(14);
    const [lineHeight, setLineHeight] = useState(2);
    const [focusMode, setFocusMode] = useState<'all' | 'en' | 'fa'>('all');
    const [clickedButton, setClickedButton] = useState<string | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const englishParagraphs = splitStoryParagraphs(storyEnglish, 'en');
    const persianParagraphs = splitStoryParagraphs(storyPersian, 'fa');

    function copyText(text: string) {
        navigator.clipboard.writeText(text);
        toast.success('Text copied to clipboard.');
    }

    function renderParagraph(text: string, lang: StoryLanguage, index: number) {
        const isPersian = lang === 'fa';
        const isHovered = hoveredIndex === index;

        return (
            <div
                key={`${lang}-${index}`}
                className={`rounded-lg border p-3 transition-all duration-200 ${
                    isHovered ? 'border-primaryColor/40 bg-primaryColor/[0.03] ring-2 ring-primaryColor/10' : 'border-gray-100 bg-gray-50/70'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
            >
                <div className="mb-2 flex items-center justify-end">
                    <span dir="ltr" className="rounded-md bg-white px-2 py-1 text-xs font-bold text-gray-500 shadow-sm">Part {index + 1}</span>
                </div>
                <p
                    dir={isPersian ? 'rtl' : 'ltr'}
                    className={`${isPersian ? 'font-iranYekan text-right' : 'text-left'} text-gray-900`}
                    style={{fontSize, lineHeight}}
                    dangerouslySetInnerHTML={{ __html: formatStoryText(text, !isPersian) }}
                />
            </div>
        );
    }

    function renderStorySection(paragraphs: string[], lang: StoryLanguage) {
        if (!paragraphs.length) return null;

        const isPersian = lang === 'fa';

        return (
            <article
                className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
                <div className={`mb-3 flex items-center justify-between gap-3 ${isPersian ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${isPersian ? 'bg-green-400' : 'bg-blue-400'}`}></span>
                        <img src={isPersian ? "/icon/Flag Iran.svg" : "/icon/Flag England.svg"} alt={isPersian ? "Persian" : "English"} className="size-5" />
                        <span className={`text-sm font-black ${isPersian ? 'text-green-700' : 'text-blue-700'}`}>{isPersian ? 'Persian' : 'English'}</span>
                    </div>
                    <span dir="ltr" className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500">
                        {paragraphs.length} {paragraphs.length === 1 ? 'part' : 'parts'}
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    {paragraphs.map((paragraph, index) => renderParagraph(paragraph, lang, index))}
                </div>
            </article>
        );
    }

    const buttonNewStory = () => {
        if (!newStory) {
            return null;
        }

        return(
            <button onClick={()=> {
                newStory()
            }} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primaryColor/90 hover:bg-primaryColor text-white shadow-lg font-semibold max-tablet:text-xs transition-all duration-150 cursor-pointer">{actionLabel}</button>
        )
    }

    return(
        <div className="flex flex-col flex-1 gap-2 overflow-hidden animate-fadein">
            <Appbar onBackClick={()=> isShow(false)} title={title} iconSrc={iconSrc} rightButton={buttonNewStory()}/>
            <>
            <div className="flex justify-center gap-6 max-[428px]:gap-2">
                {/* Language Group */}
                <div className="flex flex-col items-center gap-1">
                    <div className="text-xs font-bold text-gray-500 mb-1">Language</div>
                    <GroupButton 
                        options={[
                            { label: "Both", value: "all", icon: null },
                            { label: "EN", value: "en", icon: <img src="/icon/Flag England.svg" alt="EN" className="w-4 h-4" /> },
                            { label: "FA", value: "fa", icon: <img src="/icon/Flag Iran.svg" alt="FA" className="w-4 h-4" /> },
                        ]}
                        value={focusMode}
                        onChange={val => {
                            setClickedButton(val);
                            setTimeout(() => setClickedButton(null), 150);
                            setFocusMode(val as typeof focusMode);
                        }}
                        clickedButton={clickedButton}
                        className="flex-1 mb-2 text-xs max-laptop:text-2xs max-[450px]:[&>button]:p-2"
                    />
                </div>
                {/* Typography Group */}
                <div className="flex flex-col items-center gap-1">
                    <div className="text-xs font-bold text-gray-500 mb-1">Typography</div>
                    <GroupButton
                        options={[
                            { value: "decFont", icon: <AiOutlineMinus className="text-xs" />, label: "" },
                            { value: "incFont", icon: <AiOutlinePlus className="text-xs" />, label: "" },
                            { value: "decLine", icon: <TbLineHeight className="text-xs" />, label: "" },
                            { value: "incLine", icon: <RxLineHeight className="text-xs" />, label: "" },
                        ]}
                        value={""}
                        onChange={val => {
                            setClickedButton(val);
                            setTimeout(() => setClickedButton(null), 150);
                            if (val === "incFont") setFontSize(f => Math.min(40, f+2));
                            else if (val === "decFont") setFontSize(f => Math.max(14, f-2));
                            else if (val === "incLine") setLineHeight(l => Math.min(3, l+0.2));
                            else if (val === "decLine") setLineHeight(l => Math.max(1.2, l-0.2));
                        }}
                        clickedButton={clickedButton}
                        className="flex-1 mb-2 text-xs max-laptop:text-2xs max-[450px]:[&>button]:px-3"
                    />
                </div>
            </div>
            
            {storyPersian && storyEnglish ? (
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-primaryColor/10 px-2.5 py-1 text-xs font-black text-primaryColor">Structured story</span>
                            <span className="text-xs font-semibold text-gray-500">English idioms are highlighted. Persian translation stays natural.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-200"
                                onClick={() => copyText(storyEnglish)}
                            >Copy EN</button>
                            <button
                                className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-200"
                                onClick={() => copyText(storyPersian)}
                            >Copy FA</button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-1 customScrollBarStyle">
                        <div className="flex flex-col gap-3 pb-2">
                            {focusMode === 'all'
                                ? (
                                    <section className="grid grid-cols-2 gap-3 max-tablet:grid-cols-1">
                                        {renderStorySection(englishParagraphs, 'en')}
                                        {renderStorySection(persianParagraphs, 'fa')}
                                    </section>
                                )
                                : (
                                    <section>
                                        {renderStorySection(focusMode === 'en' ? englishParagraphs : persianParagraphs, focusMode)}
                                    </section>
                                )}
                        </div>
                    </div>
                </div>
            ) : theStory ? (
                <div className="overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-6 text-base leading-8 text-red-700">
                    <b>Unstructured output:</b>
                    <br/>{theStory}
                </div>
            ) : null}
            </>
        </div>
    )
}
export default ResultStory
