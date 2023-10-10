'use client';
import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabase';
import {BsCoin} from 'react-icons/bs'
import  {PlayerCard}  from '@/components/playerCard'

export const Auction = () => {
  const [playerData, setPlayerData] = useState<any>([]);
  const [selectedRating, setSelectedRating] = useState<any>('');
  const [showBidModal, setShowBidModal] = useState<any>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<any>(false);
  const [showUnsuccessModal, setShowUnsuccessModal] = useState<any>(false);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>([]);
  const [changes, setChanges] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<any>(null)
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedGender, setSelectedGender] = useState('');

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
  },[]);

  useEffect(() => {
    let filteredData = playerData;
  
    if (selectedRating === 'Icon') {
      filteredData = filteredData.filter((player:any) => player.rating === 'Icon');
    }else if (selectedGender=='Male' && selectedRating === 'Other Rating' ) {
      filteredData = filteredData.filter((player: any) => player.rating !== 'Icon');
    }
  
    if (selectedGender) {
      filteredData = filteredData.filter((player:any) => player.gender === selectedGender);
    }
  
    if (filteredData.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredData.length);
      setSelectedPlayer(filteredData[randomIndex]);
    } else {
      setSelectedPlayer(null);
    }
  }, [selectedRating, selectedGender, playerData]);
  

  const handleBidSubmission = async (bidAmount:any) => {
    if (selectedPlayer) {
      try {
        const { data: team, error: teamError } = await supabase
          .from('Team')
          .select('teamAmount')
          .eq('id', selectedTeamId)
          .single();

        if (teamError) {
          console.error(teamError);
          return;
        }
        const currentAmount = team.teamAmount;
        if (currentAmount - bidAmount < 0) {
            console.error('Team does not have enough funds for this bid.');
            setShowBidModal(false)
            setShowUnsuccessModal(true)
            return;
        }
    

        const updatedAmount = Math.max(currentAmount - bidAmount, 0);
        const { error: updateError } = await supabase
          .from('Team')
          .update({ teamAmount: updatedAmount })
          .eq('id', selectedTeamId);

        if (updateError) {
          console.error(updateError);
          return;
        }

        const updatedTeamData = [...teamData];
        const teamIndex = updatedTeamData.findIndex((team) => team.id === selectedTeamId);
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
              teamID: selectedTeamId,
              playerID: selectedPlayer.id,
              playerPrice: bidAmount,
            },
          ])

        if (teamPlayerError) {
          console.error(teamPlayerError)
          return;
        }
        setBidAmount("")
        setShowBidModal(false)
        setShowSuccessModal(true)
      } catch (error) {
        console.error('Supabase error:', error);
      }
    }
  };

  const handleTeamClick = async (teamId:any) => {
    setSelectedTeamId(teamId);
    setShowBidModal(true);
    const team = teamData.find((team:any) => team.id === teamId);
    setSelectedTeam(team);
  };

  const handleRatingChange = (event:any) => {
    setSelectedRating(event.target.value);
  };

  const handleClose = () =>{
    setShowSuccessModal(false)
    setChanges(Date.now())
  }
  return (
    <div className='max-w-[1440px] w-screen flex sm:mx-auto mx-10'>
        <div className='w-[80%] h-screen flex flex-col mt-40 items-center'>
            <div className='w-[800px] '>
              <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className='mb-6 shadow-xl bg-[#4f6d79] text-white font-bold w-full'>
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
              </select>
            </div>
            {selectedPlayer && (
                <>
                  <PlayerCard name={selectedPlayer.name} url={selectedPlayer.image} position={selectedPlayer.position} rating={selectedPlayer.rating} department={selectedPlayer.department}/>
                </>
            )}
            <div className='w-[800px] '>
              <select value={selectedRating} onChange={handleRatingChange} className='mt-6  shadow-xl bg-[#4f6d79] text-white font-bold w-full'>
                <option value="">Select Rating</option>
                <option value="Icon">Icon</option>
                <option value="Other Rating">Other Rating</option>
              </select>
            </div>
        </div>


        <div className='flex flex-col mt-40 w-[20%]'>
          <h2 className='font-bold text-center mb-4'>Teams:</h2>
          <table className='w-full border-collapse border border-black'>
            <thead>
              <tr>
                <th className='w-32 border border-black px-4 py-2'>Team Name</th>
                <th className='w-32 border border-black px-4 py-2'>Team Amount</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map((team:any) => (
                <tr key={team.id}>
                  <td className='border border-black px-4 py-2'>
                    <button
                      onClick={() => handleTeamClick(team.id)}
                      className='bg-blue-500 text-white w-32 px-2 py-1 rounded hover:bg-blue-600'
                    >
                      {team.teamName}
                    </button>
                  </td>
                  <td className='border border-black px-4 py-2'>{team.teamAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showBidModal && (
            <div className='fixed inset-0 flex items-center justify-center z-50'>
                <div className='modal-overlay absolute inset-0 bg-black opacity-50'></div>
                <div className='modal-container bg-white w-96 mx-auto rounded shadow-lg z-50'>
                <div className='modal-content p-4'>
                    <h2 className='text-xl mb-4'><span className='font-bold'>{selectedTeam && selectedTeam.teamName}</span> has placed the winning bid for player <span className='font-bold'>{selectedPlayer && selectedPlayer.name}</span> </h2>
                    <input
                    type='number'
                    className='w-full p-2 border rounded mb-4'
                    placeholder='Bid Amount'
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <div className='flex justify-end'>
                    <button
                        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2'
                        onClick={() => handleBidSubmission(bidAmount)}
                    >
                        Submit Bid
                    </button>
                    <button
                        className='px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
                        onClick={() => setShowBidModal(false)}
                    >
                        Cancel
                    </button>
                    </div>
                </div>
                </div>
            </div>
            
        )}
        {showSuccessModal && (
            <div className='fixed inset-0 flex items-center justify-center z-50'>
                <div className='modal-overlay absolute inset-0 bg-black opacity-50'></div>
            
                <div className='modal-container bg-white w-96 mx-auto rounded shadow-lg z-50'>
                <div className='modal-content p-4'>
                    <h2 className='text-xl font-bold mb-2'>Successful Bid</h2>
                    <p className='mb-4'>
                    Congratulations <span className='font-bold'>{selectedTeam && selectedTeam.teamName}</span> on buying <span className='font-bold'>{selectedPlayer && selectedPlayer.name}</span>.
                    </p>
                    <button
                    className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    onClick={handleClose}
                    >
                    Close
                    </button>
                </div>
                </div>
            </div>
        )}
        {showUnsuccessModal && (
            <div className='fixed inset-0 flex items-center justify-center z-50'>
                <div className='modal-overlay absolute inset-0 bg-black opacity-50'></div>
            
                <div className='modal-container bg-white w-96 mx-auto rounded shadow-lg z-50'>
                <div className='modal-content p-4'>
                    <h2 className='text-xl font-bold mb-2'>Successful Bid</h2>
                    <p className='mb-4 text-red-600'>
                    Sorry <span className='font-bold'>{selectedTeam && selectedTeam.teamName}</span> does not have enough coins for buying <span className='font-bold'>{selectedPlayer && selectedPlayer.name}</span>.
                    </p>
                    <button
                    className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    onClick={()=>setShowUnsuccessModal(false)}
                    >
                    Close
                    </button>
                </div>
                </div>
            </div>
        )}
    </div>
  );
};
