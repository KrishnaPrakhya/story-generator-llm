import React, { useState, useEffect,useRef } from 'react';
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IoIosPause, IoIosPlay,IoIosMic  } from "react-icons/io";
import SpeechRecognition from './TextToSpeech';

interface Props {}

function FineTune(props: Props) {
  const {} = props;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [score, setScore] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [typedResponse, setTypedResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null); 
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

  useEffect(() => {
    let index = 0;
    if (response) {
      const interval = setInterval(() => {
        setTypedResponse((prev) => prev + response.charAt(index));
        index++;
        if (index === response.length) {
          clearInterval(interval);
        }
      }, 5);
      return () => clearInterval(interval);
    }
  }, [response]);
let count=0;
  const handleQuerySubmit = async () => {
    setLoading(true);
    setTypedResponse("");
    try {
      const res = await fetch("http://127.0.0.1:8080/fine_tuned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, genre }),
      });
      const data = await res.json();
      setResponse(data.Answer);
      setScore(data.Score);
      if (data.status === 500) {
        setResponse("Input Is Too Short For Processing The Story!");
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("Input Is Too Short For Processing The Story!");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (window.speechSynthesis.speaking) {
      setIsSpeaking(true);
    } else {
      setIsSpeaking(false);
    }
  }, [count]);

  return (
    <>
      <div className=" z-30 w-full flex">
        <motion.div initial={{ x: -200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.5 }} className="mb-4 w-1/2">
          <p className='text-white'>Prompt:</p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your Suggestions on the story..."
            className="w-full p-2 border rounded-md text-white glass-effect"
            rows={18} cols={100}
          />
        </motion.div>
        <motion.div initial={{ x: 200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.5 }} className="text-white w-1/2 h-full">
          <p>Response:</p>
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
      <div className='flex justify-between'>
        <div className='flex'>
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

        </div>
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
          className="px-4 py-2 ml-28 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 text-white rounded-md"
        >
          Submit
        </button>
        <div className='flex'>
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
                console.log("hi")
              }
            }}
          />
        )}
          <Drawer>
            <DrawerTrigger className=' px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 text-white rounded-md'>
              Show Similarity Status
            </DrawerTrigger>
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
      </div>

      <style jsx>{`
        .loader {
          border: 4px solid rgba(9, 7, 0, 0.1);
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

export default FineTune;
