"use client";
import { useEffect, useState,useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { IoIosPause, IoIosPlay,IoIosMic } from "react-icons/io";
import SpeechRecognition from './TextToSpeech';
interface Props {
  nameFile: string;
  extractedStory:string
}

export default function Chatbot({ nameFile,extractedStory }: Props) {
  const [query, setQuery] = useState("");
  const [genLang,setGenLang]=useState("English");
  const [response, setResponse] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null); 
  
  const [score,setScore]=useState("");
  const [genre, setGenre] = useState("");
  const [vector,setVector]=useState("");
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

  const getFeatureVector=async(content:String)=>{
    try{
      console.log(nameFile);
      const res=await fetch("http://127.0.0.1:8080/story_features",{
        method:"POST",
        headers:{
          'Content-Type':"application/json"
        },
        body:JSON.stringify({"story":content})
      })
      const vec=await res.json();
      setVector(vec.features)
      
    }
    catch(err){
      console.log(err)
    }
  }
  const handleQuerySubmit = async () => {
    try {
      setLoading(true);
      setTypedResponse("");
      console.log(nameFile);
      const res = await fetch("http://127.0.0.1:8080/ask_story_with_pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, nameFile,genre,genLang }),
      });
      const data = await res.json();
      setResponse(data.Answer);
      setScore(data.Score);
    } catch (error) {
      console.error("Error fetching response:", error);
    }
    setLoading(false);
  };
  useEffect(() => {
    const loadVoices = () => {
      const synthVoices = window.speechSynthesis.getVoices();
      setVoices(synthVoices);
      if (synthVoices.length > 0) {
        setSelectedVoice(synthVoices[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);
  const speechFn = (text: string) => {
    const speech = new SpeechSynthesisUtterance();
    speechUtteranceRef.current = speech; 
    console.log(text)
    speech.voice = selectedVoice;
    speech.text = text;

    window.speechSynthesis.speak(speech);
    speech.onstart = () => setIsSpeaking(true);
    speech.onpause = () => setIsSpeaking(false);
    speech.onresume = () => setIsSpeaking(true);
    speech.onend = () => setIsSpeaking(false);

  };
  
  return (
    <>
    <div>
      <div className="p-4 w-full rounded-md shadow-md flex justify-between pb-6">
        <motion.div initial={{x:-200,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:1.5}} className="w-1/2">
        {response && <Dialog>
  <DialogTrigger className="text-white font-bold" onClick={()=>{
    getFeatureVector(extractedStory)}}>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Feature Vectors</DialogTitle>
      <DialogDescription>
          {vector}
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>}
          <p className="text-white mt-[16px]">Prompt:</p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your suggestions on the story..."
            className="w-full p-2 border rounded-md text-white glass-effect"
            rows={18}
          />
        </motion.div>
        <motion.div initial={{x:200,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:1.5}} className="w-1/2 h-full">
        {response && <Dialog>
  <DialogTrigger className="text-white font-bold" onClick={()=>{
    getFeatureVector(response)}}>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Feature Vectors</DialogTitle>
      <DialogDescription>
          {vector}
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>}
<div className="flex justify-between">

          <p className="text-white">Response:</p>
          <Select onValueChange={setGenLang}>
           
          <SelectTrigger className="w-[180px] bg-white text-black">
            <SelectValue placeholder="Choose Language " />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Hindi">Hindi</SelectItem>
            <SelectItem value="Telugu">Telugu</SelectItem>
            <SelectItem value="Japanese">Japanese</SelectItem>
            <SelectItem value="Malayam">Malayam</SelectItem>
          </SelectContent>
        </Select>
</div>
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
        <SpeechRecognition onTranscript={setQuery}/>
        <Select onValueChange={(e) => {
          voices.forEach((voice) => {
            if (voice.name === e) {
              setSelectedVoice(voice);
            }
          });
        }}>
          <SelectTrigger className="w-[180px] bg-white text-black">
            <SelectValue placeholder="Select Voice Type" />
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice, i) => (
              <SelectItem key={i} value={voice.name}>
                {voice.name} ({voice.lang})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      <button
        onClick={handleQuerySubmit}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600  text-white rounded-md transition duration-300"
      >
        Submit
      </button>
    <div className="flex">
    {isSpeaking ? (
          <IoIosPause
            color='white'
            size={40}
            className='mr-10 cursor-pointer'
            onClick={() => {window.speechSynthesis.pause()
              console.log("hi")}
            } 
          />
        ) : (
          <IoIosPlay
            color='white'
            size={40}
            className='mr-10 cursor-pointer'
            onClick={() => {
              if (speechUtteranceRef.current && window.speechSynthesis.paused) {
                window.speechSynthesis.resume(); 
              } else {
                speechFn(typedResponse?typedResponse:"");
              }
            }}
          />
        )}
    <Drawer>
  <DrawerTrigger className=' px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 text-white rounded-md'>Show Similarity Status</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>The Similarity between the Stories are:</DrawerTitle>

    </DrawerHeader>
      <center>
      {score && <DrawerDescription className=" font-bold text-2xl">{score}</DrawerDescription>}
      </center>
    <DrawerFooter>
      <DrawerClose>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
    </div>
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
