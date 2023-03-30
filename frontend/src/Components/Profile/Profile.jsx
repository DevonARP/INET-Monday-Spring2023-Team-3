import axios from "axios";
import { Pane, toaster } from "evergreen-ui";
import { Card, Space, Row, Col, Button, Input, DatePickerProps, DatePicker } from "antd";
import { useEffect, useRef, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import "./Profile.css";
import { EditIcon } from "evergreen-ui";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  GoogleMap,
  useLoadScript,
  StandaloneSearchBox,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";


// dayjs.extend(customParseFormat);


function Profile() {
  const { other_username } = useParams();
  const history = useHistory();
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState({});
  const [otherUserProfile, setOtherUserProfile] = useState({});

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [formData, setFormData] = useState({
    location: "", dob: "", short_bio: "",
  });

  const [center, setCenter] = useState(null);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    setIsDisabled(false)
    setCenter({ lat: latitude, lng: longitude});
    setLocation({lat: latitude, lng: longitude });
    setIsLoading(false);
    console.log(latitude)
    console.log(longitude)
  };
  const handleError = (error) => {
    setError(error.message);
    setIsDisabled(false)
    setIsLoading(false);
  };
  const handleLoad = (map) => {
    console.log('Map loaded:', map);
  };
  const handleMapClick = ({ latLng }) => {
    setCenter({ lat: latLng.lat(), lng: latLng.lng() });
  };
  const mapContainerStyle = {
    width: '100%',
    height: '250px'
  };

  const handleGetLocation = () => {
    setIsLoading(true);
    setIsDisabled(true)
    console.log("hello?")
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
  }


  const dateFormat = 'YYYY-MM-DD'
  const updateFields = (date, dateString) => {
    setFormData({ ...formData, dob: dateString.replaceAll("/","-") })
  }


  const getOtherUserProfile = async () => {
    console.log(other_username)
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/auth/get_other_user_profile/${other_username}/`
      );
      setOtherUserProfile(data);
      console.log(data)
      setIsMounted(true);
    } catch (e) {
      // history.replace("/");
      console.log(e)
    }
  };
  


  const getProfile = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/auth/full_profile/`
      );
      setProfile(data);
      formData.location = data.location
      // formData.dob = data.date_of_birth.replaceAll("-","/")
      formData.short_bio = data.short_bio
      setIsMounted(true);
    } catch (e) {
      localStorage.removeItem("jwt");
      history.replace("/login");
    }
  };
  const handleClickEditButton = () => {
    setIsEditMode(true);
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();

    let userinput = formData;
    if ( userinput.short_bio === null || userinput.short_bio === "") {
      toaster.danger("Error: Please enter valid information! 🙁");
      return;
    }
    try {
      // userinput.dob = userinput.dob.replaceAll("/","-")
      await axios.post(
          `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/auth/update-user-info/`,
          {
              // date_of_birth: userinput.dob,
              // location: userinput.location,
              short_bio: userinput.short_bio,
          }
        );
        toaster.success("Changes saved!");
        history.replace("/profile");
        setIsEditMode(false)
        setProfile({
          // date_of_birth: userinput.dob,
          // location: userinput.location,
          short_bio: userinput.short_bio,
        })

    } catch (e) {
      console.log(e)
    }
  };

  const followRequest = async (target_username) => {
    try {
      await axios.post(
          `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/auth/request-follow/`,
          {
            target_address: target_username,
            self_address:profile.username
          }
        );
        toaster.success("Changes saved!");
        console.log("done")
        
        
    } catch (e) {
      console.log(e)

    }
  }

  const unfollowRequest = async (target_username) => {
    try {
      await axios.post(
          `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/auth/request-unfollow/`,
          {
            target_address: target_username,
            self_address:profile.username
          }
        );
        toaster.success("Changes saved!");
        console.log("done")
    } catch (e) {
      console.log(e)

    }
  }



  useEffect(() => {
    getProfile();
    console.log(other_username)
    if (other_username !== "myprofile"){
      getOtherUserProfile();
    }
    
  }, []);

  if (!isMounted) return <div></div>;
  return (
    <div>
    {other_username === "myprofile" ? 

    // current user's profile version

    <div style={{ padding: "32px" }}>
      <Card size="small" style={{ margin: "0.5rem" }}>
        <Row style={{}}>
          <Col span={24}>
            <Row>
              <Col span={4}>
                <div className="circle">Image</div>
              </Col>
              <Col span={20} style={{ padding: "1rem" }}>
                <div style={{ padding: "0.5rem", fontSize: "1.4rem" }}>
                  {profile.username}
                </div>
                <div style={{ padding: "0.5rem" }}>Member since 2023</div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row style={{ paddingTop: "1rem" }}>
        <Col span={24} style={{ padding: "0.5rem" }}>
        <h1>Profile Page for {other_username}</h1>
          {!isEditMode?
          <Button type="primary" onClick={handleClickEditButton}>
            Edit Profile<span style={{paddingLeft:"4px",verticalAlign:"text-top" }}><EditIcon /></span>
          </Button>:
            <Button type="primary" onClick={handleSubmitUpdate}>
              Save changes
            </Button>}
        </Col>
        
        <Col span={8} style={{ padding: "0.5rem" }}>
            <Space
              direction="vertical"
              size="middle"
              style={{
                display: "flex",
              }}
            >
              <Card title="Email" size="small">
                <p>{profile.email}</p>
              </Card>
              <Button onClick={() => followRequest("uniqueuser")}>Click to follow uniqueuser </Button>
              <Button onClick={() => unfollowRequest("uniqueuser")}>Click to Unfollow uniqueuser </Button>
              <Card title="Current Location" size="small">
                {/* <p>{profile.location ? profile.location: "No data yet"}</p> */}
                
                {center && <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  onClick={handleMapClick}
                  zoom={14}
                  onLoad={handleLoad}
                >
                <Marker 
                  position={center} 
                  icon= {{
                    url: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
                    scaledSize: new google.maps.Size(50, 50)
                  }}
                  center={
                    {
                      lat: 40.723301,
                      lng: -74.002988,
                    }
                  }
                  title="your location" 
                  label="A" />
                </GoogleMap>}
                
                {!center && 
                <Button disabled={isDisabled} onClick={handleGetLocation}>
                    {isLoading ? "Loading..." : "Get My Location"}
                </Button>}
              </Card>
              {/* <Card title="Date of Birth" size="small">
                <div>
                  <p>{profile.date_of_birth ? profile.date_of_birth : "No data yet"}</p>
                </div>
              </Card> */}
              {!isEditMode ? (
              <Card title="Short Bio" size="small">
                <div>
                  <p>{profile.short_bio ? profile.short_bio : "No data yet"}</p>
                </div>
              </Card>):(
              <Card title="Short Bio" size="small">
                <Input
                  placeholder="Enter a short bio about yourself"
                  type="short_bio"
                  id="short_bio"
                  name="Short Bio"
                  value={formData.short_bio}
                  onChange={(e) =>
                    setFormData({ ...formData, short_bio: e.target.value })
                  }
                />
                </Card>)
              }
            </Space>
          </Col>
        
        <Col span={16} style={{ padding: "0.5rem" }}>
          <Space
            direction="vertical"
            size="middle"
            style={{
              display: "flex",
            }}
          >
            <Card
              title="My Followers"
              size="small"
              style={{ height: "100%" }}
            >
              {profile.followed_by.length > 0 ? profile.followed_by : "No followers yet :("}
            </Card>
            <Card
              title="Following"
              size="small"
              style={{ height: "100%" }}
            >
              {profile.following.length > 0 ? profile.following : "Not following anyone :("}
            </Card>
            <Card title="Saved Crawls" size="small" style={{ height: "100%" }}>
              No Saved crawls yet <a href="/">Explore</a>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
    :
    
  //  Exploring other user's profile version

    <div style={{ padding: "32px" }}>
      <Card size="small" style={{ margin: "0.5rem" }}>
        <Row style={{}}>
          <Col span={24}>
            <Row>
              <Col span={4}>
                <div className="circle">Image</div>
              </Col>
              <Col span={20} style={{ padding: "1rem" }}>
                <div style={{ padding: "0.5rem", fontSize: "1.4rem" }}>
                  {profile.username}
                </div>
                <div style={{ padding: "0.5rem" }}>Member since 2023</div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row style={{ paddingTop: "1rem" }}>
        <Col span={24} style={{ padding: "0.5rem" }}>
        <h1>Profile Page for {other_username}</h1>
          {!isEditMode?
          <Button type="primary" onClick={handleClickEditButton}>
            Edit Profile<span style={{paddingLeft:"4px",verticalAlign:"text-top" }}><EditIcon /></span>
          </Button>:
            <Button type="primary" onClick={handleSubmitUpdate}>
              Save changes
            </Button>}
        </Col>
        
        <Col span={8} style={{ padding: "0.5rem" }}>
            <Space
              direction="vertical"
              size="middle"
              style={{
                display: "flex",
              }}
            >
              <Card title="Email" size="small">
                <p>{profile.email}</p>
              </Card>
              <Button onClick={() => followRequest("uniqueuser")}>Click to follow uniqueuser </Button>
              <Button onClick={() => unfollowRequest("uniqueuser")}>Click to Unfollow uniqueuser </Button>
              <Card title="Current Location" size="small">
                {/* <p>{profile.location ? profile.location: "No data yet"}</p> */}
                
                {center && <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  onClick={handleMapClick}
                  zoom={14}
                  onLoad={handleLoad}
                >
                <Marker 
                  position={center} 
                  icon= {{
                    url: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
                    scaledSize: new google.maps.Size(50, 50)
                  }}
                  center={
                    {
                      lat: 40.723301,
                      lng: -74.002988,
                    }
                  }
                  title="your location" 
                  label="A" />
                </GoogleMap>}
                
                {!center && 
                <Button disabled={isDisabled} onClick={handleGetLocation}>
                    {isLoading ? "Loading..." : "Get My Location"}
                </Button>}
              </Card>
              {!isEditMode ? (
              <Card title="Short Bio" size="small">
                <div>
                  <p>{profile.short_bio ? profile.short_bio : "No data yet"}</p>
                </div>
              </Card>):(
              <Card title="Short Bio" size="small">
                <Input
                  placeholder="Enter a short bio about yourself"
                  type="short_bio"
                  id="short_bio"
                  name="Short Bio"
                  value={formData.short_bio}
                  onChange={(e) =>
                    setFormData({ ...formData, short_bio: e.target.value })
                  }
                />
                </Card>)
              }
            </Space>
          </Col>
        
        <Col span={16} style={{ padding: "0.5rem" }}>
          <Space
            direction="vertical"
            size="middle"
            style={{
              display: "flex",
            }}
          >
            <Card
              title="My Followers"
              size="small"
              style={{ height: "100%" }}
            >
              {profile.followed_by.length > 0 ? profile.followed_by : "No followers yet :("}
            </Card>
            <Card
              title="Following"
              size="small"
              style={{ height: "100%" }}
            >
              {profile.following.length > 0 ? profile.following : "Not following anyone :("}
            </Card>
            <Card title="Saved Crawls" size="small" style={{ height: "100%" }}>
              No Saved crawls yet <a href="/">Explore</a>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
    }
    </div>
  );
}

export default Profile;
