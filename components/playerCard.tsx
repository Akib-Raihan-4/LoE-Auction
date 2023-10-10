'use client'
import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image'

export const PlayerCard = ({ name, url, position, rating, department }: any) => {
  const nameRef = useRef<any>(null);
  const [bottomPosition, setBottomPosition] = useState<any>(null);

  useEffect(() => {
    if (nameRef.current) {
      const nameWidth = nameRef.current.offsetWidth;
      console.log(nameWidth)
      if (nameWidth > 380) {
        setBottomPosition(120); 
      }else if(nameWidth>215 && nameWidth<380){
        setBottomPosition(220)
      }
      else {
        setBottomPosition(270); 
      }
    }
  });

  return (
    <div className='relative'>
      <img src={url} alt="" className='w-[500px] h-[500px] absolute top-36 right-0 z-0' />
      <div className='relative shadow-[15px_10px_40px_10px_rgba(0,0,0,0.5)]'>
        <div>
          <img src="playerCardPNG.png" alt="" className='w-[800px] z-10' />
          <h1
            ref={nameRef}
            className='absolute bottom-[230px] text-white font-extrabold text-2xl'
            style={{ left: bottomPosition }}
          >
            {name}
            {/* Shamsun Nahar Majumder Mahapar */}
            {/* Mohammed Rafidul Islam */}
            {/* Ayesha Binte Hasan Oishee bella  */}
            {/* {rating} */}
            {/* SHAFIN SHAHRIA */}
            {/* MEHEDI SUREM */}
          </h1>
        </div>
        <div>
          <h1 className='absolute top-[250px] left-[55px] text-white font-extrabold text-2xl'>
            Position: {position === 'Goal Keeper' ? 'GK' : position}
            {/* left-[110px] */}
          </h1>
          <h1 className='absolute top-[350px] left-[55px] text-white font-extrabold text-2xl'>
            Category: {rating}
            {/* left-[150px] */}
          </h1>
          <h1 className='absolute top-[450px] left-[55px] text-white font-extrabold text-2xl'>
            Department: {department}
            {/* left-[130px] */}
          </h1>
        </div>
      </div>
    </div>
  );
}
