"use client"
import React, { useState, useRef, useEffect } from 'react';

interface Props {
  options: {
    interimResults?: boolean;
    lang?: string;
    continuous?: boolean;
  };
}

function Page({ options }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.log("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;

    recognition.interimResults = options?.interimResults ?? true;
    recognition.lang = options?.lang ?? "en-US";
    recognition.continuous = options?.continuous ?? false;

    recognition.onresult = (event:any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event:any) => {
      console.error("Speech recognition error: ", event);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("Speech recognition ended.");
    };

    return () => {
      recognition.stop();
      console.log("Speech recognition stopped.");
    };
  }, [options]);

  const handleButtonClick = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  return (
    <div className='flex flex-row justify-center items-center w-full h-full absolute'>
      <div className='flex flex-col justify-center items-center'>
        <textarea
          cols={50}
          rows={20}
          value={transcript}
          readOnly
          className='border p-2'
        ></textarea>
        <button
          onClick={handleButtonClick}
          className='bg-[#00df9a] p-4 rounded-lg cursor-pointer translate-x-3 mt-4'
        >
          {isListening ? 'Stop' : 'Speak'}
        </button>
      </div>
    </div>
  );
}

export default Page;
