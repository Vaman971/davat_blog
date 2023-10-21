import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import "../../Css/DetailStory.css"
import Loader from '../GeneralScreens/Loader';
import { FaRegHeart, FaHeart } from 'react-icons/fa'
import { RiDeleteBin6Line } from 'react-icons/ri'
import { FiEdit, FiArrowLeft } from 'react-icons/fi'
import { FaRegComment } from 'react-icons/fa'
import { BsBookmarkPlus, BsThreeDots, BsBookmarkFill } from 'react-icons/bs'
import CommentSidebar from '../CommentScreens/CommentSidebar';

const DetailStory = () => {
  const [likeStatus, setLikeStatus] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [activeUser, setActiveUser] = useState({})
  const [story, setStory] = useState({})
  const [storyLikeUser, setStoryLikeUser] = useState([])
  const [storyReportUser, setStoryReportUser] = useState([])
  const [sidebarShowStatus, setSidebarShowStatus] = useState(false)
  const [loading, setLoading] = useState(true)
  const slug = useParams().slug
  const [storyReadListStatus, setStoryReadListStatus] = useState(false)
  const [reportCount, setReportCount] = useState(0);
  const [userReported, setUserReported] = useState(false);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false); // for deleting function

  const navigate = useNavigate();

  useEffect(() => {

    const userReportedKey = `reported_${slug}`;
    const hasReported = localStorage.getItem(userReportedKey) === 'true';
    setUserReported(hasReported);

    const getDetailStory = async () => {
      setLoading(true)
      var activeUser = {}
      try {
        const { data } = await axios.get("/auth/private", {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        activeUser = data.user

        setActiveUser(activeUser);
       

      }
      catch (error) {
        setActiveUser({})
      }

      try {
        const { data } = await axios.post(`/story/${slug}`, { activeUser })
        setStory(data.data)
        setLikeStatus(data.likeStatus)
        setLikeCount(data.data.likeCount)
        setStoryLikeUser(data.data.likes)
        setUserReported(data.userReported)
        setReportCount(data.data.reportCount)
        setStoryReportUser(data.data.reports)


        setLoading(false)

        const story_id = data.data._id;

        if (activeUser.readList) {

          if (!activeUser.readList.includes(story_id)) {
            setStoryReadListStatus(false)
          }
          else {
            setStoryReadListStatus(true)
          }
        }

        if (story.reportCount > 30) {
          setAutoDeleteEnabled(true);
        }
      }
      catch (error) {
        setStory({})
        navigate("/not-found")
      }
    };
    getDetailStory();

  }, [slug, setLoading])

  useEffect(() => {
    // Create a new function to delete the blog
    const deleteBlogIfReportExceeds30 = async () => {
      try {
        if (autoDeleteEnabled) {
          await axios.delete(`/story/${slug}/deleteIfReportExceeds30`, {
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          });

          // After deletion, you may want to navigate to a different page or handle it in some way
          navigate('/deleted-successfully');
        }
      } catch (error) {
        // Handle the error if the deletion request fails
        console.error('Auto-delete request failed', error);
      }
    };

    // Use setInterval to periodically check and delete the blog
    const autoDeleteInterval = setInterval(deleteBlogIfReportExceeds30, 60000); // Checks every minute (adjust as needed)

    return () => {
      // Clean up the interval when the component unmounts
      clearInterval(autoDeleteInterval);
    };
  }, [slug, autoDeleteEnabled]);


  const handleLike = async () => {
    setTimeout(() => {
      setLikeStatus(!likeStatus)
    }, 1500)

    try {
      const { data } = await axios.post(`/story/${slug}/like`, { activeUser }, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      setLikeCount(data.data.likeCount)
      setStoryLikeUser(data.data.likes)
    }
    catch (error) {
      setStory({})
      localStorage.removeItem("authToken")
      navigate("/")
    }
  }

  const handleReport = async () => {
    if (window.confirm("Do you want to delete this post")) {

      if (userReported) {
        alert('You have already reported this story.');
        return;
      }

      if (!userReported) {
        // Update the reported state

        setReportCount(reportCount + 1);
        setUserReported(true);

        // Save in local storage that the user has reported
        const userReportedKey = `reported_${slug}`;
        localStorage.setItem(userReportedKey, 'true');

        try {
          // Send a report request to the backend
         const { data } = await axios.post(`/story/${slug}/report`, { activeUser }, {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });
          setReportCount(data.data.reportCount)
          setStoryReportUser(data.data.reports)
        } catch (error) {
          console.error("Report request failed", error);
        }
      }
    }
  };

  const handleDelete = async () => {

    if (window.confirm("Do you want to delete this post")) {

      try {

        await axios.delete(`/story/${slug}/delete`, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        })
        navigate("/")

      }
      catch (error) {
        console.log(error)
      }

    }

  }



  const editDate = (createdAt) => {

    const d = new Date(createdAt)
      ;
    var datestring = d.toLocaleString('eng', { month: 'long' }).substring(0, 3) + " " + d.getDate()
    return datestring
  }

  const addStoryToReadList = async () => {

    try {

      const { data } = await axios.post(`/user/${slug}/addStoryToReadList`, { activeUser }, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      setStoryReadListStatus(data.status)

      document.getElementById("readListLength").textContent = data.user.readListLength
    }
    catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      {
        loading ? <Loader /> :
          <>

            <div className='Inclusive-detailStory-page'>

              <div className="top_detail_wrapper">
                <Link to={'/'} >
                  <FiArrowLeft />
                </Link>
                <h5>{story.title}</h5>

                <div className='story-general-info'>

                  <ul>
                    {story.author &&
                      <li className='story-author-info'>
                        <img src={`/userPhotos/${story.author.photo}`} alt={story.author.username} />
                        <span className='story-author-username'>{story.author.username}  </span>
                      </li>
                    }
                    <li className='story-createdAt'>
                      {
                        editDate(story.createdAt)
                      }
                    </li>
                    <b>-</b>

                    <li className='story-readtime'>
                      {story.readtime} min read

                    </li>

                  </ul>

                  {
                    !activeUser.username &&
                    <div className='comment-info-wrap'>

                      <i onClick={(prev) => {
                        setSidebarShowStatus(!sidebarShowStatus)
                      }}>
                        <FaRegComment />
                      </i>


                      <b className='commentCount'>{story.commentCount}</b>

                    </div>
                  }

                  {activeUser && story.author &&
                    story.author._id === activeUser._id ?
                    <div className="top_story_transactions">
                      <Link className='editStoryLink' to={`/story/${story.slug}/edit`}>
                        <FiEdit />
                      </Link>
                      <span className='deleteStoryLink' onClick={handleDelete}>
                        <RiDeleteBin6Line />
                      </span>
                    </div> : null
                  }
                </div>

              </div>

              <div className="CommentFieldEmp">

                <CommentSidebar slug={slug} sidebarShowStatus={sidebarShowStatus} setSidebarShowStatus={setSidebarShowStatus}
                  activeUser={activeUser}
                />

              </div>

              <div className='story-content' >

                <div className="story-banner-img">
                  <img src={`/storyImages/${story.image}`} alt={story.title} />

                </div>

                <div className='content' dangerouslySetInnerHTML={{ __html: (story.content) }}>
                </div>
              </div>


              {
                activeUser && story.author._id !== activeUser._id ? (

                  userReported ? (
                    <div className="reported-message">
                      This blog has been reported.
                    </div>
                  )
                    :

                    (
                      <div className='reportButton'>
                        <button onClick={handleReport}>Report</button>
                      </div>
                    ))
                  :
                  null
              }

              {activeUser.username &&
                <div className='fixed-story-options'>

                  <ul>
                    <li>

                      <i onClick={handleLike} >

                        {likeStatus ? <FaHeart color="#0063a5" /> :
                          <FaRegHeart />
                        }
                      </i>

                      <b className='likecount'
                        style={likeStatus ? { color: "#0063a5" } : { color: "rgb(99, 99, 99)" }}
                      >  {likeCount}
                      </b>

                    </li>


                    <li>
                      <i onClick={(prev) => {
                        setSidebarShowStatus(!sidebarShowStatus)
                      }}>
                        <FaRegComment />
                      </i>

                      <b className='commentCount'>{story.commentCount}</b>

                    </li>

                  </ul>

                  <ul>
                    <li>
                      <i onClick={addStoryToReadList}>

                        {storyReadListStatus ? <BsBookmarkFill color='#0205b1' /> :
                          <BsBookmarkPlus />
                        }
                      </i>
                    </li>

                    <li className='BsThreeDots_opt'>
                      <i  >
                        <BsThreeDots />
                      </i>

                      {activeUser &&
                        story.author._id === activeUser._id ?
                        <div className="delete_or_edit_story  ">
                          <Link className='editStoryLink' to={`/story/${story.slug}/edit`}>
                            <p>Edit Story</p>
                          </Link>
                          <div className='deleteStoryLink' onClick={handleDelete}>
                            <p>Delete Story</p>
                          </div>
                        </div> : null
                      }
                    </li>
                  </ul>
                </div>
              }
            </div>
          </>
      }
    </>
  )
}

export default DetailStory;
