import React, { useState, useEffect, useRef } from 'react';
import { IoIosMic } from 'react-icons/io';

interface Props {
  onTranscript: (transcript: string) => void;
}

const SpeechRecognition: React.FC<Props> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.log("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;

    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      onTranscript(text);
    };

    recognition.onerror = (event: any) => {
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
  }, [onTranscript]);

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
    <IoIosMic
      color='white'
      size={40}
      className='ml-10 cursor-pointer'
      onClick={handleButtonClick}
    />
  );
};

export default SpeechRecognition;
