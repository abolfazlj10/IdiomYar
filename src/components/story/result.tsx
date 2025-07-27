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
    newStory: () => void;
}

const loremIP = `
    Lorem ipsum dolor sit amet consectetur adipisicing elit. In adipisci soluta molestias, tempora excepturi necessitatibus, doloremque unde mollitia magnam dicta sit eligendi obcaecati, minus quos animi architecto voluptatibus nobis quisquam. Aut cum veniam totam voluptas dolorum reiciendis obcaecati porro, nostrum tenetur commodi perferendis ipsa veritatis similique at! Asperiores voluptatibus, blanditiis beatae itaque voluptates aperiam soluta ipsam quo, modi vitae deserunt. Consequuntur, incidunt magni odio corporis expedita suscipit beatae qui nesciunt in? Inventore esse beatae illo sint asperiores? Culpa, similique animi optio alias eos eveniet asperiores, saepe ab, minima eum quam?
    Nostrum corporis dolor nemo omnis doloribus suscipit numquam consequatur impedit aut in consequuntur quae quibusdam ut quod, atque qui totam voluptatum. Reiciendis velit facere iure voluptatem eos, dolorum itaque nemo.
    Soluta odio eligendi vel cupiditate quibusdam eius error, quae fugit optio corporis? Laboriosam tenetur temporibus cumque iusto, non quos nam beatae reprehenderit porro repudiandae in quidem, repellat quis distinctio officiis.
    Excepturi mollitia eos, earum deleniti at amet asperiores ullam obcaecati magni consequuntur corrupti voluptate praesentium numquam, porro doloribus recusandae eveniet voluptas placeat suscipit, minus ex corporis quibusdam modi similique. Omnis.
    Nihil, similique! Quasi obcaecati adipisci aut velit in similique quo dignissimos dolor. Animi nemo atque alias labore, facilis cum nisi itaque consectetur, repellendus libero magni, ducimus laudantium dolores nihil porro!
    Ex corporis porro, voluptatum vel nisi commodi totam, odit eveniet impedit doloribus nam accusamus incidunt omnis voluptatem. Quam eius ea voluptatem itaque, voluptas fuga ullam, dolore, saepe aliquam architecto eligendi!
    Deserunt consectetur facere fugiat quam esse magnam. Accusantium nulla cum, nesciunt eveniet saepe minima harum ducimus commodi! Fuga natus eaque iste alias similique. Similique nam eos eligendi id alias quibusdam?
    Dolor magni rerum sunt quas sequi incidunt quaerat repellendus officia? Ad, sed delectus distinctio incidunt laudantium nesciunt ipsam dicta magni voluptas animi nemo unde fugiat reiciendis debitis totam, ex quod!
    Eum, quam itaque iure ducimus, nobis maxime mollitia nesciunt temporibus consequatur aut, officiis quidem autem. Iusto perferendis ratione architecto veniam eaque. Assumenda repellendus rem, dolor amet porro doloribus incidunt earum.
    Corrupti eos debitis adipisci at quis numquam cumque quaerat minus alias tempore, tenetur dignissimos nemo aliquam quasi error, quidem dolores, ratione magni? Praesentium, placeat commodi laudantium repudiandae aliquam laborum impedit.
    Unde sint nostrum est magnam ipsum sit perspiciatis voluptatum. Alias hic ullam at omnis magnam amet quis sit culpa! Iusto quisquam dolorem quibusdam corrupti aut sapiente hic necessitatibus recusandae accusantium!
    Debitis qui sunt soluta dolorem at consectetur est quam facilis vel aut, corporis magnam cumque deserunt illo quis itaque architecto ullam, provident numquam tenetur, ea velit quos nam fugit! Aliquid.
    Quaerat quasi soluta iure itaque nam debitis quae, accusantium alias ut, dolorum reprehenderit qui, quis molestias fuga? Quaerat minima amet aperiam quidem quo, optio impedit beatae, nobis, distinctio possimus fuga?
    Similique reiciendis cumque voluptatem dolore rem iste odio nihil hic quaerat, obcaecati perferendis unde? Corporis earum quis dolorum dignissimos perspiciatis, praesentium unde similique incidunt minus quas deleniti illum optio nesciunt.
    Quam laborum dignissimos vel, quae aperiam dolorum impedit vitae repellendus magni consequatur doloremque, quos ipsam fugit non ipsa. Nulla fuga tempora natus hic saepe exercitationem adipisci at atque distinctio voluptas.
    Iure eligendi consequatur officiis, facere ipsum nulla debitis velit earum soluta consectetur neque. Saepe illo culpa tenetur. Illum porro dolores, voluptatem, aspernatur aut temporibus placeat ipsum labore ratione, unde in.
    Excepturi, cum dignissimos iste, ipsum ab esse architecto consectetur dolores laudantium deserunt sint adipisci nobis! Assumenda mollitia ducimus dolore amet illum, modi veniam ex voluptas accusantium, laudantium cupiditate consectetur reprehenderit.
    Nisi nobis accusantium illo, quo libero placeat laudantium minus cum. Repellat sint blanditiis minima itaque, nesciunt et assumenda ipsam, sit ex velit fugit at perferendis sapiente mollitia quam eos debitis.
`

