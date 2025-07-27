"use client";
import { useEffect, useState } from "react";
import { IoCreate } from "react-icons/io5";
import { FaBookOpen } from "react-icons/fa";
import { PiCardsThreeFill } from "react-icons/pi";
import { MdOutlineFavorite } from "react-icons/md";
import QuickAccessCard from "@/components/quickAccessCard";
import { useScrollFade } from "@/hooks/useScrollFade";
import toast from "react-hot-toast";

export default function Home() {
  const [quickAccess] = useState([
    {
      icon: <IoCreate />,
      title: "Story Creator",
      description: "Reach a message to any other one of your chicken",
      route: "/story"
    },
    {
      icon: <PiCardsThreeFill />,
      title: "Flash Cards",
      description: "Reach a message to any other one of your chicken",
      route: "/cards"
    },
    {
      icon: <FaBookOpen />,
      title: "Book",
      description: "Reach a message to any other one of your chicken",
      route: "/book"
    },
    {
      icon: <MdOutlineFavorite />,
      title: "Archives",
      description: "Reach a message to any other one of your chicken",
      route: "/archive"
    }
  ]);
  useEffect(()=>{
    toast('This page is still under construction!', {
      icon:<img className="w-[20px]" src="./icon/laptop.png"/>,
      position:'top-right'
    });
  },[])
  return (
    <div ref={useScrollFade()} className="h-full flex flex-col gap-10 p-7 overflow-y-auto">
      <div className="flex flex-col gap-6">
        <div className="text-xl min-[500px]:text-3xl lg:text-5xl font-bold select-none">Leran essenitial idioms with <span className="bg-gradient-to-r from-[#4e5996] to-primaryColor bg-clip-text text-transparent">AI</span></div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-10 lg:gap-4">
        <div className="flex-1 flex flex-col order-2 text-sm xl:text-base">
          <div className="text-justify lg:lext-left">
            This <span className="bg-hilightColor/30 px-1">AI-powered tool</span> is designed to help you master <span className="bg-hilightColor/30 px-1">essential English idioms</span> in a fun and effective way. With features like the Story Creator, Flash Cards, and a full Book of idioms, it makes learning both <span className="bg-hilightColor/30 px-1">interactive</span> and practical. Whether you're a beginner or looking to improve your fluency, this tool supports your progress by offering structured lessons and <span className="bg-hilightColor/30 px-1">personalized practice</span>. You'll build your vocabulary, understand real-life usage, and <span className="bg-hilightColor" />
            <span className="bg-hilightColor/30 px-1">gain confidence</span> in speaking and writing. The Archives section also helps you save and review what you've learned. It's an ideal companion for daily English improvement.
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center select-none lg:order-2">
          <div className="ring-3 ring-primaryColor rounded-xl w-[500px] h-full relative">
            <img className="w-full rounded-xl h-full object-cover shadow-xl shadow-bgColor" src="./Screenshot 2025-06-16 103128.png" />
            <img className="absolute -top-5 -right-5 w-[40px]" src="./icon/Direct Hit.svg"/>
          </div>
        </div>
      </div>          
      <div className="font-bold flex flex-col gap-5">
        <div className="text-lg select-none">Quick Access <img className="w-[30px] inline-block" src="./icon/Backhand Index Pointing Down Medium Skin Tone.svg" /></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 sm:pr-[1rem] gap-5">
          {quickAccess.map((item,id)=>(
            <QuickAccessCard key={id} route={item.route} icon={item.icon} title={item.title} description={item.description} />
          ))}
        </div>
      </div>
    </div>
  );
}