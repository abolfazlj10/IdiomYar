import React from "react";

type StepperProps = {
    steper: number;
};

const Stepper: React.FC<StepperProps> = ({ steper }) => {
    return (
        <div className="flex gap-5 max-laptop:gap-2 max-tablet:gap-1 select-none px-2">
            <div className="flex-1 flex flex-col gap-1 max-laptop:gap-1">
                <div className={`w-full h-[5px] max-laptop:h-[6px] max-tablet:h-[4px] rounded duration-150 ${steper >= 1 ? 'bg-gradient-to-l from-primaryColor from-40% to-bgColor' : 'bg-[#eaeced]'}`}></div>
                <div className={`text-xs max-laptop:text-xs max-tablet:text-[10px] duration-100 ${steper < 1 && 'text-gray-400'}`}>Level</div>
            </div>
            <div className="flex-1 flex flex-col gap-1 max-laptop:gap-1">
                <div className={`w-full h-[5px] max-laptop:h-[6px] max-tablet:h-[4px] rounded duration-150  ${steper >= 2 ? 'bg-gradient-to-l from-primaryColor from-40% to-bgColor' : 'bg-[#eaeced]'}`}></div>
                <div className={`text-xs max-laptop:text-sm max-tablet:text-[10px] duration-100 ${steper < 2 && 'text-gray-400'}`}>Lessons</div>
            </div>
            <div className="flex-1 flex flex-col gap-1 max-laptop:gap-1">
                <div className={`w-full h-[5px] max-laptop:h-[6px] max-tablet:h-[4px] rounded duration-150  ${steper >= 3 ? 'bg-gradient-to-l from-primaryColor from-40% to-bgColor' : 'bg-[#eaeced]'}`}></div>
                <div className={`text-xs max-laptop:text-sm max-tablet:text-[10px] duration-100 ${steper < 3 && 'text-gray-400'}`}>Idioms</div>
            </div>
        </div>
    );
};

export default Stepper;
