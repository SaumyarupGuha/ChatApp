import React, { useState } from 'react'
import assets from '../assets/assets'

const LoginPage = (selectedUser) => {

  const[currState, setCurrState] = useState("Sign up")
  const[fullName, setFullName] = useState("")
  const[email, setEmail] = useState("")
  const[password, setPassword] = useState("")
  const[bio, setBio] = useState("")
  const[isDataSubmitted, setIsDataSubmitted] = useState(false);

  return  (
    <div className='min-h-screen bg-cover bg-center flex items-center 
    justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>

    {/* ---- left ---- */ }
    <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)]'/>
      
    {/* ---- right ----*/}
    <form className='border-2 bg-white/8 text-white border-gray-500 p-6 flex 
    flex-col gap-6 rounded-lg shadow-lg'>
      <h2>
        {currState}
        <img src={assets.arrow_icon} alt="" className='w-5 cursor-poiter'/>
      </h2>

      {currState === "Sign up" && !isDataSubmitted && (
        <input type="text" onChange={(e)=>setFullName(e.target.value)} value={fullName} className='p-2 border border-gray-500 rounded-md
         focus:outline-none focus:ring-2 focus:ring-indigo-500' placeholder="Full Name" required />
      )}

      {!isDataSubmitted && (
        <>
          <input type="email" onChange={(e)=>(setEmail(e.target.value), console.log(email))} value={email}  placeholder='Email Address' required className='p-2 border 
          border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'/>
          
          <input type="password" onChange={(e)=>setPassword(e.target.value)} value={password}
           placeholder='Password' required className='p-2 border border-gray-500 
          rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' />
        </>
      )}  

      {
        currState === "Sign up" && isDataSubmitted && (
          <textarea rows={4} className='p-2 border border-gray-500 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-indigo-500' />
        )
      }


    </form>
    </div>
  )
}

export default LoginPage