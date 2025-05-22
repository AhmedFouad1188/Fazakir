import React from "react";
import Select from "react-select";
import { useSelector } from "react-redux";
import countries from "../data/countries.json";

const sortedCountries = [...countries].sort((a, b) =>
  a.name.common.localeCompare(b.name.common)
);

const CountrySelect = ({ onChange }) => {
  const user = useSelector((state) => state.auth.user);

  // Custom styles for RTL layout
  const customStyles = {
    control: (provided) => ({
      ...provided,
      paddingLeft: '8px', // Add space for the arrow on right
      paddingRight: '0',
      flexDirection: 'row-reverse' // Reverse the inner layout
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '0 8px', // Adjust padding
      marginLeft: 0,
      marginRight: 'auto' // Push to right
    }),
    valueContainer: (provided) => ({
      ...provided,
      flexDirection: 'row-reverse',
      padding: '2px 0' // Adjust padding
    }),
    option: (provided) => ({
      ...provided,
      textAlign: 'right',
      display: 'flex',
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: '10px'
    })
  };

  const options = sortedCountries.map((country) => ({
    value: country.cca2,
    label: (
      <div style={{ 
        display: "flex", 
        flexDirection: "row-reverse", 
        alignItems: "center", 
        gap: "10px",
        paddingRight: '8px' // Add padding for alignment
      }}>
        <img 
          src={country.flags.svg} 
          alt={country.name.common} 
          width="30" 
          style={{ minWidth: '30px' }} // Fixed width
        />
        {country.name.common}
      </div>
    ),
    data: country,
  }));

  const selectedOption = user?.country 
    ? options.find((opt) => opt.data.name.common === user.country) 
    : null;

  return (
    <Select
      options={options}
      onChange={onChange}
      defaultValue={selectedOption}
      placeholder="اختر دولتك"
      isSearchable
      className="countryselect"
      styles={customStyles}
      components={{
        IndicatorSeparator: null,
      }}
      isRtl={true} // Enable RTL mode
    />
  );
};

export default CountrySelect;