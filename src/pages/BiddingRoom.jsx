import React from 'react'
import { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { instance } from '../utils/axios';


function BiddingRoom() {
    const location = useLocation();
    const { auctionId, auctionName } = location.state || {};

    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await instance.post(
                    "/auction/team/all",
                    { auction_id: auctionId },
                    { headers: { Authorization: localStorage.getItem("auction") } }
                );
                if (response.status === 200) {
                    const fetchedTeams = response.data.teams || [];
                    setTeams(fetchedTeams);
                }
            } catch (error) {
                console.error("Error fetching teams:", error);
            }
        };

        fetchTeams();
    }, [auctionId]);

    return (
        <div>
            <h1>Welcome to Auction of {auctionName}</h1>
            {/* {teams.map((team) => (
                <div key={team.id}>
                    <h2>{team.team_name}</h2>
                    <h2>{team.team_image}</h2>
                    <h2>{team.budget || 0} Cr</h2>
                    <h2>{team.batters || 0}</h2>
                    <h2>{team.bowler || 0}</h2>
                    <h2>{team.wicket_keepers || 0}</h2>
                    <h2>{team.all_rounders || 0}</h2>
                    <h2>{team.overseas || 0}</h2>
                </div>
            ))} */}
        </div>
    );
}

export default BiddingRoom