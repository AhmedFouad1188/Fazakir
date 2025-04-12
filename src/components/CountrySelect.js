import React from "react";
import Select from "react-select";
import { useSelector } from "react-redux";
import countries from "../data/countries.json"; // your local file

const sortedCountries = [...countries].sort((a, b) =>
  a.name.common.localeCompare(b.name.common)
);

const CountrySelect = ({ onChange }) => {
  const user = useSelector((state) => state.auth.user);

  // Mapping country data to react-select options
  const options = sortedCountries.map((country) => ({
    value: country.cca2,
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img src={country.flags.svg} alt={country.name.common} width="30" />
        {country.name.common}
      </div>
    ),
    data: country,
  }));

  const selectedOption = user?.country? options.find((opt) => opt.data.name.common === user.country) : null;

  return (
    <Select
      options={options}
      onChange={onChange}
      defaultValue={selectedOption}
      placeholder="اختر دولتك"
      isSearchable
    />
  );
};

export default CountrySelect;
