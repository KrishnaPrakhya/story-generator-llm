"use client";
import Image from "next/image";
import React from "react";
import navLogo from "@/assets/NavLogo.png"
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
const Navbar = () => {
  const {data:session}=useSession();
  const router=useRouter();
  const pathName=usePathname();

  return (
    <div className="w-full h-[65px] fixed top-0 shadow-lg shadow-[#2A0E61]/50 bg-[#03001417] backdrop-blur-md z-50 px-10">
      <div className="w-full h-full flex flex-row items-center justify-between m-auto px-[10px]">
        <a
          onClick={()=>{
            router.push("/");
          }}
          className="h-auto w-auto flex flex-row items-center cursor-pointer"
        >
         

          <span className="font-bold ml-[30px] hidden md:block text-gray-300 ">
              TaleWeave
          </span>
        </a>
<center>

        <div className="w-[550px] h-full flex flex-row items-center justify-between md:mr-20">
          <div className="flex items-center justify-between w-full h-auto border border-[#7042f861] bg-[#0300145e] mr-[15px] ml-[100px] px-[20px] py-[10px] rounded-full text-gray-200">
            <a onClick={()=>{
              router.push("/")
            }} className="cursor-pointer">
              Home
            </a>
            <a onClick={()=>{
              router.push("/generateStory")
            }} className="cursor-pointer">
              Generate Story
            </a>
            <a onClick={()=>{router.push("/#about")
            }} className="cursor-pointer">
              About Us
            </a>
            {
              session?(<><div>
              <button className="curson-pointer" onClick={()=>{signOut()
              }}>Logout</button>
             </div></>):null
            }
          </div>
        </div>
</center>
            {/* {(
              <div className="gap-5  h-auto border border-[#7042f861] bg-[#0300145e] mr-[15px] px-[20px] py-[10px] rounded-full text-gray-200">
              
            </div>)
            } */}
        {session?(<>
           
            <div className=" h-auto mr-[15px] px-[20px] py-[10px] rounded-full text-gray-200">
              <h1>{`Hey ${session?.user?.name}`}</h1>
              </div>
        </>
        ):( <div className="gap-5  h-auto border border-[#7042f861] bg-[#0300145e] mr-[15px] px-[20px] py-[10px] rounded-full text-gray-200">
        <button className="curson-pointer" onClick={()=>{
          router.push("/login");
        }}>Login</button>
      </div>)}
      </div>
    </div>
  );
};

export default Navbar;
