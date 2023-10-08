'use client'
import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabase';

export const Auction = () => {
  const [playerData, setPlayerData] = useState<any>([]);
  const [selectedRating, setSelectedRating] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>([]);
  const [changes, setChanges] = useState<any>();
  
  useEffect(() => {
    const fetchPlayerData = async () => {
      const { data: playersData, error: playersError } = await supabase
        .from('formPlayer')
        .select('*')
        .eq('verified', true)
        .eq('selected', false);
      
      if (playersError) {
        console.error(playersError);
      } else {
        setPlayerData(playersData || []);
      }
    };

    fetchPlayerData();
  }, [changes]);

  useEffect(() => {
    const fetchTeamData = async () => {
      const { data: teamsData, error: teamsError } = await supabase
        .from('Team')
        .select('*');
      
      if (teamsError) {
        console.error(teamsError);
      } else {
        setTeamData(teamsData || []);
      }
    };

    fetchTeamData();
  }, []);

  useEffect(() => {
    
    let filteredData = playerData;


    if (selectedRating) {
      filteredData = filteredData.filter((player:any) => player.rating === selectedRating);
    }


    if (filteredData.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredData.length);
      setSelectedPlayer(filteredData[randomIndex]);
    } else {
      setSelectedPlayer(null);
    }
  }, [selectedRating, playerData]);

  const handleTeamClick = async (teamId:any) => {
    setShowBidForm(true);
  
    if (selectedPlayer) {
      
      const inputAmount = prompt(`Enter the bid amount for ${selectedPlayer.id}`);
      
      if (inputAmount !== null) {
        
        const bidAmountNumber = parseFloat(inputAmount);
  
        if (!isNaN(bidAmountNumber)) {
          try {
           
            const { data: team, error: teamError } = await supabase
              .from('Team')
              .select('teamAmount')
              .eq('id', teamId)
              .single();
            
            if (teamError) {
              console.error(teamError);
              return; 
            }
  
        
            const updatedAmount = team.teamAmount - bidAmountNumber;
            const { error: updateError } = await supabase
              .from('Team')
              .update({ teamAmount: updatedAmount })
              .eq('id', teamId);
            
            if (updateError) {
              console.error(updateError);
              return; 
            }
  
           
            const updatedTeamData = [...teamData];
            const teamIndex = updatedTeamData.findIndex((team) => team.id === teamId);
            if (teamIndex !== -1) {
              updatedTeamData[teamIndex].teamAmount = updatedAmount;
              setTeamData(updatedTeamData);
            }
  
            
            const { data: playerData, error: playerError } = await supabase
              .from('formPlayer')
              .update({ selected: true })
              .eq('id', selectedPlayer.id);
  
            if (playerError) {
              console.error(playerError);
              return; 
            }
  
            const { error: teamPlayerError } = await supabase
              .from('TeamPlayer')
              .upsert([
                {
                  teamID: teamId,
                  playerID: selectedPlayer.id,
                },
              ]);
  
            if (teamPlayerError) {
              console.error(teamPlayerError);
              return; 
            }
            setChanges(Date.now()); 
            setShowBidForm(false);
          } catch (error) {
            console.error('Supabase error:', error);
          }
        }
      }
    }
  };
  
  const handleRatingChange = (event:any) => {
    setSelectedRating(event.target.value);
  };

  return (
    <div className='w-[1440px] flex mx-auto'>
      
        <div className='w-[80%] h-screen flex flex-col justify-center items-center'>


            {selectedPlayer && (
                <div className='w-[40%]'>
                    <div className='bg-gray-400 shadow-[15px_10px_40px_10px_rgba(0,0,0,0.5)] mx-auto px-10 my-auto '>
                        <div className="py-4 my-2">
                            <img
                                className="object-center object-cover rounded-full h-40 w-40 mx-auto "
                                src={selectedPlayer.image}
                                alt="photo"
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-xl text-gray-800 font-bold mb-2">{selectedPlayer.name}</p>
                            <p className="text-lg text-gray-700 font-bold">{selectedPlayer.id}</p>
                            <p className="text-md text-gray-600 font-semibold">{selectedPlayer.position}</p>
                            <p className="text-md text-gray-600 font-semibold">{selectedPlayer.department}</p>
                            <p className="text-md text-gray-600 font-semibold">Rating: {selectedPlayer.rating}</p>
                        </div>
                    </div>
                </div>
            )}

            <select value={selectedRating} onChange={handleRatingChange} className='mt-6 w-[40%]'>
                <option value="">All Ratings</option>
                <option value="Icon">Icon</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
            </select>
        </div>


        <div className='flex flex-col justify-center'>
            <h2 className='font-bold'>Teams:</h2>
            <ul>
                {teamData.map((team:any) => (
                <li key={team.id}>
                    <button onClick={() => handleTeamClick(team.id)}>
                    {team.teamName} - {team.teamAmount} coins
                    </button>
                </li>
                ))}
            </ul>

            {showBidForm && (
                <div className='bid-form'>
                <h2>Place a Bid for Player {selectedPlayer && selectedPlayer.name}</h2>
                <input
                    type='number'
                    placeholder='Bid Amount'
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                />
                <button onClick={handleTeamClick}>Submit Bid</button>
                </div>
            )}
        </div>
    </div>
  );
};
