"use client"
import React from 'react'
import { useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {motion} from "framer-motion"
interface Props {}

function OnlyPrompt(props: Props) {
  const {} = props
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [score,setScore]=useState("");
  const [open,setOpen]=useState(false);
  const handleQuerySubmit = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8080/ask_story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      console.log(data);
      setResponse(data.Answer);
      setScore(data.Score)
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  return (
    <>
    <div className=" relative z-30 w-full flex">
      <motion.div initial={{x:-200,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:1.5}} className="mb-4 w-1/2">
        <p className='text-white'>Prompt</p>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your Suggestions on the story..."
          className="w-full p-2 border rounded-md text-white glass-effect"
          rows={18} cols={100}
        />
      </motion.div>
      <motion.div initial={{x:200,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:1.5}}  className="text-white w-1/2 h-full">
        <p>Response:</p>
        <div className="p-2 h-[450px] w-full border rounded-md text-white glass-effect ">{<p className='text-white'>{response}</p>}</div>
      </motion.div>
    </div>
    <div className='flex justify-between'>

      <button
        onClick={handleQuerySubmit}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 text-white rounded-md"
      >
        Submit
      </button>
      <Drawer>
  <DrawerTrigger className=' px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 text-white rounded-md'>Show Similarity Status</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>The Similarity between the Stories are:</DrawerTitle>
    </DrawerHeader>
    <div className='flex justify-center'>

        {score && <DrawerDescription className='text-lg font-extrabold'>{score}</DrawerDescription>}
    </div>
    <DrawerFooter>
      <DrawerClose>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>

    </div>
</>
  )
}

export default OnlyPrompt
