import React from 'react';
import ImageInput from '../ImageInput';
import MultiSelectWithFilter from './MultiSelect';

function TeamDetails({ auction, teams, isEditing, onTeamsChange }) {
    const handleTeamChange = (index, field, value) => {
        const updatedTeams = teams.map((team, i) =>
            i === index ? { ...team, [field]: value } : team
        );
        onTeamsChange(updatedTeams);
    };

    const handlePartnershipChange = (index, selectedPlayers) => {
        handleTeamChange(index, 'partnerShip', selectedPlayers.map(player => player.value));
    };

    // Gather all selected players from all teams
    const allSelectedPlayers = teams.flatMap(team => team.partnerShip || []);

    if (!teams || !teams.length) {
        return (
            <div className="auctionArea">
                <div className="auctionHeader">
                    <span className="areaName">Team Details</span>
                </div>
                <div className="areaBody emptyState">
                    <span>You haven't configured teams yet.</span>
                    <p>Enter total teams in above Total Teams section.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auctionArea">
            <div className="auctionHeader">
                <span className="areaName">Team Details</span>
            </div>
            <div className="areaBody">
                <div className="teamsGrid">
                    {teams.map((team, index) => (
                        <div className="teamCard" key={index}>
                            <ImageInput
                                initialImage={team.teamImg}
                                onImageUpload={(url) => handleTeamChange(index, 'teamImg', url)}
                                isEditing={isEditing}
                                imgId={`team-${index}`}
                            />
                            <div className="teamInputWrapper">
                                <input
                                    type="text"
                                    value={team.teamName || ''}
                                    onChange={(e) => handleTeamChange(index, 'teamName', e.target.value)}
                                    placeholder={`Team ${index + 1}`}
                                    className="teamInput"
                                    readOnly={!isEditing}
                                />
                            </div>

                            <hr style={{ borderColor: "#0d2249", margin: "1rem auto" }} />

                            {isEditing ? (
                                <div className="teamInputWrapper multi-select-wrapper">
                                    <MultiSelectWithFilter
                                        joined={auction.joinedBy}
                                        selectedPlayers={team.partnerShip || []}
                                        onPlayersChange={(selectedPlayers) => handlePartnershipChange(index, selectedPlayers)}
                                        isEditing={isEditing}
                                        allSelectedPlayers={allSelectedPlayers}
                                        currentTeamIndex={index}
                                    />
                                </div>
                            ) : (
                                <div className="teamInputWrapper partners-list">
                                    <div>Owners:</div>
                                    <div>
                                        {team.partnerShip && team.partnerShip.length > 0 ? (
                                            team.partnerShip.map((partnerEmail, idx) => {
                                                const partner = auction.joinedBy.find(j => j.email === partnerEmail);
                                                return partner ? <div key={idx} className='partners-name'>{partner.name}</div> : null;
                                            })
                                        ) : (
                                            <span>No partners selected</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TeamDetails;