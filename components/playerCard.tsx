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
      if (nameWidth > 200) {
        setBottomPosition(70); 
      } else {
        setBottomPosition(144); 
      }
    }
  }, [name]);

  return (
    <div className='relative'>
      <img src={url} alt="" className='w-[500px] h-[500px] absolute top-36 right-0 z-0' />
      <div className='relative shadow-[15px_10px_40px_10px_rgba(0,0,0,0.5)]'>
        <img src="playerCardPNG.png" alt="" className='w-[800px] z-10' />
        <h1
          ref={nameRef}
          className='bottom-[132px] text-black absolute font-bold'
          style={{ left: bottomPosition }}
        >
          {name}
          {rating}
        </h1>
      </div>
    </div>
  );
}
