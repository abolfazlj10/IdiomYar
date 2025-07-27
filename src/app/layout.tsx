import type { Metadata } from "next";
import "./globals.css";
import Providers from "./provider";

export const metadata: Metadata = {
  title: "Essential Idioms in English",
  description: "Essential Idioms in English",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden max-mobile:overflow-y-auto customScrollBarStyle">

      <body className="overflow-x-hidden
        overflow-y-hidden max-mobile:overflow-y-auto
        font-interVariable">
        <div className="relative
            w-screen h-dvh max-mobile:min-h-dvh max-mobile:max-h-dvh
            max-mobile:overflow-hidden
            flex justify-center items-center py-10 max-tablet:py-12 max-mobile:py-0 z-10">
          <img className="z-10 w-[500px] left-[200px] absolute opacity-20 -bottom-32 select-none max-[3100px]:-left-[150px] min-[2500px]:-left-[0x]" src="/blob3.svg"/>
          <img className="z-10 w-[300px] left-[0px] absolute top-0 opacity-80 select-none max-[0px]:left-[0px] min-[2500px]:left-[500px] min-[2500px]:w-[500px]" src="/blob2.svg"/>
          <img className="z-10 w-[350px] absolute right-[100px] -bottom-10 opacity-50 select-none min-[2500px]:w-[600px] min-[2500px]:right-[800px]" src="/blob2.svg"/>

          <Providers>
            <div className="h-full w-full
            max-w-[2000px] max-h-[1200px] 
            max-mobile:overflow-y-scroll max-mobile:p-0
            max-tablet:max-h-[1000px] 
            max-mobile:max-h-full
            mx-60 max-[2000px]:mx-18 max-[1315px]:mx-16 max-tablet:mx-5 max-mobile:mx-0 border-4 max-tablet:border-2 bg-[#fff] max-tablet:bg-[#fff]/50 max-tablet:backdrop-blur-2xl shadow-2xl rounded-2xl max-mobile:rounded-none text-black z-20">
              {children}
            </div>
          </Providers>

        </div>

      </body>
    </html>
  );
}