import React from "react";
import Select from "react-select";
import countries from "../data/countries.json"; // your local file

const customStyles = {
  option: (provided) => ({
    ...provided,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }),
  singleValue: (provided) => ({
    ...provided,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }),
};

const sortedCountries = [...countries].sort((a, b) =>
  a.name.common.localeCompare(b.name.common)
);

const CountrySelect = ({ onChange, defaultValue }) => {
  // Mapping country data to react-select options
  const options = sortedCountries.map((country) => ({
    value: country.cca2,
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img src={country.flags.svg} alt={country.name.common} width="20" />
        {country.name.common}
      </div>
    ),
    data: country,
  }));

  return (
    <Select
      options={options}
      onChange={onChange}
      styles={customStyles}
      placeholder="Select your country..."
      defaultValue={defaultValue} // Set default selected value
      isSearchable
    />
  );
};

export default CountrySelect;
