'use client';
import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabase';
import {BsCoin} from 'react-icons/bs'
import  {PlayerCard}  from '@/components/playerCard'


const calculatePlayerCounts = async (teamId:any) => {
  const { data: teamPlayers, error: teamPlayersError } = await supabase
    .from('TeamPlayer')
    .select('playerID, playerPrice')
    .eq('teamID', teamId);

  if (teamPlayersError) {
    console.error(teamPlayersError);
    return {
      Icon: 0,
      A: 0,
      B: 0,
      C: 0,
    };
  }

  const counts = {
    Icon: 0,
    A: 0,
    B: 0,
    C: 0,
  };

  for (const teamPlayer of teamPlayers) {
    const { data: playerData, error: playerError } = await supabase
      .from('formPlayer')
      .select('rating')
      .eq('id', teamPlayer.playerID)
      .single();

    if (playerError) {
      console.error(playerError);
      continue; 
    }

    if (playerData.rating === 'Icon') {
      counts.Icon++;
    } else if (playerData.rating === 'A') {
      counts.A++;
    } else if (playerData.rating === 'B') {
      counts.B++;
    } else if (playerData.rating === 'C') {
      counts.C++;
    }
  }

  return counts;
};

export const Auction = () => {
  const [playerData, setPlayerData] = useState<any>([]);
  const [selectedRating, setSelectedRating] = useState<any>('');
  const [showBidModal, setShowBidModal] = useState<any>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<any>(false);
  const [showUnsuccessModal, setShowUnsuccessModal] = useState<any>(false);
  const [bidAmount, setBidAmount] = useState<any>('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>([]);
  const [changes, setChanges] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedGender, setSelectedGender] = useState<any>('');
  const [teamPlayerCounts, setTeamPlayerCounts] = useState<any>({});
  const [maxBids, setMaxBids] = useState<any>([]);

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
    }else if (selectedRating === 'Other Rating' ) {
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

  useEffect(() => {
    const fetchPlayerCounts = async () => {
      const playerCounts:any = {};

      for (const team of teamData) {
        const counts = await calculatePlayerCounts(team.id);
        playerCounts[team.id] = counts;
      }

      setTeamPlayerCounts(playerCounts);
    };

    fetchPlayerCounts();
  });

  const handlePass = async () => {
    if (selectedPlayer) {
      
      const playerRating = selectedPlayer.rating;

      if (playerRating === 'Icon') {
        selectNextRandomPlayer();
      } else if (playerRating === 'A') {
        await updatePlayerRating(selectedPlayer.id, 'B');
        selectNextRandomPlayer();
      } else if (playerRating === 'B') {
        await updatePlayerRating(selectedPlayer.id, 'C');
        selectNextRandomPlayer();
      } else {
        selectNextRandomPlayer();
      }
    }
  };

  const selectNextRandomPlayer = () => {
    const availablePlayers = [...playerData];
  
    const currentPlayerIndex = availablePlayers.findIndex((player) => player.id === selectedPlayer.id);
    if (currentPlayerIndex !== -1) {
      availablePlayers.splice(currentPlayerIndex, 1);
    }
  

    let filteredData = availablePlayers;
    if (selectedRating === 'Icon') {
      filteredData = filteredData.filter((player) => player.rating === 'Icon');
    } else if (selectedRating === 'Other Rating') {
      filteredData = filteredData.filter((player) => player.rating !== 'Icon');
    }
  
    if (selectedGender) {
      filteredData = filteredData.filter((player) => player.gender === selectedGender);
    }
  
    if (filteredData.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredData.length);
      setSelectedPlayer(filteredData[randomIndex]);
    } else {
      setSelectedPlayer(null);
    }
  };
  

  const updatePlayerRating = async (playerId: any, newRating: any) => {
    try {

      const startingBidValues:any = {
        'A': 600,
        'B': 300,
        'C': 200,
      };

      await supabase
        .from('formPlayer')
        .update({ rating: newRating, startingBid: startingBidValues[newRating] })
        .eq('id', playerId);
  

      const updatedPlayerData = playerData.map((player: any) => {
        if (player.id === playerId) {
          return { ...player, rating: newRating, startingBid: startingBidValues[newRating] };
        }
        return player;
      });
  
      setPlayerData(updatedPlayerData);
  
      selectNextRandomPlayer();
  
    } catch (error) {
      console.error('Error updating player rating:', error);
    }
  };
  
  
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


  const calculateMaxBidForTeam = async (team, selectedPlayer) => {
    // Define bid values for player ratings
    const bidValues = {
      A: 600,
      B: 300,
      C: 200,
    };
  
    try {
      // Calculate the number of players in each category for the team
      const playerCounts = await calculatePlayerCounts(team.id);
  
      // Copy the team's remaining budget
      let remainingBudget = team.teamAmount;
  
      // Deduct from maxBid based on team constraints
      if (playerCounts.A === 0) {
        remainingBudget -= bidValues.A;
      }
      if (playerCounts.B === 0) {
        remainingBudget -= bidValues.B;
      }
      if (playerCounts.C === 0) {
        remainingBudget -= 4 * bidValues.C;
      } else if (playerCounts.C === 1) {
        remainingBudget -= 3 * bidValues.C;
      } else if (playerCounts.C === 2) {
        remainingBudget -= 2 * bidValues.C;
      } else if (playerCounts.C === 3) {
        remainingBudget -= bidValues.C;
      }
  
      // Update the maxBid value in the database
      await supabase
        .from('Team')
        .update({ maxBid: remainingBudget })
        .eq('id', team.id);
  
      return remainingBudget;
    } catch (error) {
      console.error('Error calculating max bid for team:', error);
      return team.teamAmount; // Return team's full budget in case of an error
    }
  };
  
  
  
  // Inside your component or function, you can call the function like this:
  useEffect(() => {
    if (selectedPlayer) {
      const calculateMaxBids = async () => {
        const maxBids = [];
        for (const team of teamData) {
          const maxBid = await calculateMaxBidForTeam(team, selectedPlayer);
          maxBids.push(maxBid);
        }
        setMaxBids(maxBids);
      };
  
      calculateMaxBids();
    }
  });
  
  
  // {console.log(teamData)}
  
  return (
    <div className='max-w-[1440px] w-screen flex sm:mx-auto mx-10'>
        <div className='w-[60%] h-screen flex flex-col mt-40 items-center'>
            <div className='w-[800px]'>
              <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className='mb-6 shadow-xl bg-[#4f6d79] text-white font-bold w-full text-center rounded-[20px]'>
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
              <select value={selectedRating} onChange={handleRatingChange} className='mt-6  shadow-xl bg-[#4f6d79] text-white font-bold w-full text-center rounded-[20px]'>
                <option value="">All Rating</option>
                <option value="Icon">Icon</option>
                <option value="Other Rating">Other Rating</option>
              </select>
            </div>
        </div>


        <div className='flex flex-col mt-40 w-[40%]'>
          <h2 className='font-bold text-center mb-4'>Teams:</h2>
          <table className='w-full border-collapse border border-black'>
            <thead>
              <tr>
                <th className='w-32 border border-black px-4 py-2'>Team Name</th>
                <th className='w-32 border border-black px-4 py-2'>Manager</th>
                <th className='w-32 border border-black px-4 py-2'>Available Coin</th>
                <th className='w-32 border border-black px-4 py-2'>Max Bid</th>
              </tr>
            </thead>
            <tbody>
              {teamData
                .filter((team:any) => selectedGender === '' || team.teamGender === selectedGender)
                .map((team:any, index:any) => (
                  <tr key={team.id}>
                    <td className='border border-black px-4 py-2'>
                      <button
                        onClick={() => handleTeamClick(team.id)}
                        className='bg-blue-500 text-white w-24 px-2 py-1 rounded hover:bg-blue-600'
                      >
                        {team.teamName}
                      </button>
                    </td>
                    <td className='border border-black px-4 py-2'>{team.teamManager}</td>
                    <td className='border border-black px-4 py-2'>{team.teamAmount}</td>
                    <td className='border border-black px-4 py-2'>{team.maxBid}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className='w-full'>
            <button
              className='px-4 py-2 w-full mt-4 bg-red-500 text-white hover:bg-red-600 rounded-[30px]'
              onClick={handlePass}
            >
              Pass
            </button>
          </div>
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
