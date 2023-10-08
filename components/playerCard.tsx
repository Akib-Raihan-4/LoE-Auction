'use client'
import React, { useRef, useEffect, useState } from 'react';

export const PlayerCard = ({ name, url, position, rating, department }: any) => {
  const nameRef = useRef<any>(null);
  const [bottomPosition, setBottomPosition] = useState<any>(null);

  useEffect(() => {
    if (nameRef.current) {
      const nameWidth = nameRef.current.offsetWidth;
      console.log(nameWidth)
      if (nameWidth > 200) {
        setBottomPosition(70); // Adjust this value as needed
      } else {
        setBottomPosition(144); // Default value
      }
    }
  }, [name]);

  return (
    <>
      <div className='relative overflow-hidden shadow-[15px_10px_40px_10px_rgba(0,0,0,0.5)]'>
        <img src="playerCardPNG.png" alt="" className='w-[470px] z-10' />
        <img src={url} alt="" className='absolute top-20 -right-2 w-[310px] h-[350px] object-contain -z-10' />
        <h1
          ref={nameRef}
          className='absolute bottom-[132px] text-white font-bold'
          style={{ left: bottomPosition }}
        >
          {/* Ayesha Binte Hasan Oishee bella */}
          {/* Shamsun Nahar Majumder Mahapar */}
          {name}
        </h1>
      </div>
    </>
  );
};
