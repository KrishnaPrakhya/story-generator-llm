"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  slideInFromLeft,
  slideInFromRight,
  slideInFromTop,
} from "@/utils/motion";
import { SparklesIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

const HeroContent = () => {
  const router=useRouter();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="flex flex-col md:flex-row h-screen items-center justify-center px-10 md:px-20 w-full relative z-30"
    >
      <div className="h-full w-full flex flex-col gap-8 justify-center text-center top-28">
        <motion.div
          variants={slideInFromLeft(0.5)}
          className="flex flex-col gap-6 mt-24 md:mt-0 text-4xl md:text-6xl font-bold text-white w-full justify-center items-center"
        >
          <span className="text-transparent text-7xl bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
            TaleWeave
          </span>

          <motion.div
            variants={slideInFromTop}
            className="Welcome-box py-[8px] px-[12px] border border-[#7042f88b] opacity-[0.9] flex justify-center items-center"
          >
            <SparklesIcon className="text-[#b49bff] mr-[10px] h-5 w-5" />
            <h1 className="Welcome-text text-[15px] md:text-[18px]">
              AI-Powered Storytelling
            </h1>
          </motion.div>

          <span>
            Experience the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
              magic
            </span>{" "}
            of AI-powered Story Telling
          </span>
        </motion.div>

        <motion.p
          variants={slideInFromLeft(0.8)}
          className="text-md md:text-lg text-gray-400 max-w-[600px] mx-auto"
        >
          Dive into a world of creativity with our advanced AI story generator.
          Whether you are an aspiring writer or a seasoned storyteller, our
          LLM-powered tool will help you craft captivating narratives.
        </motion.p>

        <motion.a
          variants={slideInFromLeft(1)}
          className="py-2 px-4 flex justify-center items-center button-primary text-center text-white cursor-pointer rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 max-w-sm mx-auto text-lg z-50 relative" onClick={()=>{
            router.push("/generateStory")
          }}
        >
          Get Started!
        </motion.a>
      </div>
    </motion.div>
  );
};

export default HeroContent;
