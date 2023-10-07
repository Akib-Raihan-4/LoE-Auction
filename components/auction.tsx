"use client"
import React, { useState, useEffect, useMemo } from 'react';
import supabase from '@/config/supabase';

export const Auction = () => {
    const [teamData, setTeamData] = useState<any>([])
    const [playerData, setPlayerData] = useState<any>([])
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [randomPlayer, setRandomPlayer] = useState(null);
    useEffect(()=>{
        const fetchTeam = async() => {
            const {data, error} = await supabase
                .from('Team')
                .select('*')
            
            if(error){
                console.error(error)
            }else{
                setTeamData(data || [])
            }
        }
        const fetchPlayer = async() =>{
            const {data,error} = await supabase
                .from('formPlayer')
                .select('*')
                .eq('verified', true);
            if(error){
                console.error(error)
            }else{
                setPlayerData(data || [])
            }
        }
        fetchPlayer()
        fetchTeam()
    })
    

    
    
  return (
    <div className='w-[1440px] flex justify-between mx-auto'>
        <div className=''>
            
        </div>
        <div className=''>
            {teamData.map((team: any)=>(
                <div className='flex gap-8'>
                    <p>{team.teamName}</p>
                    <p>{team.teamAmount}</p>
                </div>
            ))}
        </div>
    </div>
  )
}
