import Image from 'next/image'
import  {Auction}  from '@/components/auction'
// 
export default function Home() {
  return (
    <div className='bg-[#e5e5e5]'>
      <Auction/>
      {/* <PlayerCard/> */}
    </div>
  )
}
