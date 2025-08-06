
import { FaFire, FaRegBell, FaUserGroup } from "react-icons/fa6";
import SplitText from "./ui/split-text";
import Link from "next/link";


interface MainHeaderProps {
    profile: {
      display_name: string;
    };
  }

export default async function MainHeader({ profile }: MainHeaderProps) {

    return (
        <div className="flex flex-row items-center justify-between w-full ">
          <div className="flex flex-col items-start justify-center w-full ">
            <div>
              <h1 className="text-sm font-medium opacity-70">Good Morning,</h1>
            </div>
            <SplitText
              text={`${profile?.display_name}.`}
              className="text-xl font-semibold text-center"
              delay={100}
              duration={0.3}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
          </div>
          <div className="flex flex-row items-center justify-end w-full gap-2 px-2">
            <div className="bg-white/10 rounded-lg p-2 flex flex-row items-center justify-center gap-1 border border-black/10">
              <FaFire className="text-orange-400 text-lg cursor-pointer" />
              <div className="text-sm font-semibold text-orange-300">6</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 flex flex-row items-center justify-center gap-1 border border-black/10">
              <FaRegBell className="text-foreground/70 text-lg cursor-pointer" />
            </div>
            <Link href="/protected/friends" className="bg-white/10 rounded-lg p-2 flex flex-row items-center justify-center gap-1 border border-black/10">
              <FaUserGroup className="text-foreground/70 text-lg cursor-pointer" />
            </Link>
          </div>
        </div>  
    )
}