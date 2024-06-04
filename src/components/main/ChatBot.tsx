"use client";
import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "./Footer";
interface Props {
  nameFile: string;
}

export default function Chatbot({ nameFile }: Props) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [score,setScore]=useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [typedResponse, setTypedResponse] = useState("");
  useEffect(()=>{
    let index=0;
    if(response){
      const interval=setInterval(()=>{
        setTypedResponse((prev)=>prev+response.charAt(index));
        index++;
        if(index===response.length){
          clearInterval(interval);
        }
      },5)
      return ()=>clearInterval(interval);
    }
  },[response])
  const handleQuerySubmit = async () => {
    try {
      setLoading(true);
      console.log(nameFile);
      const res = await fetch("http://127.0.0.1:8080/ask_story_with_pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, nameFile,genre }),
      });
      const data = await res.json();
      setResponse(data.Answer);
      setScore(data.Score);
    } catch (error) {
      console.error("Error fetching response:", error);
    }
    setLoading(false);
  };

  return (
    <>
    <div>
      <div className="p-4 w-full rounded-md shadow-md flex justify-between pb-6">
        <motion.div initial={{x:-200,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:1.5}} className="w-1/2">
          <p className="text-white">Prompt:</p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your suggestions on the story..."
            className="w-full p-2 border rounded-md text-white glass-effect"
            rows={18}
          />
        </motion.div>
        <motion.div initial={{x:200,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:1.5}} className="w-1/2 h-full">
          <p className="text-white">Response:</p>
          <div className="p-2 h-[450px] w-full border rounded-md text-white glass-effect overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="loader"></div>
              </div>
            ) : (
              <p className='text-white'>{typedResponse}</p>
            )}
          </div>
        </motion.div>
      </div>
      <div className="flex justify-between">
      <Select onValueChange={setGenre}>
          <SelectTrigger className="w-[180px] bg-white text-black">
            <SelectValue placeholder="Select Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fantasy">Fantasy</SelectItem>
            <SelectItem value="sci-fi">Sci-Fi</SelectItem>
            <SelectItem value="mystery">Mystery</SelectItem>
            <SelectItem value="romance">Romance</SelectItem>
          </SelectContent>
        </Select>
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
    <style jsx>{`
        .loader {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #0ff;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

    </>
  );
}
