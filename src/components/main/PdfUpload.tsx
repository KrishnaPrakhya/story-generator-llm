"use client";
import React, { useState } from "react";
import Chatbot from "./ChatBot";
// import Footer from "./Footer";
export default function UploadPdf() {
  const [story,setStory]=useState("");
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [fName, setFname] = useState("");

  const handleFileChange = (e:any) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8080/pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log(data)
      setUploadStatus(`Upload successful: ${data.fileName}`);
      setFname(data.fileName);
      setStory(data.extracted_story);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("Upload failed.");
    }
  };

  return (
    <>
      <div className="flex space-x-4 p-4 bg-white bg-opacity-10 rounded-lg shadow-lg">
        <input
          type="file"
          onChange={handleFileChange}
          className="p-3 text-white bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-md"
        />
        <button
          onClick={handleFileUpload}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white rounded-md transition duration-300"
        >
          Upload PDF
        </button>
      </div>
      <div className="mt-4 text-white">
        <p>Status: {uploadStatus}</p>
      </div>
      {fName && (
        <div className="mt-5 w-full">
          <Chatbot nameFile={fName} extractedStory={story} />
        </div>
      )}
      {/* <Footer /> */}

    </>
  );
}
