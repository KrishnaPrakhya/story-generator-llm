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
            <input
              type='text'
              name='userName'
              placeholder='Enter Your UserName'
              onChange={handleInput}
              className='z-30'
            />
          </div>
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
