import React, { useState, useEffect } from "react";
import Select from "react-select";

const MultiSelectWithFilter = ({ joined, selectedPlayers, onPlayersChange, isEditing, allSelectedPlayers }) => {
    const [selectedOptions, setSelectedOptions] = useState([]);

    // Set initial selected options based on the prop
    useEffect(() => {
        if (selectedPlayers && joined) {
            const initialSelected = selectedPlayers.map(email => {
                const player = joined.find(p => p.email === email);
                return player ? { value: player.email, label: player.name } : null;
            }).filter(Boolean);

            setSelectedOptions(initialSelected);
        }
    }, [selectedPlayers, joined]);

    // Filter out players who are already selected in other teams
    const availablePlayers = joined.filter(player =>
        !allSelectedPlayers.includes(player.email) || selectedPlayers.includes(player.email)
    );

    // Map available players to options
    const options = availablePlayers.map(player => ({
        value: player.email,
        label: player.name
    }));

    // Handle change when options are selected
    const handleChange = (selected) => {
        setSelectedOptions(selected);
        onPlayersChange(selected);
    };

    const customStyles = {
        control: (provided) => ({
            ...provided,
            border: "2px solid #0d2249",
            borderRadius: "5px",
            padding: "2px",
            backgroundColor: isEditing ? "white" : "#f5f7fa",
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: "#e0e7ff",
            borderRadius: "4px"
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: "#0d2249",
            fontWeight: 500
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: "#0d2249",
            ':hover': {
                backgroundColor: '#d1deff',
            }
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#666"
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: "8px",
            maxHeight: "90px",
        }),
        menuList: (provided) => ({
            ...provided,
            maxHeight: "90px",
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? "#0d2249" : state.isFocused ? "#f0f4ff" : null,
            color: state.isSelected ? "white" : "#0d2249",
            ':active': {
                backgroundColor: "#0d2249",
                color: "white"
            }
        })
    };

    return (
        <div className="teamInputWrapper multi-select-wrapper" style={{overflow: "visible"}}>
            <label htmlFor="multi-select">Choose Owners:</label>
            <Select
                id="multi-select"
                isMulti
                options={options}
                value={selectedOptions}
                onChange={handleChange}
                placeholder="Select or search..."
                isSearchable
                isClearable
                styles={customStyles}
                isDisabled={!isEditing}
                menuPlacement="auto"
                menuShouldScrollIntoView
            />
        </div>
    );
};

export default MultiSelectWithFilter;