"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";

interface Props {}

function LoginPage(props: Props) {
  const {} = props;
  const [info, setInfo] = useState({email: '', password: '' });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router=useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!info.email || !info.password ) {
      setError("Please enter every detail");
    } else {
      try {
        setPending(true);
          const res=await signIn("credentials",{
            email:info.email,
            password:info.password,
            
            redirect:false
          })
          const data=res?.status
          console.log(data);
          if(res?.status===401){
            setError("Invalid Credential");
            setPending(false);
            return;
          }
          else{
            router.replace("/");
          }
      } catch (error: any) {
        setPending(false);
        setError(error.message);
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <div className="relative z-30"> 
        <form
          className='relative top-24 flex flex-col gap-5'
          onSubmit={handleSubmit}
        >
        
          <div>
            <input
              type='email'
              name='email'
              placeholder='Enter Your Email'
              onChange={handleInput}
              required
              className='z-30'
            />
          </div>
          <div>
            <input
              type='password'
              name='password'
              placeholder='Enter Your Password'
              onChange={handleInput}
              required
              className='z-30'
            />
          </div>
          <button 
            type='submit' 
            className='text-white bg-blue-500 p-2 mt-4 z-30' 
          >
            Login
          </button>
          {error && <span className='text-white'>{error}</span>}
          {pending && <span className='text-white'>Loading...</span>}
        </form>
      </div>
    </>
  );
}

export default LoginPage;
