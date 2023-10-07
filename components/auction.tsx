"use client"
import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabase';

export const Auction = () => {
  const [teamData, setTeamData] = useState([]);
  const [playerData, setPlayerData] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [randomPlayer, setRandomPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      const { data, error } = await supabase
        .from('Team')
        .select('*');
      
      if (error) {
        console.error(error);
      } else {
        setTeamData(data || []);
      }
    };

    const fetchPlayerData = async () => {
      const { data, error } = await supabase
        .from('formPlayer')
        .select('*')
        .eq('verified', true);
      
      if (error) {
        console.error(error);
      } else {
        setPlayerData(data || []);
      }
    };

    fetchTeamData();
    fetchPlayerData();
  }, []);

  useEffect(() => {
    // Apply filters based on selectedPosition and selectedRating to playerData
    let filteredData = playerData;

    if (selectedPosition) {
      filteredData = filteredData.filter((player) => player.position === selectedPosition);
    }

    if (selectedRating) {
      filteredData = filteredData.filter((player) => player.rating === selectedRating);
    }

    setFilteredPlayers(filteredData);

    if (filteredData.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredData.length);
      setRandomPlayer(filteredData[randomIndex]);
    } else {
      setRandomPlayer(null);
    }
  }, [selectedPosition, selectedRating, playerData]);

  const handleTeamClick = (teamId) => {
    setSelectedTeam(teamId);
    setShowBidForm(true);
  };

  const handleSubmitBid = async () => {
    // if (!selectedPlayer || !selectedTeam || !bidAmount) {
    //   // Handle validation or show an error message
    //   return;
    // }

    // Convert bidAmount to a number
    const bidAmountNumber = parseFloat(bidAmount);
    console.log(selectedTeam)

    if (isNaN(bidAmountNumber)) {
      // Handle invalid bid amount (not a number)
      return;
    }

    try {
      // Update the teamAmount in the Team table
      const updatedTeamData = [...teamData]; // Create a copy of teamData
      const teamIndex = updatedTeamData.findIndex((team) => team.id === selectedTeam);
      
      if (teamIndex !== -1) {
        // Update the teamAmount for the selected team
        updatedTeamData[teamIndex].teamAmount -= bidAmountNumber;

        // Update the teamAmount in the database
        const { error: updateError } = await supabase
          .from('Team')
          .update({ teamAmount: updatedTeamData[teamIndex].teamAmount })
          .eq('id', selectedTeam);
        
        if (updateError) {
          console.error(updateError);
          return; // Handle the error
        }

        setTeamData(updatedTeamData); // Update the local state
      }

      // Update the selected status of the player in the formPlayer table
      const { data, error } = await supabase
        .from('formPlayer')
        .update({ selected: true })
        .eq('playerId', selectedPlayer.id)
        .single();

      if (error) {
        console.error(error);
      } else {
        // Set the selectedPlayer's selected status to true in the local state
        setSelectedPlayer({ ...selectedPlayer, selected: true });
      }

      // Simulate a successful bid
      setShowBidForm(false);
      setBidAmount('');
      setSelectedTeam(null);
    } catch (error) {
      console.error('Supabase error:', error);
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
                {team.teamName}
              </button>
            </li>
          ))}
        </ul>

        {showBidForm && (
          <div className='bid-form'>
            <h2>Place a Bid for Player {randomPlayer && randomPlayer.name}</h2>
            <input
              type='number'
              placeholder='Bid Amount'
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <button onClick={handleSubmitBid}>Submit Bid</button>
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

        {randomPlayer && (
          <div className='mb-10'>
            <h2>Randomly Selected Player:</h2>
            <p>Name: {randomPlayer.name}</p>
            <p>Position: {randomPlayer.position}</p>
            <p>Rating: {randomPlayer.rating}</p>
          </div>
        )}

        
      </div>
    </div>
  );
};
