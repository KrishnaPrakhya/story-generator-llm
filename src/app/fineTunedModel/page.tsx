"use client";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { motion } from "framer-motion";
import Footer from "@/components/main/Footer";
import FineTune from "@/components/main/fineTune";

function Page() {
  const [option, setOption] = useState("");

  return (
    <div className="h-screen flex flex-col w-full">
      <div className="flex-grow flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 overflow-auto ">
        <div className="relative  w-full  mx-auto p-4 top-24">
          {/* <div className="mb-4 top-24">
           
          </div> */}
          <div className="w-full">
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
      {/* <Footer /> */}
    </div>
  );
}

export default Page;
