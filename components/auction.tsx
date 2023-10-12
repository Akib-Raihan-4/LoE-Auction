'use client';
import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabase';
import { PlayerCard } from '@/components/playerCard';

const calculatePlayerCounts = async (teamId:any) => {
  const { data: teamPlayers, error: teamPlayersError } = await supabase
    .from('TeamPlayer')
    .select('playerID, playerPrice')
    .eq('teamID', teamId);

  console.log(teamPlayers)
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
  // const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<any>(null);
  const [teamPlayerCounts, setTeamPlayerCounts] = useState<any>({});

  const [selectedTeamId, setSelectedTeamId] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedGender, setSelectedGender] = useState<any>('');

  useEffect(() => {
    const fetchPlayerData = async () => {
      const { data: playersData, error: playersError } = await supabase
        .from('formPlayer')
        .select('*')
        .eq('verified', true)
        .eq('selected', false)
        .eq('gender', 'Male');
  
      if (playersError) {
        console.error(playersError);
      } else {
        setPlayerData(playersData || []);
      }
    };
  
    fetchPlayerData();
  }, [changes]);

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
  },[changes]);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const { data: teamsData, error: teamsError } = await supabase
          .from('Team')
          .select('*')
          .order('id', { ascending: true }); 
    
        if (teamsError) {
          console.error(teamsError);
        } else {
          setTeamData(teamsData || []);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    };
    
    fetchTeamData();
  });

  const calculateMaxBid = async (bidAmount:any = 0, selectedTeamId:any, selectedPlayer:any) => {

    if(selectedPlayer){
      const bidValues = {
        'A': 600,
        'B': 300,
        'C': 200,
      };
    
      const { data: teams, error: teamsError } = await supabase
        .from('Team')
        .select('*')
        .eq('id',selectedTeamId);
      if (teamsError) {
        console.error(teamsError);
        return;
      }
    
      for (const team of teams) {
        const teamID = team.id;
    
        const { data: teamPlayers, error: teamPlayersError } = await supabase
          .from('TeamPlayer')
          .select('playerID')
          .eq('teamID', teamID);
    
        if (teamPlayersError) {
          console.error(teamPlayersError);
          return;
        }
    
        const playerRatings = {
          'Icon':0,
          'A': 0,
          'B': 0,
          'C': 0,
        };
    
        for (const player of teamPlayers) {
          const { data: playerData, error: playerError } = await supabase
            .from('formPlayer')
            .select('rating')
            .eq('id', player.playerID)
            .single();
    
          if (playerError) {
            console.error(playerError);
            return;
          }
    
          if (playerData.rating === 'A') {
            playerRatings['A']++;
          } else if (playerData.rating === 'B') {
            playerRatings['B']++;
          } else if (playerData.rating === 'C') {
            playerRatings['C']++;
          }
        }
    
        let remainingBudget = team.teamAmount - bidAmount;

        let minReq = 1700

        let countA = playerRatings['A']
        let countB = playerRatings['B']
        let countC = playerRatings['C']

        let current = selectedPlayer.rating

        let extraCount = 0


        if (countA > 0) {
          minReq -= 600;
          extraCount += countA - 1;
        }
        if (countB > 0) {
          minReq -= 300;
          extraCount += countB - 1;
        }
        if (countC > 0) {
          minReq -= 200;
          extraCount += countC - 1;
        }
        minReq -= extraCount * 200;

        if (current === 'A' && countA === 0) {
          minReq = minReq - 600;
        } else if (current === 'A' && countA > 0) {
            minReq = minReq - 200;
        }

        if (current === 'B' && countB === 0) {
          minReq = minReq - 300;
        } else if (current === 'B' && countB > 0) {
            minReq = minReq - 200;
        }

        if (current === 'C' && countC === 0) {
          minReq = minReq - 200;
        } else if (current === 'C' && countC > 0) {
            minReq = minReq - 200;
        }

        let playerCount = countA + countB + countC + 1;
        let maxBid = remainingBudget - minReq

        if(remainingBudget === 0){
          maxBid = 0
        }

        if(playerCount === 6){
          maxBid = remainingBudget
        }
    
        await supabase.from('Team').update({ maxBid: maxBid }).eq('id', teamID);
      }
    }
  };

  useEffect(() => {
    
    calculateMaxBid(bidAmount,selectedTeamId, selectedPlayer);
  },[changes,selectedPlayer]);

  useEffect(() => {
    let filteredData = playerData;

    if (selectedRating) {
      filteredData = filteredData.filter((player:any) => player.rating === selectedRating);
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

  const handlePass = async () => {
    if (selectedPlayer) {
      const playerRating = selectedPlayer.rating;

      if (playerRating === 'Icon') {
        const newStartingBid = selectedPlayer.startingBid + 100;
        await updatePlayerStartingBid(selectedPlayer.id, newStartingBid);
      }else if (playerRating === 'A') {
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

  const updatePlayerRating = async (playerId:any, newRating:any) => {
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

      const updatedPlayerData = playerData.map((player:any) => {
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

  const updatePlayerStartingBid = async (playerId:any, newStartingBid:any) => {
    try {
      const { data, error } = await supabase
        .from('formPlayer')
        .update({ startingBid: newStartingBid })
        .eq('id', playerId);

      const updatedPlayerData = playerData.map((player:any) => {
        if (player.id === playerId) {
          return { ...player, startingBid: newStartingBid };
        }
        return player;
      });

      setPlayerData(updatedPlayerData);

      selectNextRandomPlayer();

      if (error) {
        console.error('Error updating player starting bid:', error);
      }
    } catch (error) {
      console.error('Error updating player starting bid:', error);
    }
  }

  const handleBidSubmission = async (bidAmount: any) => {
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
          setShowBidModal(false);
          setShowUnsuccessModal(true);
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
  
        const updatedTeamData = teamData.map((team:any) => {
          if (team.id === selectedTeamId) {
            return { ...team, teamAmount: updatedAmount };
          }
          return team;
        });
        setTeamData(updatedTeamData);
  
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
          ]);
  
        if (teamPlayerError) {
          console.error(teamPlayerError);
          return;
        }
        setBidAmount('');
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

  const handleClose = () => {
    setShowSuccessModal(false);
    setChanges(Date.now());
  };

  return (
    <>
      <div className='max-w-[1440px] mx-auto'>
            {selectedPlayer &&(
              <h1 className='text-center pt-20 text-6xl font-extrabold'>
              Starting Bid: <span className='text-[#17273e]'>{selectedPlayer.startingBid} LP</span>
              </h1>
            )}
          <div className='max-w-[768px] mx-auto'>
        <div className='w-full'>
          {selectedPlayer && (
            <div className='mt-10'>
              <PlayerCard
                name={selectedPlayer.name}
                url={selectedPlayer.image}
                position={selectedPlayer.position}
                rating={selectedPlayer.rating}
                department={selectedPlayer.department}
              />
            </div>
          )}

          <div className='w-full'>
            <select
              value={selectedRating}
              onChange={handleRatingChange}
              className='mt-10 h-7 text-lg shadow-xl bg-[#4f6d79] text-white font-bold w-full text-center rounded-[20px]'
            >
              <option value=''>All Rating</option>
              <option value='Icon'>Icon</option>
              <option value='A'>A</option>
              <option value='B'>B</option>
              <option value='C'>C</option>
            </select>
          </div>
        </div>
        
        <div className='w-full mt-10 flex flex-wrap justify-center gap-4'>
          {teamData
            .filter((team: any) => selectedGender === '' || team.teamGender === selectedGender)
            .map((team: any) => (
              <button
                key={team.id}
                onClick={() => handleTeamClick(team.id)}
                className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
              >
                {team.teamName}
              </button>
            ))}
        </div>

        <div className='w-full mt-10 flex justify-center'>
          <button
            className='px-10 py-2 bg-red-500 text-white hover:bg-red-600 rounded-[30px]'
            onClick={handlePass}
          >
            Pass
          </button>
        </div>

        <div className='w-full mt-20'>
          <h2 className='font-bold text-center mb-4'>Teams:</h2>
          <table className='w-full border-collapse border border-black'>
            <thead>
              <tr>
                <th className='w-32 border border-black px-4 py-2'>Team Name</th>
                <th className='w-32 border border-black px-4 py-2'>Manager</th>
                <th className='w-32 border border-black px-4 py-2'>Available Coin</th>
                <th className='w-32 border border-black px-4 py-2'>Max Bid</th>
                <th className="w-32 border border-black px-4 py-2">Icon</th>
                <th className="w-32 border border-black px-4 py-2">A</th>
                <th className="w-32 border border-black px-4 py-2">B</th>
                <th className="w-32 border border-black px-4 py-2">C</th>
              </tr>
            </thead>
            <tbody>
              {teamData
                .filter((team: any) => selectedGender === '' || team.teamGender === selectedGender)
                .map((team: any) => (
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
                    <td className="border border-black px-4 py-2">{teamPlayerCounts[team.id]?.Icon}</td>
                    <td className="border border-black px-4 py-2">{teamPlayerCounts[team.id]?.A}</td>
                    <td className="border border-black px-4 py-2">{teamPlayerCounts[team.id]?.B}</td>
                    <td className="border border-black px-4 py-2">{teamPlayerCounts[team.id]?.C}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        
      </div>


        {showBidModal && (
          <div className='fixed inset-0 flex items-center justify-center z-50'>
            <div className='modal-overlay absolute inset-0 bg-black opacity-50'></div>
            <div className='modal-container bg-white w-96 mx-auto rounded shadow-lg z-50'>
              <div className='modal-content p-4'>
                <h2 className='text-xl mb-4'>
                  <span className='font-bold'>{selectedTeam && selectedTeam.teamName}</span> has placed the winning bid for player{' '}
                  <span className='font-bold'>{selectedPlayer && selectedPlayer.name}</span>
                </h2>
                <input
                  type='number'
                  className='w-full p-2 border rounded mb-4'
                  placeholder='Bid Amount'
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
                <div className='flex justify-end'>
                  <button
                    className='px-4 py-2 bg-blue-500 text-white rounded hover-bg-blue-600 mr-2'
                    onClick={() => handleBidSubmission(bidAmount)}
                  >
                    Submit Bid
                  </button>
                  <button
                    className='px-4 py-2 bg-gray-300 text-gray-700 rounded hover-bg-gray-400'
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
                  Congratulations <span className='font-bold'>{selectedTeam && selectedTeam.teamName}</span> on buying{' '}
                  <span className='font-bold'>{selectedPlayer && selectedPlayer.name}</span>.
                </p>
                <button className='px-4 py-2 bg-blue-500 text-white rounded hover-bg-blue-600' onClick={handleClose}>
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
                <h2 className='text-xl font-bold mb-2'>Unsuccessful Bid</h2>
                <p className='mb-4 text-red-600'>
                  Sorry <span className='font-bold'>{selectedTeam && selectedTeam.teamName}</span> does not have enough coins for buying{' '}
                  <span className='font-bold'>{selectedPlayer && selectedPlayer.name}</span>.
                </p>
                <button
                  className='px-4 py-2 bg-blue-500 text-white rounded hover-bg-blue-600'
                  onClick={() => setShowUnsuccessModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='max-w-[1440px] mx-auto'>
      {selectedPlayer &&(
        <>
          <h1 className='text-center pt-20 text-6xl font-extrabold '>
          Experience of  <span className='text-[#17273e] '>{selectedPlayer.name} </span>
          </h1>
          <li className='text-center pt-10 pb-60 text-3xl font-bold'>{selectedPlayer.pastTour}</li>
        </>
      )}
    </div>
    </>
  );
};
