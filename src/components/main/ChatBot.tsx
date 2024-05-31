"use client";
import { useState } from "react";
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
interface Props {
  nameFile: string;
}

export default function Chatbot({ nameFile }: Props) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [score,setScore]=useState("");
  const handleQuerySubmit = async () => {
    try {
      console.log(nameFile);
      const res = await fetch("http://127.0.0.1:8080/ask_story_with_pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, nameFile }),
      });
      const data = await res.json();
      setResponse(data.Answer);
      setScore(data.Score);
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  return (
    <>
    <div>
      <div className="p-4 w-full rounded-md shadow-md flex justify-between pb-6">
        <motion.div initial={{x:-200,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:1.5}} className="w-1/2">
          <p className="text-white">Prompt</p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your suggestions on the story..."
            className="w-full p-2 border rounded-md text-white glass-effect"
            rows={15}
          />
        </motion.div>
        <motion.div initial={{x:200,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:1.5}} className="w-1/2 h-full">
          <p className="text-white">Response:</p>
          <div className="p-2 border rounded-md h-[378px] glass-effect">
            {!response ? (
              <p className="text-gray-400">Response will be generated here</p>
            ) : (
              <p className="text-gray-400">{response}</p>
            )}
          </div>
        </motion.div>
      </div>
      <div className="flex justify-between">

      <button
        onClick={handleQuerySubmit}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600  text-white rounded-md transition duration-300"
      >
        Submit
      </button>
    <Drawer>
  <DrawerTrigger className=' px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 text-white rounded-md'>Show Similarity Status</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>The Similarity between the Stories are:</DrawerTitle>
    </DrawerHeader>
        {score && <DrawerDescription>{score}</DrawerDescription>}
    <DrawerFooter>
      <DrawerClose>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
      </div>
    </div>
    </>
  );
}
