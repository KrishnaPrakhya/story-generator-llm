"use client";
import Image from "next/image";
import React, { useState } from "react";
import navLogo from "@/assets/NavLogo.png";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/solid";

const Navbar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathName = usePathname();
  const [state,setState]=useState("Login");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const handleMouseEnter = () => {
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    setDropdownOpen(false);
  };

  return (
    <div className="w-full h-[65px] fixed top-0 shadow-lg shadow-[#2A0E61]/50 bg-[#03001417] backdrop-blur-md z-50 px-10">
      <div className="w-full h-full flex flex-row items-center justify-between m-auto px-[10px]">
        <a
          onClick={() => {
            router.push("/");
          }}
          className="h-auto w-auto flex flex-row items-center cursor-pointer"
        >
          <span className="font-bold ml-[30px] hidden md:block text-gray-300">
            TaleWeave
          </span>
        </a>
        <center>
          <div className="w-[1000px] h-full flex flex-row items-center justify-between md:mr-20">
            <div className="flex items-center justify-between w-full h-auto border border-[#7042f861] bg-[#0300145e] mr-[15px] ml-[100px] px-[20px] py-[10px] rounded-full text-gray-200">
              <a
                onClick={() => {
                  router.push("/");
                }}
                className="cursor-pointer"
              >
                Home
              </a>
              <div
                onClick={() => {
                  router.push("/fineTuned");
                }}
                className="flex cursor-pointer"
              >
                <SparklesIcon className="text-[#b49bff] h-5 w-5 mr-2" />
                <h1 className="Welcome-text text-[10px] md:text-[18px]">
                  Try Fine-Tuned LLM
                </h1>
              </div>
              <a
                onClick={() => {
                  router.push("/generateStory");
                }}
                className="cursor-pointer"
              >
                Generate Story
              </a>
              <a
                onClick={() => {
                  router.push("/#about");
                }}
                className="cursor-pointer"
              >
                About Us
              </a>
            </div>
          </div>
        </center>
        {/* {session ? (
          <>
            <div className="h-auto mr-[15px] px-[20px] py-[10px] rounded-full text-gray-200">
              <h1>{`Hey ${session?.user?.name}`}</h1>
            </div>
          </>
        ) : null} */}
        <div
          className="relative gap-5 h-auto border border-[#7042f861] bg-[#0300145e] mr-[15px] px-[20px] py-[10px] rounded-full text-gray-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {session ? (
            <>
              <h1 className="cursor-pointer">{`Hey ${session?.user?.name} !`}</h1>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        signOut();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <button
                className="cursor-pointer"
                onClick={() => {
                  pathName==="/register"?router.push("/login"):router.push("/register")
                }}
              >
                {pathName==="/register"?"Register":"Login"}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        pathName==="/register"?router.push("/login"):router.push("/register")
                        ;
                      }}
                    >
                      {pathName==="/register"?"Login":"Register"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
