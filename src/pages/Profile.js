import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setError("You are not logged in!");
      return;
    }
    setProfile(user);
  }, [user]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return profile ? (
    <div>
      <h2>Welcome, {profile.firstname || "User"}!</h2>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Country:</strong> {profile.country || "Not provided"}</p>
      <p><strong>Mobile:</strong> {profile.countrycode} {profile.mobile || "Not provided"}</p>
    </div>
  ) : (
    <p>Loading profile...</p>
  );
};

export default Profile;
