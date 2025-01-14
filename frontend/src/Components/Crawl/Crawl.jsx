import axios from "axios";

import {
  Pane,
  Dialog,
  Text,
  ChevronDownIcon,
  Heading,
  SearchInput,
  TimeIcon,
  SwapHorizontalIcon,
  Textarea,
} from "evergreen-ui";
import { toaster } from "../../common";
import {
  Card,
  Space,
  Row,
  Col,
  Button,
  Input,
  Dropdown,
  Avatar,
  List,
  Tag,
  Tooltip,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { EditIcon, HeartIcon, CommentIcon } from "evergreen-ui";
import PlaceholderProfileImage from "../../static/sample.jpg";
import {
  GoogleMap,
  StandaloneSearchBox,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  DownOutlined,
  ClockCircleOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { Rating } from "react-simple-star-rating";
import {
  secondsToHms,
  TRANSIT_TYPES,
  convertDateHumanReadable,
} from "../../common";

function Crawl(props) {
  const { crawl_id } = useParams();
  const history = useHistory();
  const [isMounted, setIsMounted] = useState(false);
  const [crawlDetail, setCrawlDetail] = useState({});
  const [profile, setProfile] = useState({});
  const [isCurrUserAuthor, setIsCurrUserAuthor] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [chosenPoints, setChosenPoints] = useState([]);
  const [directions, setDirections] = useState({});
  const searchBox = useRef(null);
  const [otherUserProfile, setOtherUserProfile] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    data: "",
  });
  const [center, setCenter] = useState(null);
  const [locationsError, setLocationsError] = useState("");
  const [isShown, setIsShown] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [allReviews, setAllReviews] = useState([]);
  const [currUsername, setCurrUsername] = useState("");
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)

  const onLoad = (ref) => (searchBox.current = ref);
  const onPlacesChanged = () => {
    const {
      place_id: placeId,
      name,
      formatted_address,
      geometry: { location },
    } = searchBox.current.getPlaces()[0];
    if (chosenPoints.some((point) => point.placeId === placeId)) {
      toaster.danger("Place already exists in crawl");
      return;
    }
    updateDirections([
      ...chosenPoints,
      { placeId, name, formatted_address, location, transit: "WALKING" },
    ]);
  };

  const { TextArea } = Input;

  const updateDirections = async (_points) => {
    const points = (_points || []).map((point) => {
      if (point.placeId) return { placeId: point.placeId };
      return point.location;
    });
    if (points.length < 2) {
      setChosenPoints(_points);
      setDirections({});
      return;
    }
    const directionsService = new google.maps.DirectionsService();
    const out = {
      geocoded_waypoints: [],
      routes: [
        {
          bounds: new google.maps.LatLngBounds(),
          legs: [],
        },
      ],
      request: {
        destination: { placeId: points[points.length - 1] },
        origin: { placeId: points[0] },
        travelMode: "WALKING",
      },
      time: 0,
      distance: 0,
    };
    for (let i = 1; i < points.length; i++) {
      const request = {
        destination: points[i],
        origin: points[i - 1],
        travelMode: _points[i].transit,
      };
      let res;
      try {
        res = await directionsService.route(request);
      } catch (e) {
        toaster.danger(
          "Point not reachable. Cannot be added to current crawl.",
          {
            duration: 5,
          }
        );
      }
      if (res !== null && res.status === "OK") {
        out.geocoded_waypoints.push(...res.geocoded_waypoints);
        out.routes[0].legs.push(...res.routes[0].legs);
        out.routes[0].bounds.extend({
          lng: res.routes[0].bounds.Ha.hi,
          lat: res.routes[0].bounds.Ua.hi,
        });
        out.routes[0].bounds.extend({
          lng: res.routes[0].bounds.Ha.lo,
          lat: res.routes[0].bounds.Ua.lo,
        });
        out.time += res.routes[0].legs
          .map((x) => x.duration.value)
          .reduce((a, b) => a + b);
        out.distance += res.routes[0].legs
          .map((x) => x.distance.value)
          .reduce((a, b) => a + b);
      } else {
        toaster.danger(
          "Point not reachable. Cannot be added to current crawl.",
          {
            duration: 5,
          }
        );
      }
    }
    setDirections(out);
    setChosenPoints(_points);
  };

  const mapContainerStyle = {
    width: "750px",
    height: "500px",
  };

  const get_crawl_by_id = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/crawls/get_crawl_by_id/${crawl_id}/`
      );
      let formattedDate = convertDateHumanReadable(data.created_at);
      data.formattedDate = formattedDate;
      await setCrawlDetail(data);
      await setFormData(data);
      await setDirections(data.data.directions);
      await setChosenPoints(data.data.points);

      return data;
    } catch (e) {
      console.log(e);
      history.replace("/");
    }
  };

  const handleClickEditButton = () => {
    setIsEditMode(true);
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    let userinput = formData;
    if (userinput.description === null || userinput.description === "") {
      toaster.danger("Error: Please enter valid information! 🙁");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/crawls/update_crawl_by_id/${crawl_id}/`,
        {
          title: userinput.title,
          description: userinput.description,
          data: {
            points: chosenPoints,
            directions,
          },
        }
      );

      await setIsEditMode(false);
      await setCrawlDetail((prevCrawlDetail) => ({
        ...prevCrawlDetail,
        title: userinput.title,
        description: userinput.description,
      }));
      window.location.reload();
    } catch (e) {
      console.log(e);
    }
  };
  const handleClickDeleteButton = () => {
    setIsShown(true);
  };
  const deleteCrawl = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/crawls/crawl_delete_by_id/`,
        {
          id: crawl_id,
        }
      );
      toaster.success("Your crawl successfully has been deleted");
      history.replace("/");
      setIsShown(false);
    } catch (e) {
      toaster.danger("Error! Cannot delete the crawl.");
      console.log(e);
      setIsShown(false);
    }
  };

  const getProfile = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/auth/full_profile/`
      );
      setProfile(data);
      return data;
    } catch (e) {
      console.log(e);
      history.replace("/");
    }
  };

  const getOtherUserProfile = async (username) => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/auth/get_other_user_profile/${username}/`
      );
      setOtherUserProfile(data);
      return data;
    } catch (e) {
      history.replace("/");
      console.log(e);
    }
  };
  const isValidReview = () => {
    if (rating == 0){
       // if star was not clicked, throw error
      toaster.danger("Error! Empty rating");
      return false;
    }
    let author_id_to_find = currUsername;
    //If this author already left a review, throw error
    if (allReviews && allReviews.length > 0) {
      const isAuthorIdPresent = allReviews.some(obj => obj.author === author_id_to_find);
      if (isAuthorIdPresent){
        toaster.danger("Error! Already posted a review.");
        return false;
      }
    }
    return true;
  }


  const postReview = async () => {
    setHasSubmittedOnce(true)
    if (review.trim() === "" || review.trim().length > 200) return;
    if (isValidReview() == false){
      console.log("Error!");
      
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/crawls/review/${crawl_id}/`,
        {
          text: review.trim(),
          rating: rating.toString(10),
        }
      );
      toaster.success("Review posted!");
      setReview("");
      setRating(0);
      getAllReviews();
    } catch (e) {
      console.log(e);
    }
  };

  const getAllReviews = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/crawls/get_all_reviews/${crawl_id}/`
      );
      setAllReviews(data);
      console.log(data)
    } catch (e) {
      console.log(e);
    }
  };

  const viewModeGmap = (
    <Pane style={{ display: "flex" }}>
      <GoogleMap mapContainerStyle={{ width: "100%", height: 400 }} zoom={14}>
        <DirectionsRenderer
          options={{
            directions: directions,
          }}
        />
      </GoogleMap>
      <Pane
        style={{
          width: 500,
          height: "auto",
          overflow: "scroll",
          margin: "2rem",
        }}
      >
        <Pane
          style={{
            borderBottom: "1px solid #DDD",
            padding: "16px",
          }}
        >
          <Heading size={700} style={{ marginBottom: 8 }}>
            Crawl Stats
          </Heading>
          <div>Time: {secondsToHms(directions.time)}</div>
          <div>Distance: {(directions.distance / 1000).toFixed(1)}km</div>
        </Pane>
        {chosenPoints.map((p, idx) => (
          <Pane key={idx}>
            <Pane
              style={{
                borderBottom: "1px solid #DDD",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Pane>
                <Heading>
                  {String.fromCharCode("A".charCodeAt(0) + idx)}. {p.name}
                </Heading>
                <Text>{TRANSIT_TYPES[p.transit]}</Text>
              </Pane>
              {idx > 0 && (
                <Pane
                  style={{
                    marginTop: 16,
                    paddingLeft: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: "bolder", fontSize: 12 }}>
                    <TimeIcon />{" "}
                    {directions.routes[0].legs[idx - 1].duration.text}
                    <div style={{ height: 4 }} />
                    <SwapHorizontalIcon />
                    Distance:{" "}
                    {(
                      directions.routes[0].legs[idx - 1].distance.value / 1000
                    ).toFixed(1)}
                    km
                  </div>
                </Pane>
              )}
            </Pane>
          </Pane>
        ))}
      </Pane>
    </Pane>
  );

  const editModeGmap = (
    <Pane style={{ display: "flex" }}>
      <Pane style={{ padding: 32, paddingLeft: 0, flex: "0 0 70%" }}>
        <Pane
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <StandaloneSearchBox
              onLoad={onLoad}
              onPlacesChanged={onPlacesChanged}
            >
              <SearchInput
                style={{ width: 400 }}
                placeholder="Search for a place"
              />
            </StandaloneSearchBox>
          </div>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              marginTop: -50,
            }}
          >
            {chosenPoints?.length === 1 ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={10}
                center={chosenPoints[0].location}
              >
                <Marker position={chosenPoints[0].location} label="A" />
              </GoogleMap>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={10}
                center={
                  chosenPoints &&
                  chosenPoints.length === 0 && {
                    lat: 40.723301,
                    lng: -74.002988,
                  }
                }
              >
                <DirectionsRenderer
                  options={{
                    directions,
                  }}
                />
              </GoogleMap>
            )}
          </div>
        </Pane>
      </Pane>
      <Pane style={{ flex: "0 0 30%", overflow: "scroll", margin: "1rem" }}>
        {chosenPoints && directions && chosenPoints.length > 1 && (
          <Pane
            style={{
              borderBottom: "1px solid #DDD",
              padding: "16px",
            }}
          >
            <Heading size={700} style={{ marginBottom: 8 }}>
              Crawl Stats
            </Heading>
            <div>Time: {secondsToHms(directions.time)}</div>
            <div>Distance: {(directions.distance / 1000).toFixed(1)}km</div>
          </Pane>
        )}
        {chosenPoints &&
          chosenPoints.map((point, idx) => (
            <Pane
              style={{
                borderBottom: "1px solid #DDD",
                padding: "16px",
              }}
            >
              <Pane
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Heading>
                  {String.fromCharCode("A".charCodeAt(0) + idx)}. {point.name}
                </Heading>
                <Button
                  intent="danger"
                  onClick={() => {
                    const newChosenPoints = JSON.parse(
                      JSON.stringify(chosenPoints)
                    );
                    newChosenPoints.splice(idx, 1);
                    updateDirections(newChosenPoints);
                  }}
                >
                  Remove
                </Button>
              </Pane>
              {idx > 0 && (
                <Pane
                  style={{
                    marginTop: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: "bolder", fontSize: 12 }}>
                    <ClockCircleOutlined />{" "}
                    {directions.routes[0].legs[idx - 1].duration.text}
                    <div style={{ height: 4 }} />
                    <SwapOutlined /> Distance:{" "}
                    {(
                      directions.routes[0].legs[idx - 1].distance.value / 1000
                    ).toFixed(1)}
                    km
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          label: "Walk",
                          key: "WALKING",
                        },
                        {
                          label: "Drive",
                          key: "DRIVING",
                        },
                        {
                          label: "Bicycle",
                          key: "BICYCLING",
                        },
                        {
                          label: "Transit",
                          key: "TRANSIT",
                        },
                      ],
                      onClick: ({ key }) => {
                        const newChosenPoints = JSON.parse(
                          JSON.stringify(chosenPoints)
                        );
                        newChosenPoints[idx].transit = key;
                        updateDirections(newChosenPoints);
                      },
                    }}
                    onClick={() => {}}
                  >
                    <Button>
                      <Space>
                        {TRANSIT_TYPES[point.transit]}
                        <DownOutlined />
                      </Space>
                    </Button>
                  </Dropdown>
                </Pane>
              )}
            </Pane>
          ))}
        {locationsError && (
          <Text size={400} color="red600" style={{ fontWeight: "bold" }}>
            {locationsError}
          </Text>
        )}
      </Pane>
    </Pane>
  );

  const getData = async () => {
    getProfile().then((currUserProfile) => {
      setCurrUsername(currUserProfile.username)
      get_crawl_by_id().then((currCrawl) => {
        if (currUserProfile.username == currCrawl.author) {
          setIsCurrUserAuthor(true);
          setIsMounted(true);
        } else {
          // need to import the author's profile to use their profile image.
          getOtherUserProfile(currCrawl.author).then((r) => {
            setIsMounted(true);
          });
        }
      });
    });
  };

  const followRequest = async (target_username) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/auth/request-follow/`,
        {
          target_address: target_username,
        }
      );
      toaster.success("Changes saved!");
      setProfile((profile) => ({
        ...profile,
        is_following: true,
      }));
    } catch (e) {
      console.log(e);
    }
  };

  const unfollowRequest = async (target_username) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_URL_PREFIX}/api/auth/request-unfollow/`,
        {
          target_address: target_username,
        }
      );
      toaster.success("Unfollow request successful.");
      setProfile((profile) => ({
        ...profile,
        is_following: false,
      }));
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getData();
    getAllReviews();
  }, []);

  if (!isMounted) return <div></div>;
  return (
    <div className="crawl">
      <div>
        {!isEditMode ? (
          <div key={1} style={{ padding: "32px", paddingTop: "1rem" }}>
            <Pane>
              <Dialog
                isShown={isShown}
                title="Are you sure you want to delete this crawl?"
                onCloseComplete={() => setIsShown(false)}
                onConfirm={() => deleteCrawl()}
                confirmLabel="Yes, delete it"
              >
                This crawl will be permanently deleted.
              </Dialog>
            </Pane>
            <div
              style={{
                display: "flex",
                maxWidth: "150px",
                cursor: "pointer",
              }}
              className=""
            >
              {/* <Button type="primary" onClick={handleClickEditButton}>Edit
                      <span
                          style={{
                          paddingLeft: "4px",
                          verticalAlign: "text-top",
                          }}
                      >
                          <EditIcon />
                      </span>
                  </Button> */}
            </div>
            <div
              className="title-block"
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                height: 60,
              }}
            >
              <h1
                style={{
                  maxWidth: "80%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {crawlDetail.title}
              </h1>
              {isCurrUserAuthor && (
                <Button
                  style={{ marginLeft: 10 }}
                  danger
                  onClick={handleClickDeleteButton}
                >
                  Delete
                </Button>
              )}
            </div>
            {crawlDetail.tags && (
              <div style={{ marginTop: "1rem" }}>
                <Space size={[0, 8]} wrap>
                  {crawlDetail.tags &&
                    crawlDetail.tags.map((tag) => <Tag>{tag}</Tag>)}
                </Space>
              </div>
            )}
            <div>
              <p>{crawlDetail.formattedDate}</p>
            </div>
            <div className="author-block">
              <Row style={{ alignItems: "center" }}>
                <Link to={`/profile/${crawlDetail.author}`}>
                  <div
                    className="profile-circle"
                    style={{ height: 36, width: 36 }}
                  >
                    <img
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      src={
                        crawlDetail.author_profile_pic ||
                        PlaceholderProfileImage
                      }
                      alt="Profile Image"
                    />
                  </div>
                </Link>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Link to={`/profile/${crawlDetail.author}`}>
                    <h3 style={{ marginRight: 12, color: "#333" }}>
                      {crawlDetail.author}
                    </h3>
                  </Link>
                  {!isCurrUserAuthor && (
                    <>
                      {profile.is_following ? (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => unfollowRequest(crawlDetail.author)}
                        >
                          Following
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          onClick={() => followRequest(crawlDetail.author)}
                        >
                          Follow
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Row>
            </div>
            <div>
              <p style={{ width: "80%", marginBottom: "2rem" }}>
                {crawlDetail.description}
              </p>
            </div>

            <Pane style={{ marginTop: 4, width: "60%" }}>{viewModeGmap}</Pane>
          </div>
        ) : (
          // Current user is the author and is in Edit mode
          <div
            key={1}
            style={{ padding: "32px", paddingTop: "1rem", width: "100%" }}
          >
            <div style={{ maxWidth: "150px", cursor: "pointer" }} className="">
              <Button type="primary" onClick={handleSubmitUpdate}>
                Save changes
              </Button>
            </div>
            <div>
              <Row>
                <h1 style={{ marginBottom: 0 }}>
                  Title
                  <div>
                    <Input
                      placeholder="Edit the title."
                      style={{ width: "800px" }}
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                </h1>
              </Row>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <div>
                <h3 style={{ marginBottom: 0 }}>Description</h3>
                <TextArea
                  placeholder="Edit description."
                  type="text"
                  id="description"
                  name="description"
                  style={{ width: "800px", height: "60px" }}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
            <Pane style={{ display: "flex" }}>
              {chosenPoints && directions && editModeGmap}
            </Pane>
          </div>
        )}
      </div>
      <div key={1} style={{ padding: "32px", paddingTop: "1rem" }}>
        <div
          style={{
            display: "flex",
            maxWidth: "150px",
            cursor: "pointer",
          }}
          className=""
        >
          {/* <Button type="primary" onClick={handleClickEditButton}>Edit
                      <span
                          style={{
                          paddingLeft: "4px",
                          verticalAlign: "text-top",
                          }}
                      >
                          <EditIcon />
                      </span>
                  </Button> */}
        </div>
        <div
          className="title-block"
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            height: 60,
          }}
        >
          <h2
            style={{
              maxWidth: "80%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Post your Review
          </h2>
        </div>
        <div>
          <div>
            <Rating
              onClick={setRating}
              /* Available Props */
            />
          </div>
          <div>

            <Textarea
              style={{
                fontWeight: "bold",
                fontSize: 16,
                height: 64,
                maxWidth: 1000,
                minWidth: 1000,
              }}
              placeholder="Type your review..."
              onChange={(e) => setReview(e.target.value)}
              value={review}
              isInvalid={hasSubmittedOnce && (review.trim() === "" || review.trim().length > 2000)}
            />
          </div>
          {hasSubmittedOnce && review.trim() === "" && (
                      <Text size={400} color="red600" style={{ fontWeight: "bold" }}>
                      Required
                    </Text>
                    )}
          {hasSubmittedOnce && review.trim().length > 2000 && (
                      <Text size={400} color="red600" style={{ fontWeight: "bold" }}>
                      Review cannot contain more than 200 characters
                    </Text>
                    )}
        </div>
        <div style={{marginTop: 8}}>
          <Button onClick={postReview}>Submit</Button>
        </div>
        <div
          className="title-block"
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            height: 60,
          }}
        >
          
          <h2
            style={{
              maxWidth: "80%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Reviews
          </h2>
          
        </div>
        {allReviews.length == 0 && 
          <div style={{marginTop:"1rem", marginBottom:"2rem"}}>
            No Reviews yet... Be the first one to leave a review!
            </div>}
        <div>
          {allReviews.slice().reverse().map((review) => (
            <div style={{paddingTop:"1rem", paddingBottom:"1.2rem", maxWidth:"820px"}}>
              <div><span style={{fontSize:"1.1rem", fontWeight:"600"}}>{review.author}</span> </div>
              <div>
                <Rating
                  readonly
                  initialValue={parseFloat(review.rating)}
                  size={26}
                  /* Available Props */
                />
              </div>
              <div>
              {review.text}
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Crawl;
