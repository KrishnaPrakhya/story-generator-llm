"use client"
import FineTune from '@/components/main/fineTune';
import React, { useState, useRef, useEffect } from 'react';
import {motion} from "framer-motion"
interface Props {
}

function Page({}: Props) {
  return (
    <div className="h-screen flex flex-col ">
      <div className="flex-grow flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 overflow-auto ">
        <div className="relative  w-full mx-auto p-4 top-24">
          <div className="mb-4 top-24 ">
            <div className="text-white">
          <div className="h-screen">
            <div className="glass-effect p-6 rounded-lg shadow-lg flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <FineTune/>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
      </div>
  );
}
export default Page;
