"use client";
import React from "react";
import ProjectCard from "../sub/ProjectCard";
import { motion } from "framer-motion";
import feature1 from "@/assets/Design.png";
import feature2 from "@/assets/Designer1.jpeg";
import feature3 from "@/assets/Designer2.jpeg";

const Projects = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20" id="projects">
      <h1 className="text-[40px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 py-20">
        Our Features
      </h1>
      <div className="flex flex-col gap-10 px-10">
        <motion.div
          initial={{ x: -500, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="flex w-full justify-end"
        >
          <p className="mt-2 text-gray-300 w-1/2">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam repellendus ipsam natus expedita ratione perspiciatis rerum id at iure deserunt voluptate dolorem, quo recusandae aspernatur sequi architecto. Perferendis, error aspernatur!
          </p>
          <div className="w-full md:w-1/2">
            <ProjectCard src={feature2.src} title="Modern Next.js Portfolio" />
          </div>
        </motion.div>
        <motion.div
          initial={{ x: 500, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="flex w-full justify-start"
        >
          <div className="w-full md:w-1/2">
            <ProjectCard src={feature1.src} title="Interactive Website Cards" />
          </div>
          <p className="mt-2 text-gray-300 w-1/2 ml-5">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam repellendus ipsam natus expedita ratione perspiciatis rerum id at iure deserunt voluptate dolorem, quo recusandae aspernatur sequi architecto. Perferendis, error aspernatur!
          </p>
        </motion.div>
        <motion.div
          initial={{ x: -500, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="flex w-full justify-end"
        >
          <p className="mt-2 text-gray-300 w-1/2">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam repellendus ipsam natus expedita ratione perspiciatis rerum id at iure deserunt voluptate dolorem, quo recusandae aspernatur sequi architecto. Perferendis, error aspernatur!
          </p>
          <div className="w-full md:w-1/2">
            <ProjectCard src={feature3.src} title="Space Themed Website" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Projects;
