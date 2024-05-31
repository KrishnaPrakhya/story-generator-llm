"use client";
import Hero from "@/components/main/Hero";
import Projects from "@/components/main/Projects";
import About from "@/components/main/About";
import StarsCanvas from "@/components/main/StarBackground";
import { useSession } from "next-auth/react";
import Footer from "@/components/main/Footer";
export default  function Home() {
  const {data:session}=useSession();
  if (session) {
    console.log('Logged in as:', session?.user?.name);
    console.log('Email:', session?.user?.email);
  return (
    <>
      <div className="h-full w-full">
        <div className="flex flex-col gap-20">
          <StarsCanvas />
          <Hero />
          <Projects />
          <About />
        </div>
        <Footer/>
      </div>
    </>
  );
  }
}