export const ResultStory = ({
    isShow,
    theStory,
    storyEnglish,
    storyPersian,
    newStory,
}: resultProps) => {
    const [fontSize, setFontSize] = useState(14);
    const [lineHeight, setLineHeight] = useState(2);
    const [focusMode, setFocusMode] = useState<'all' | 'en' | 'fa'>('all');
    const [clickedButton, setClickedButton] = useState<string | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const highlightColorEn = 'bg-blue-100';
    const highlightColorFa = 'bg-green-100';

    function splitAndSyncHighlight(text: string, lang: 'en' | 'fa') {
        let parts: string[] = [];
        if (lang === 'fa') {
            parts = text.split(/\n+/).filter(Boolean);
            if (parts.length === 1) {
                parts = text.split(/(?<=[.!؟])\s+/).filter(Boolean);
            }
        } else {
            parts = text.split(/\n+/).filter(Boolean);
            if (parts.length === 1) {
                parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
            }
        }
        const highlightColor = lang === 'fa' ? highlightColorFa : highlightColorEn;
        return (
            <span>
                {parts.map((part, idx) => {
                    let html = part;
                    html = part.replace(/\[([^\]]+)\]/g, '<span class="bg-primaryColor/20 font-bold rounded px-1">$1</span>');
                    return (
                        <span
                            key={idx}
                            className={`transition-all duration-300 rounded px-0.5 animate-fadein ${hoveredIndex === idx ? highlightColor + ' ring-2 ring-primaryColor/60 shadow-lg' : ''}`}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{cursor: 'pointer'}}
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    );
                })}
            </span>
        );
    }

    const buttonNewStory = () => {
        return(
            <button onClick={()=> {
                newStory()
                console.log('yes its gonna work')
            }} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primaryColor/90 hover:bg-primaryColor text-white shadow-lg font-semibold max-tablet:text-xs transition-all duration-150 cursor-pointer">+ New Story</button>
        )
    }

    return(
        <div className="flex flex-col flex-1 gap-2 overflow-hidden animate-fadein">
            <Appbar onBackClick={()=> isShow(false)} title='The story' iconSrc="./icon/Otter.svg" rightButton={buttonNewStory()}/>
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
                <div className="flex flex-col md:flex-row flex-1 items-stretch overflow-y-auto">
                    {/* English Box */}
                    <div className={`flex-1 bg-gray-50 rounded-2xl shadow-lg p-6 flex flex-col gap-4 max-mobile:gap-0 ring-2 ring-gray-200 border border-gray-100 relative transition-all duration-300 scale-90 ${focusMode==='fa' ? 'opacity-30 blur-[2px]' : focusMode==='en' ? 'scale-95 shadow-2xl z-10' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <img src="/icon/Flag England.svg" alt="English" className="w-6 h-6" />
                            <span className="font-bold text-xl max-laptop:text-base text-blue-700">English</span>
                        </div>
                        <div className="text-gray-800 whitespace-pre-line overflow-y-auto" style={{fontSize, lineHeight}}>
                            {splitAndSyncHighlight(storyEnglish, 'en')}
                            {/* {loremIP} */}
                        </div>
                        <button
                            className="absolute top-4 right-4 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-xs max-laptop:text-2xs font-semibold shadow transition-all duration-150 cursor-pointer"
                            onClick={() => {
                                navigator.clipboard.writeText(storyEnglish);
                                toast.success('Text copied to clipboard.');
                            }}
                        >Copy</button>
                    </div>
                    {/* Divider */}
                    <div className="laptop:block hidden w-px bg-gray-200 mx-6 my-8 self-stretch rounded"></div>
                    {/* Persian Box */}
                    <div className={`flex-1 bg-gray-50 rounded-2xl shadow-lg p-6 flex flex-col gap-4 max-mobile:gap-0 ring-2 ring-gray-200 border border-gray-100 relative transition-all duration-300 scale-90 ${focusMode==='en' ? 'opacity-30 blur-[2px]' : focusMode==='fa' ? 'scale-95 shadow-2xl z-10' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            <img src="/icon/Flag Iran.svg" alt="Persian" className="w-6 h-6" />
                            <span className="font-bold text-xl max-laptop:text-base text-green-700">Persian</span>
                        </div>
                        <div dir="rtl" className="font-iranYekan text-gray-900 whitespace-pre-line text-right overflow-y-auto" style={{fontSize, lineHeight}}>
                            {splitAndSyncHighlight(storyPersian, 'fa')}
                            {/* {loremIP} */}
                        </div>
                        <button
                            className="absolute top-4 right-4 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs max-laptop:text-2xs font-semibold shadow transition-all duration-150 cursor-pointer"
                            onClick={() => {
                                navigator.clipboard.writeText(storyPersian);
                                toast.success('Text copied to clipboard.');
                            }}
                        >Copy</button>
                    </div>
                </div>
            ) : theStory ? (
                <div className="text-xl leading-8 bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 font-mono">
                    <b>Unstructured output:</b>
                    <br/>{theStory}
                </div>
            ) : null}
            </>
        </div>
    )
}
export default ResultStory