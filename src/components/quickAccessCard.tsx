import Link from "next/link";

interface QuickAccessCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  route: string;
}

export default function QuickAccessCard({icon, title, description, route}: QuickAccessCardProps) {
    return (
      <div className="flex min-h-[190px] min-w-0 flex-col gap-4 rounded-lg border bg-[#f9f9f9]/70 p-5 shadow-sm duration-150 hover:border-[#5c6bec] hover:-translate-y-1 hover:shadow-lg">
        <div className="bg-[#5c6bec] text-white rounded-lg self-start p-2 text-lg [&_svg]:size-5">
          {icon}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="text-base font-black">{title}</div>
          <div className="text-sm leading-6 text-gray-500 font-medium">{description}</div>
          <Link href={route} className="mt-auto select-none text-sm border text-primaryColor rounded-lg px-3 py-2 text-center shadow-sm cursor-pointer hover:bg-primaryColor hover:text-white duration-100">Open mode</Link>
        </div>
      </div>
    );
}
