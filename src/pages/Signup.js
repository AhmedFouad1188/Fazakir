import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signup } from "../redux/authSlice";
import styles from "../styles/signup.module.css";
import CountrySelect from "../components/CountrySelect"; // Make sure to import the CountrySelect component
import examples from 'libphonenumber-js/examples.mobile.json';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    country: "",
    dial_code: "",
    mobile: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileMaxLength, setMobileMaxLength] = useState(15); // Fallback to a max length of 15

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (selectedCountry) => {
    const dial_code = selectedCountry.data.idd.root + selectedCountry.data.idd.suffixes;
    const countryCode = selectedCountry.data.cca2;
    const country = selectedCountry.data.name.common;

    const getMobileMaxLength = (countryCode) => {
      const example = examples[countryCode]; // just a string like "501234567"
      if (example) return example.length;
      return 15; // fallback
    };

    const maxLength = getMobileMaxLength(countryCode);
    setMobileMaxLength(maxLength);

    setFormData((prev) => ({
      ...prev,
      country,
      dial_code,
    }));
  };

  const handleSignup = async () => {
    try {
      await dispatch(signup(formData)).unwrap();
      navigate("/");
    } catch (error) {
      console.error("Firebase Error:", error.code); // Log the original error for debugging

    // ✅ Custom error messages
    let errorMessage = "An unknown error occurred. Please try again.";

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered. Try logging in.";
    } else if (error.code && error.code.includes("password")) {
      errorMessage = "Password length must be 10 - 20 characters and contains at least one uppercase, one lowercase and one numeric character.";
    } else {
      errorMessage = error.message; // Use Firebase default if we don't handle it
    }

    setError(errorMessage);
    };
  }

  return (
    <div className="signupcont">
      <h2>أنشىء حساب جديد</h2>

      <form className="signupform" onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
        <label htmlFor="lastname">
        <input type="text" id="lastname" name="lastname" placeholder="* الإسم الأخير" onChange={handleChange} required></input>
        </label>

        <label htmlFor="firstname">
        <input type="text" id="firstname" name="firstname" placeholder="* الإسم الأول" onChange={handleChange} required></input>
        </label>

        <div>
        <label htmlFor="dial_code">
        <input type="text" id="dial_code" name="dial_code" value={formData.dial_code} onChange={handleChange} readOnly />
        </label>
        <label htmlFor="mobile">
        <input type="tel" id="mobile" name="mobile" onChange={handleChange} maxLength={mobileMaxLength} title={`رقم الموبايل يجب أن يكون ${mobileMaxLength} ارقام`} placeholder="رقم الموبايل" required/>
        </label>
        </div>

        <label htmlFor="country" id="country">
        <CountrySelect onChange={handleCountryChange} required />
        </label>

        <label htmlFor="password">
        <input type="password" id="password" name="password" placeholder="* كلمة السر" onChange={handleChange} required />
        </label>

        <label htmlFor="email">
        <input type="email" id="email" name="email" placeholder="* البريد الالكترونى" onChange={handleChange} required />
        </label>

        <button type="submit" id="signupsubmit">أنشىء حساب</button>
      </form>

      {error && <p style={{ color: "red", fontSize: "1.5vw" }}>{error}</p>}
    </div>
  );
};

export default Signup;