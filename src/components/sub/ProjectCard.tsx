import Image from "next/image";
import React from "react";

interface Props {
  src: string;
  title: string;
}

const ProjectCard = ({ src, title }: Props) => {
  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg border border-[#2A0E61]  h-[450px]">
      <Image
        src={src}
        alt={title}
        layout="fill"
        objectFit="cover"
        className="object-cover"
      />
    </div>
  );
};

export default ProjectCard;
