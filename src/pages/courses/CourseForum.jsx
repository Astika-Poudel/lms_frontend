import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";
import axios from "axios";
import { LMS_Backend } from "../../main";
import toast from "react-hot-toast";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { ChevronLeft, Send, MessageSquare, Search, Heart, X, User, Edit2, Trash2 } from "lucide-react";
import io from "socket.io-client";
import { debounce } from "lodash";

// TiptapEditor Component (Unchanged)
const TiptapEditor = React.memo(
  ({ postId, taggableUsers, onEditorChange, initialContent }) => {
    const [tagging, setTagging] = useState({ active: false, query: "", postId: null, items: [] });

    const selectTag = (username) => {
      if (!editor) return;
      editor.commands.insertContent(`${username} `);
      setTagging({ active: false, query: "", postId: null, items: [] });
    };

    const editor = useEditor({
      extensions: [
        StarterKit,
        Mention.configure({
          HTMLAttributes: {
            class: "mention text-[#134e4a] font-semibold cursor-pointer",
          },
          suggestion: {
            items: ({ query }) => {
              if (!taggableUsers || taggableUsers.length === 0) return [];
              return taggableUsers
                .filter((user) => {
                  if (!user || !user.username) return false;
                  return user.username.toLowerCase().includes(query.toLowerCase());
                })
                .map((user) => ({
                  id: user._id,
                  label: `${user.username}`,
                  username: user.username,
                  firstname: user.firstname,
                  lastname: user.lastname,
                }));
            },
            render: () => {
              return {
                onStart: (props) => {
                  setTagging({
                    active: true,
                    query: props.query,
                    postId: postId,
                    items: props.items,
                  });
                },
                onUpdate(props) {
                  setTagging({
                    active: true,
                    query: props.query,
                    postId: postId,
                    items: props.items,
                  });
                },
                onKeyDown(props) {
                  if (props.event.key === "Escape") {
                    setTagging({ active: false, query: "", postId: null, items: [] });
                    return true;
                  }
                  return false;
                },
                onExit() {
                  setTagging({ active: false, query: "", postId: null, items: [] });
                },
              };
            },
          },
        }),
      ],
      content: initialContent || "",
      editorProps: {
        attributes: {
          class:
            "border border-gray-300 rounded-lg p-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#134e4a] prose prose-sm max-w-none",
        },
      },
      onCreate: ({ editor }) => onEditorChange(postId, editor),
      onUpdate: ({ editor }) => onEditorChange(postId, editor),
      onDestroy: () => onEditorChange(postId, null),
    });

    return (
      <div className="relative">
        <EditorContent editor={editor} />
        {tagging.active && tagging.postId === postId && (
          <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 w-64 max-h-48 overflow-y-auto">
            {tagging.items.length === 0 ? (
              tagging.query === "" ? (
                <div className="p-2 text-gray-500 italic">No users available to tag.</div>
              ) : (
                <div className="p-2 text-gray-500 italic">No matching users found.</div>
              )
            ) : (
              tagging.items
                .filter((u) => u && u.id)
                .map((u, index) => (
                  <div
                    key={u.id || `tag-${index}`}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => selectTag(u.username)}
                  >
                    {u.label}
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    );
  }
);

const CourseForum = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = UserData();
  const { progress, loading, fetchStudentCourseProgress } = CourseData();
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [editPost, setEditPost] = useState(null);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [taggableUsers, setTaggableUsers] = useState([]);
  const [newCommentEditors, setNewCommentEditors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [isTaggableUsersLoaded, setIsTaggableUsersLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const forumRef = useRef(null);
  const isMounted = useRef(false);
  const hasFetchedInitialData = useRef(false);

  const debouncedSetPosts = useCallback(
    debounce((newPosts) => {
      if (isMounted.current) {
        setAllPosts(newPosts);
        setPosts(showMyPosts ? newPosts.filter((post) => String(post.user?._id) === String(user?._id)) : newPosts);
      }
    }, 300),
    [showMyPosts, user?._id]
  );

  const debouncedSetError = useCallback(
    debounce((errorMessage) => {
      if (isMounted.current) {
        setError(errorMessage);
      }
    }, 300),
    []
  );

  const debouncedSetTaggableUsers = useCallback(
    debounce((users) => {
      if (isMounted.current) {
        setTaggableUsers(users);
        setIsTaggableUsersLoaded(true);
      }
    }, 300),
    []
  );

  const handleEditorChange = useCallback((postId, editor) => {
    if (isMounted.current) {
      setNewCommentEditors((prev) => ({
        ...prev,
        [postId]: editor,
      }));
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const { data } = await axios.get(`${LMS_Backend}/api/forum/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchQuery, sortBy, order: sortOrder },
      });
      if (!isMounted.current) return;
      if (data.success) {
        console.log("Fetched Posts:", data.posts);
        debouncedSetPosts(data.posts);
      } else {
        debouncedSetError(data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      debouncedSetError(err.response?.data?.message || "Failed to load forum posts");
    }
  }, [courseId, searchQuery, sortBy, sortOrder, debouncedSetPosts, debouncedSetError]);

  const loadTaggableUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const { data } = await axios.get(`${LMS_Backend}/api/forum/${courseId}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!isMounted.current) return;
      if (data.success) {
        if (!Array.isArray(data.users)) {
          setTaggableUsers([]);
        } else {
          debouncedSetTaggableUsers(data.users);
        }
      } else {
        toast.error(data.message || "Failed to load taggable users");
        setIsTaggableUsersLoaded(true);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to load taggable users");
      setIsTaggableUsersLoaded(true);
    }
  }, [courseId, debouncedSetTaggableUsers]);

  const loadData = useCallback(async () => {
    try {
      if (user?.role?.toLowerCase() !== "tutor") {
        const progressResult = await fetchStudentCourseProgress(courseId);
        if (!isMounted.current) return;
        if (!progressResult) {
          debouncedSetError("Failed to load course progress");
          return;
        }
      }
      await fetchPosts();
      await loadTaggableUsers();
    } catch (err) {
      if (!isMounted.current) return;
      debouncedSetError("Failed to load forum data");
    }
  }, [courseId, user?.role, fetchStudentCourseProgress, fetchPosts, loadTaggableUsers, debouncedSetError]);

  useEffect(() => {
    isMounted.current = true;

    if (!hasFetchedInitialData.current) {
      loadData();
      hasFetchedInitialData.current = true;
    }

    const newSocket = io(LMS_Backend, {
      query: { token: localStorage.getItem("token") },
    });
    setSocket(newSocket);

    newSocket.emit("joinCourseForum", courseId);

    const handleNewForumPost = ({ post }) => {
      if (isMounted.current) {
        setAllPosts((prev) => [post, ...prev]);
        setPosts((prev) =>
          showMyPosts
            ? [post, ...prev].filter((p) => String(p.user?._id) === String(user?._id))
            : [post, ...prev]
        );
      }
    };

    const handleNewForumComment = ({ postId, post }) => {
      if (isMounted.current) {
        setAllPosts((prev) => prev.map((p) => (p._id === postId ? post : p)));
        setPosts((prev) =>
          showMyPosts
            ? prev.map((p) => (p._id === postId ? post : p)).filter((p) => String(p.user?._id) === String(user?._id))
            : prev.map((p) => (p._id === postId ? post : p))
        );
      }
    };

    const handleForumPostDeleted = ({ postId }) => {
      if (isMounted.current) {
        setAllPosts((prev) => prev.filter((p) => p._id !== postId));
        setPosts((prev) =>
          showMyPosts
            ? prev.filter((p) => p._id !== postId).filter((p) => String(p.user?._id) === String(user?._id))
            : prev.filter((p) => p._id !== postId)
        );
      }
    };

    const handleForumPostUpdated = ({ post }) => {
      if (isMounted.current) {
        setAllPosts((prev) => prev.map((p) => (p._id === post._id ? post : p)));
        setPosts((prev) =>
          showMyPosts
            ? prev.map((p) => (p._id === post._id ? post : p)).filter((p) => String(p.user?._id) === String(user?._id))
            : prev.map((p) => (p._id === post._id ? post : p))
        );
      }
    };

    newSocket.on("newForumPost", handleNewForumPost);
    newSocket.on("newForumComment", handleNewForumComment);
    newSocket.on("forumPostDeleted", handleForumPostDeleted);
    newSocket.on("forumPostUpdated", handleForumPostUpdated);

    return () => {
      isMounted.current = false;
      newSocket.off("newForumPost", handleNewForumPost);
      newSocket.off("newForumComment", handleNewForumComment);
      newSocket.off("forumPostDeleted", handleForumPostDeleted);
      newSocket.off("forumPostUpdated", handleForumPostUpdated);
      newSocket.disconnect();
      Object.values(newCommentEditors).forEach((editor) => editor?.destroy());
    };
  }, [courseId, loadData, showMyPosts, user?._id]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostTitle) {
      toast.error("Title is required");
      return;
    }

    const newPostEditor = newCommentEditors["newPost"];
    if (!newPostEditor) {
      toast.error("Editor not initialized");
      return;
    }

    const content = newPostEditor.getHTML();
    if (!content || content.trim() === "<p></p>") {
      toast.error("Content is required");
      return;
    }

    const taggedUsernames = extractTaggedUsernames(content);

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await axios.post(
        `${LMS_Backend}/api/forum/${courseId}`,
        { title: newPostTitle, content, taggedUsernames },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isMounted.current) return;
      if (response.data.success) {
        setNewPostTitle("");
        newPostEditor.commands.setContent("");
        setEditPost(null);
        setIsModalOpen(false);
        toast.success(response.data.message);
        fetchPosts();
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    if (!newPostTitle) {
      toast.error("Title is required");
      return;
    }

    const newPostEditor = newCommentEditors["newPost"];
    if (!newPostEditor) {
      toast.error("Editor not initialized");
      return;
    }

    const content = newPostEditor.getHTML();
    if (!content || content.trim() === "<p></p>") {
      toast.error("Content is required");
      return;
    }

    const taggedUsernames = extractTaggedUsernames(content);

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await axios.put(
        `${LMS_Backend}/api/forum/${courseId}/${editPost._id}`,
        { title: newPostTitle, content, taggedUsernames },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isMounted.current) return;
      if (response.data.success) {
        setNewPostTitle("");
        newPostEditor.commands.setContent("");
        setEditPost(null);
        setIsModalOpen(false);
        toast.success(response.data.message);
        fetchPosts();
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to update post");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await axios.delete(
        `${LMS_Backend}/api/forum/${courseId}/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isMounted.current) return;
      if (response.data.success) {
        toast.success(response.data.message);
        fetchPosts();
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to delete post");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleReaction = async (postId, commentId = null, type) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const { data } = await axios.post(
        `${LMS_Backend}/api/forum/${courseId}/${postId}/reaction`,
        { commentId, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isMounted.current) return;
      if (data.success) {
        console.log("Reaction Response:", data.target);
        console.log("Current User:", user);
        setAllPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? commentId
                ? {
                    ...post,
                    comments: post.comments.map((c) =>
                      c._id === commentId ? data.target : c
                    ),
                  }
                : data.target
              : post
          )
        );
        setPosts((prev) =>
          showMyPosts
            ? prev.map((post) =>
                post._id === postId
                  ? commentId
                    ? {
                        ...post,
                        comments: post.comments.map((c) =>
                          c._id === commentId ? data.target : c
                        ),
                      }
                    : data.target
                  : post
              ).filter((p) => String(p.user?._id) === String(user?._id))
            : prev.map((post) =>
                post._id === postId
                  ? commentId
                    ? {
                        ...post,
                        comments: post.comments.map((c) =>
                          c._id === commentId ? data.target : c
                        ),
                      }
                    : data.target
                  : post
              )
        );
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to update reaction");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const extractTaggedUsernames = (content) => {
    const regex = /@?(\w+)/g;
    const matches = content.match(regex) || [];
    return matches.map((match) => match.replace('@', ''));
  };

  const handleSearch = () => {
    fetchPosts();
  };

  const handleBack = () => {
    if (user?.role?.toLowerCase() === "tutor") {
        navigate(`/tutor/courseoverview/${courseId}`);
    } else {
        navigate(`/student/course/progress/${courseId}`);
    }
  };

  const openModal = (post = null) => {
    if (post) {
      setEditPost(post);
      setNewPostTitle(post.title);
      const newPostEditor = newCommentEditors["newPost"];
      if (newPostEditor) {
        newPostEditor.commands.setContent(post.content);
      }
    } else {
      setEditPost(null);
      setNewPostTitle("");
      const newPostEditor = newCommentEditors["newPost"];
      if (newPostEditor) {
        newPostEditor.commands.setContent("");
      }
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditPost(null);
    setNewPostTitle("");
    const newPostEditor = newCommentEditors["newPost"];
    if (newPostEditor) newPostEditor.commands.setContent("");
  };

  const handleShowMyPosts = () => {
    if (!showMyPosts) {
      const myPosts = allPosts.filter((post) => String(post.user?._id) === String(user?._id));
      setPosts(myPosts);
      setShowMyPosts(true);
    } else {
      setPosts(allPosts);
      setShowMyPosts(false);
    }
  };

  const getPreviewContent = (content) => {
    const div = document.createElement("div");
    div.innerHTML = content || "";
    const text = div.textContent || div.innerText || "";
    return text.length > 200 ? text.substring(0, 200) + "..." : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="border-t-4 border-[#134e4a] rounded-full w-16 h-16 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-10">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800"
              type="button"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {progress?.course?.title || "Course"} Discussion Forum
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6 flex flex-col sm:flex-row gap-3 border-b border-gray-200 pb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#134e4a]"
                placeholder="Search posts..."
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#134e4a] w-full sm:w-32"
            >
              <option value="createdAt">Date</option>
              <option value="reactions">Likes</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#134e4a] w-full sm:w-32"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button
              onClick={handleSearch}
              className="bg-[#134e4a] text-white px-4 py-2 rounded-lg hover:bg-[#0c3c38] w-full sm:w-32"
            >
              Search
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Discussions</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleShowMyPosts}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-white ${
                    showMyPosts ? "bg-[#0c3c38]" : "bg-[#134e4a]"
                  } hover:bg-[#0c3c38]`}
                  type="button"
                >
                  <User className="w-4 h-4" />
                  {showMyPosts ? "Show All Posts" : "My Posts"}
                </button>
                <button
                  onClick={() => openModal()}
                  className="flex items-center gap-1 px-4 py-2 bg-[#134e4a] text-white rounded-lg hover:bg-[#0c3c38]"
                  type="button"
                >
                  <MessageSquare className="w-4 h-4" />
                  Start a Discussion
                </button>
              </div>
            </div>
            {posts.length === 0 ? (
              <p className="text-gray-600 italic text-center p-4 border border-gray-200 rounded-lg">
                {showMyPosts ? "You haven't posted anything yet." : "No posts yet. Be the first to start a discussion!"}
              </p>
            ) : (
              <div ref={forumRef}>
                {posts.map((post) => {
                  const previewContent = getPreviewContent(post.content);
                  const isLongContent = (post.content?.length || 0) > 200 || (post.content?.split('\n')?.length || 0) > 5;

                  return (
                    <div
                      key={post._id}
                      className="border-b border-gray-200 py-4 last:border-b-0 cursor-pointer"
                      onClick={() => navigate(`/course/forum/${courseId}/${post._id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800">{post.title || "Untitled"}</h3>
                          <div
                            className="text-sm text-gray-600 mt-1"
                            dangerouslySetInnerHTML={{
                              __html: isLongContent ? previewContent : (post.content || "<p>No content</p>"),
                            }}
                          />
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-gray-500">
                              Posted by {post.user?.firstname || "Unknown"} {post.user?.lastname || "User"} (
                              {post.user?.role || "Unknown"}) on{" "}
                              {post.createdAt
                                ? new Date(post.createdAt).toLocaleDateString("en-US", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Unknown Date"}
                            </p>
                            <div className="flex gap-3 items-center">
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsLoading(true);
                                  try {
                                    await handleReaction(post._id, null, "like");
                                  } catch (err) {
                                    toast.error("Failed to update reaction");
                                  } finally {
                                    if (isMounted.current) {
                                      setIsLoading(false);
                                    }
                                  }
                                }}
                                className={`flex items-center gap-1 text-gray-600 hover:text-red-500 ${
                                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                type="button"
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <div className="w-5 h-5 border-t-2 border-gray-600 rounded-full animate-spin"></div>
                                ) : (
                                  <Heart
                                    className={`w-5 h-5 ${
                                      post.reactions?.some((r) => {
                                        const reactionUserId = r.user?._id || r.user;
                                        return String(reactionUserId) === String(user?._id) && r.type === "like";
                                      })
                                        ? "fill-red-500 text-red-500"
                                        : ""
                                    }`}
                                  />
                                )}
                                <span className="text-sm">
                                  {post.reactions?.filter((r) => r.type === "like").length || 0}
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigate(`/course/forum/${courseId}/${post._id}`);
                                }}
                                className="flex items-center gap-1 text-gray-600 hover:text-[#134e4a]"
                                type="button"
                              >
                                <MessageSquare className="w-5 h-5" />
                                <span className="text-sm">{post.comments?.length || 0} Comments</span>
                              </button>
                            </div>
                          </div>
                          {post.taggedUsers?.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Tagged: {post.taggedUsers.map((u) => u?.username || "Unknown").join(", ")}
                            </p>
                          )}
                        </div>
                        {showMyPosts && String(post.user?._id) === String(user?._id) && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openModal(post);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-[#134e4a] text-white rounded-lg hover:bg-[#0c3c38]"
                              type="button"
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeletePost(post._id);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-[#420c09] text-white rounded-lg hover:bg-[#2f0706]"
                              type="button"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                {editPost ? "Edit Discussion" : "Start a Discussion"}
              </h2>
              <button onClick={closeModal} className="text-gray-600 hover:text-gray-800" type="button">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={editPost ? handleEditPost : handleCreatePost} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#134e4a]"
                  placeholder="Enter post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                {isTaggableUsersLoaded ? (
                  <>
                    {taggableUsers.length === 0 && (
                      <p className="text-sm text-gray-500 italic mb-2">
                        No users available to tag in this course.
                      </p>
                    )}
                    <TiptapEditor
                      postId="newPost"
                      taggableUsers={taggableUsers}
                      onEditorChange={handleEditorChange}
                      initialContent={editPost ? editPost.content : ""}
                    />
                  </>
                ) : (
                  <div className="p-2 text-gray-500 italic">Loading users...</div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isTaggableUsersLoaded || isLoading}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-white ${
                    isTaggableUsersLoaded && !isLoading
                      ? "bg-[#134e4a] hover:bg-[#0c3c38]"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {editPost ? "Update" : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseForum;