'use client';
import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabase';

export const Auction = () => {
  const [playerData, setPlayerData] = useState<any>([]);
  const [selectedRating, setSelectedRating] = useState<any>('');
  const [showBidModal, setShowBidModal] = useState<any>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<any>(false);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>([]);
  const [changes, setChanges] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<any>(null)
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

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

        const updatedAmount = team.teamAmount - bidAmount;
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
            },
          ]);

        if (teamPlayerError) {
          console.error(teamPlayerError);
          return;
        }
        setChanges(Date.now()); 
        setBidAmount("")
        setShowBidModal(false);
        setShowSuccessModal(true);
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

            {showBidModal && (
                <div className='fixed inset-0 flex items-center justify-center z-50'>
                    <div className='modal-overlay absolute inset-0 bg-black opacity-50'></div>
                    <div className='modal-container bg-white w-96 mx-auto rounded shadow-lg z-50'>
                    <div className='modal-content p-4'>
                        <h2 className='text-xl font-bold mb-4'>Place a Bid for Player {selectedPlayer && selectedPlayer.name}</h2>
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
                        onClick={() => setShowSuccessModal(false)}
                        >
                        Close
                        </button>
                    </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
