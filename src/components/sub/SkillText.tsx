"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { slideInFromLeft, slideInFromRight, slideInFromTop } from '@/utils/motion'
import { SparklesIcon } from '@heroicons/react/24/solid'

const SkillText = () => {
  return (
    <div className='w-full h-auto flex flex-col items-center justify-center px-4 md:px-10'>
      <motion.div
        variants={slideInFromTop}
        className="Welcome-box py-[8px] px-[12px] border border-[#7042f88b] opacity-[0.9] flex items-center justify-center"
      >
        <SparklesIcon className="text-[#b49bff] mr-[10px] h-5 w-5" />
        <h1 className="Welcome-text text-[15px] md:text-[18px] text-white">
          Produce Better Stories with Us
        </h1>
      </motion.div>

      <motion.div
        initial={{opacity:0,x:-200}} whileInView={{opacity:1,x:0}} transition={{duration:1}}
        className='text-[24px] md:text-[30px] text-white font-medium mt-[20px] text-center mb-[20px]'
      >
        Generating Stories with Modern Technologies
      </motion.div>

      <motion.div
       initial={{opacity:0,x:-200}} whileInView={{opacity:1,x:0}} transition={{duration:1}}
        className='text-[18px] md:text-[20px] text-gray-200 mb-[20px] mt-[20px] text-center italic'
      >
        Produce Stories in Your Favourite Author's Style
      </motion.div>

      <motion.div
        initial={{opacity:0,x:-200}} whileInView={{opacity:1,x:0}} transition={{duration:1}}
        className='w-full mt-[30px]'
      >
        <h1 className="text-3xl md:text-5xl font-bold text-white text-center">
          About Our LLM
        </h1>
      </motion.div>

      <motion.div
        initial={{opacity:0,x:-200}} whileInView={{opacity:1,x:0}} transition={{duration:1}}
        className='text-lg md:text-xl text-gray-300 mt-[20px] max-w-3xl text-left'
      >
        Our cutting-edge Large Language Model (LLM) leverages the latest advancements in artificial intelligence to create unique and engaging stories. Whether you are looking for inspiration, need assistance with your writing, or simply want to enjoy a good read, our AI-powered tool can generate narratives that cater to your preferences and style.
      </motion.div>

      <motion.div
        initial={{opacity:0,x:-200}} whileInView={{opacity:1,x:0}} transition={{duration:1}}
        className='text-lg md:text-xl text-gray-300 mt-[10px] max-w-3xl text-left'
      >
        With the ability to mimic the styles of famous authors, our LLM offers a versatile platform for both novice and experienced writers. Explore a world of creativity and enhance your storytelling experience with us.
      </motion.div>
    </div>
  )
}

export default SkillText;
