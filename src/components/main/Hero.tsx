"use client"
import React, { useEffect, useRef } from "react";
import HeroContent from "../sub/HeroContent";

const Hero = () => {

  useEffect(() => {
  }, []);

  return (
    <div className="relative flex flex-col h-screen w-full" id="vanta" >
      <HeroContent />
    </div>
  );
};

export default Hero;
