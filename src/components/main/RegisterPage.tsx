"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
interface Props {}

function RegisterPage(props: Props) {
  const {} = props;
  const [info, setInfo] = useState({ userName: '', email: '', password: '' });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router=useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!info.email || !info.password || !info.userName) {
      setError("Please enter every detail");
    } else {
      try {
        setPending(true);
        const res = await fetch("/api/register", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(info),
        });
        console.log(res);
        if (res.status===201) {
          setPending(false);
          const data = await res.json();
          console.log("User registered:", data);
          setError("");
          router.push("/login");
          
        } else {
          const errData = await res.json();
          setError(errData.message);
          setPending(false);
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
          <h1 className="p-3 login-title text-7xl bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500"><span className='text-4xl font-bold'>Register</span></h1>
            <input
              type='text'
              name='userName'
              placeholder='Enter Your UserName'
              onChange={handleInput}
              className='z-30 login-input'
            />
          </div>
          <div>
            <input
              type='email'
              name='email'
              placeholder='Enter Your Email'
              onChange={handleInput}
              required
              className='z-30 login-input'
            />
          </div>
          <div>
            <input
              type='password'
              name='password'
              placeholder='Enter Your Password'
              onChange={handleInput}
              required
              className='z-30 login-input'
            />
          </div>
          <button 
            type='submit' 
            className='text-white bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 p-2 mt-4 z-30 rounded-lg' 
          >
            Register
          </button>
          {error && <span className='text-white'>{error}</span>}
          {pending && <span className='text-white'>Loading...</span>}
        </form>
      </div>
    </>
  );
}

export default RegisterPage;
