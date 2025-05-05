import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/authSlice";
import axios from "axios";
import CountrySelect from "../components/countrySelect";
import examples from 'libphonenumber-js/examples.mobile.json';
import { toast } from "react-toastify";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const Account = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileMaxLength, setMobileMaxLength] = useState(15); // Fallback to a max length of 15

  useEffect(() => {
    if (!user) {
      setError("You are not logged in!");
      return;
    }

    const fetchAccount = async () => {
      try {
        const initialData = {
          firstname: user.firstname || "",
          lastname: user.lastname || "",
          email: user.email || "",
          country: user.country || "",
          dial_code: user.dial_code || "",
          mobile: user.mobile || "",
          governorate: user.governorate || "",
          district: user.district || "",
          street: user.street || "",
          building: user.building || "",
          floor: user.floor || "",
          apartment: user.apartment || "",
          landmark: user.landmark || "",
        };

        setAccount(initialData);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch account info.");
      }
    };

    fetchAccount();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Ensure mobile number does not exceed the max length
    if (name === "mobile" && value.length > mobileMaxLength) return;

    setAccount({ ...account, [name]: value });
    setError("");
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

    setAccount((prev) => ({
      ...prev,
      country,
      dial_code,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put("http://localhost:5000/api/auth/accountupdate", account, { withCredentials: true });
      toast.success(`Account updated successfully`, {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Failed to save changes", {
        position: "top-right",
        autoClose: 2000,
      });
    }
    setLoading(false);
  };

  const handleSoftDelete = async () => {
        confirmAlert({
          title: 'Delete Your Account ?',
          message: `Are you sure you want to delete your account ? Note that you can still recover your account within 30 days from the time of deletion.`,
          buttons: [
            {
              label: 'Yes',
              onClick: async () => {
                try {
                  await axios.post("http://localhost:5000/api/auth/soft-delete", {}, { withCredentials: true });
                  toast.error(`Account marked for deletion`, {
                    position: "top-right",
                    autoClose: 2000,
                  });

                  await dispatch(logout()).unwrap();
                  navigate("/");
                } catch (error) {
                  toast.error("Failed to delete account", {
                    position: "top-right",
                    autoClose: 2000,
                  });
                }
              }
            },
            {
              label: 'No'
              // No action needed; this closes the dialog
            }
          ]
        });
      };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!account) return <p>Loading account...</p>;

  return (
    <div>
      <h2>Edit Your Account</h2>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 400 }}>
        <label>First Name:</label>
        <input name="firstname" value={account.firstname} onChange={handleChange} required />

        <label>Last Name:</label>
        <input name="lastname" value={account.lastname} onChange={handleChange} required />

        <label>Email:</label>
        <input name="email" value={account.email} readOnly />

        <label>Country:</label>
        <CountrySelect onChange={handleCountryChange} value={account.country} required />

        <input name="countrycode" value={account.dial_code} onChange={handleChange} readOnly />

        <label>Mobile:</label>
        <input
          name="mobile"
          value={account.mobile}
          onChange={handleChange}
          maxLength={mobileMaxLength}
          placeholder={`Your mobile length must be ${mobileMaxLength} digits`}
          required
        />

        <label>Governorate:</label>
        <input name="governorate" value={account.governorate} onChange={handleChange} />

        <label>District:</label>
        <input name="district" value={account.district} onChange={handleChange} />

        <label>Street:</label>
        <input name="street" value={account.street} onChange={handleChange} required />

        <label>Building No.:</label>
        <input name="building" value={account.building} onChange={handleChange} />

        <label>Floor:</label>
        <input name="floor" value={account.floor} onChange={handleChange} />

        <label>Apartment No.:</label>
        <input name="apartment" value={account.apartment} onChange={handleChange} />

        <label>Landmark:</label>
        <input name="landmark" value={account.landmark} onChange={handleChange} />

        <button onClick={handleSave} disabled={loading} style={{ marginTop: 10 }}>
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      <button onClick={handleSoftDelete} style={{ marginTop: 20, color: "red" }}>
        Delete My Account
      </button>
    </div>
  );
};

export default Account;
