"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import StarsCanvas from './StarBackground';

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
    <StarsCanvas/>
      <div className="login-container z-30"> 
      <div className="login-form-wrapper"> 
        <h1 className="p-3 login-title text-7xl bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500"><span className='text-4xl font-bold'>Login</span></h1> 
        <form className="login-form" onSubmit={handleSubmit}> 
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter Your Email"
              onChange={handleInput}
              required
              className="login-input"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter Your Password"
              onChange={handleInput}
              required
              className="login-input"
            />
          </div>
          <button type="submit" className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 w-full p-3 rounded-lg text-white text-xl mt-2">
            <p>{pending ? "Loading..." : "Login"}</p>
          </button>
          {error && <span className="error-message">{error}</span>}
        </form>
      </div>
    </div>
    </>
  );
}

export default LoginPage;
