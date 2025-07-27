import Link from "next/link";

interface QuickAccessCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  route: string;
}

export default function QuickAccessCard({icon, title, description, route}: QuickAccessCardProps) {
    return (
      <div className="flex flex-col gap-3 border rounded-2xl pl-4 pr-14 py-6 bg-[#f9f9f9]/30 shadow-lg duration-150 hover:border-[#5c6bec] hover:-translate-y-1">
        <div className="bg-[#5c6bec] text-white rounded-full self-start p-2 text-lg">
          {icon}
        </div>
        <div className="space-y-3">
          <div className="text-sm">{title}</div>
          <div className="text-xs text-gray-500 font-medium pb-2">{description}</div>
          <Link href={route} className="select-none text-xs border text-primaryColor rounded-lg p-2 w-1/2 text-center shadow cursor-pointer hover:bg-primaryColor hover:text-white duration-100">Learn more {'=>'}</Link>
        </div>
      </div>
    );
}