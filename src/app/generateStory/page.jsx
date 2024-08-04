"use client";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import UploadPdf from "@/components/main/PdfUpload";
import OnlyPrompt from "@/components/main/onlyPrompt";
import { motion } from "framer-motion";

function Page() {
  const [option, setOption] = useState("");

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 overflow-auto ">
        <div className="relative  w-full max-w-4xl mx-auto p-4 top-24">
          <div className="mb-4 top-24 ">
            <div className="text-white h-72 relative ">
              <br />
              <br />
              {/* <Switch
                className="mt-72 text-yellow-500  "
                color="orange"
                onClick={() => {
                  console.log("Similarity Mode Toggled");
                }}
              /> */}
            </div>

            <Select
              onValueChange={(e) => setOption(e)}
              className="w-[180px] top-72 mt-72"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select the option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">Upload From PDF</SelectItem>
                <SelectItem value="prompt">Generate From Prompt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-screen">
            <div className="glass-effect p-6 rounded-lg shadow-lg flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                {option === "pdf" ? <UploadPdf /> : <OnlyPrompt />}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
