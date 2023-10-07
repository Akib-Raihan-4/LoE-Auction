"use client"
import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabase';

export const Auction = () => {
  const [playerData, setPlayerData] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    const fetchPlayerData = async () => {
      const { data: playersData, error: playersError } = await supabase
        .from('formPlayer')
        .select('*')
        .eq('verified', true);
      
      if (playersError) {
        console.error(playersError);
      } else {
        setPlayerData(playersData || []);
      }
    };

    fetchPlayerData();
  }, []);

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
  });

  useEffect(() => {
    // Apply filters based on selectedPosition and selectedRating to playerData
    let filteredData = playerData;

    if (selectedPosition) {
      filteredData = filteredData.filter((player) => player.position === selectedPosition);
    }

    if (selectedRating) {
      filteredData = filteredData.filter((player) => player.rating === selectedRating);
    }

    if (filteredData.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredData.length);
      setSelectedPlayer(filteredData[randomIndex]);
    } else {
      setSelectedPlayer(null);
    }
  }, [selectedPosition, selectedRating, playerData]);

  const handleTeamClick = async (teamId) => {
    setShowBidForm(true);

    if (selectedPlayer) {
      // Prompt the user to input the bid amount
      const inputAmount = prompt(`Enter the bid amount for ${selectedPlayer.id}`);

      if (inputAmount !== null) {
        // Convert bidAmount to a number
        const bidAmountNumber = parseFloat(inputAmount);

        if (!isNaN(bidAmountNumber)) {
          try {
            // Fetch the current team amount from the database
            const { data: team, error: teamError } = await supabase
              .from('Team')
              .select('teamAmount')
              .eq('id', teamId)
              .single();
            
            if (teamError) {
              console.error(teamError);
              return; // Handle the error
            }

            // Update the teamAmount in the Team table
            const updatedAmount = team.teamAmount - bidAmountNumber;
            const { error: updateError } = await supabase
              .from('Team')
              .update({ teamAmount: updatedAmount })
              .eq('id', teamId);
            
            if (updateError) {
              console.error(updateError);
              return; // Handle the error
            }

            // Update the local state with the updated team amount
            const updatedTeamData = [...teamData];
            const teamIndex = updatedTeamData.findIndex((team) => team.id === teamId);
            if (teamIndex !== -1) {
              updatedTeamData[teamIndex].teamAmount = updatedAmount;
              setTeamData(updatedTeamData);
            }

            // Update the selected status of the player in the formPlayer table
            const { data: playerData, error: playerError } = await supabase
              .from('formPlayer')
              .update({ selected: true })
              .eq('id', selectedPlayer.id)

            if (playerError) {
              console.error(playerError);
            }

            setShowBidForm(false);
          } catch (error) {
            console.error('Supabase error:', error);
          }
        }
      }
    }
  };

  const handlePositionChange = (event) => {
    setSelectedPosition(event.target.value);
  };

  const handleRatingChange = (event) => {
    setSelectedRating(event.target.value);
  };

  return (
    <div className='w-[1440px] flex justify-between mx-auto'>
      <div className=''>
        <h2>Select a Team</h2>
        <ul>
          {teamData.map((team) => (
            <li key={team.id}>
              <button onClick={() => handleTeamClick(team.id)}>
                {team.teamName}-{team.teamAmount}
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
      <div className=''>
        <h2>Filter Players</h2>
        <select value={selectedPosition} onChange={handlePositionChange}>
          <option value="">All Positions</option>
          <option value="Forward">Forward</option>
          <option value="Midfielder">Midfielder</option>
          <option value="Defender">Defender</option>
          <option value="Goal Keeper">Goalkeeper</option>
        </select>

        <select value={selectedRating} onChange={handleRatingChange}>
          <option value="">All Ratings</option>
          <option value="Icon">Icon</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>

        {selectedPlayer && (
          <div className='mb-10'>
            <h2>Randomly Selected Player:</h2>
            <p>Name: {selectedPlayer.name}</p>
            <p>Position: {selectedPlayer.position}</p>
            <p>Rating: {selectedPlayer.rating}</p>
          </div>
        )}

        
      </div>
    </div>
  );
};
