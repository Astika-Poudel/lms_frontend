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
import {
  ChevronLeft,
  Send,
  MessageSquare,
  Search,
  Heart,
  ArrowUp,
  X,
  Edit,
  Trash,
  User,
} from "lucide-react";
import io from "socket.io-client";
import { debounce } from "lodash";

// TiptapEditor Component
const TiptapEditor = React.memo(
  ({ postId, taggableUsers, onEditorChange, initialContent }) => {
    const [tagging, setTagging] = useState({ active: false, query: "", postId: null, items: [] });

    const selectTag = (username) => {
      if (!editor) return;

      editor.commands.insertContent(`@${username} `);
      setTagging({ active: false, query: "", postId: null, items: [] });
    };

    const editor = useEditor({
      extensions: [
        StarterKit,
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
            style: "color: #134e4a; font-weight: 600; cursor: pointer;",
          },
          suggestion: {
            items: ({ query }) => {
              console.log("Taggable Users in items:", taggableUsers);
              console.log("Query:", query);
              if (!taggableUsers || taggableUsers.length === 0) {
                return [];
              }
              return taggableUsers
                .filter((user) => {
                  if (!user || !user.username) {
                    console.warn("Invalid user object:", user);
                    return false;
                  }
                  return user.username.toLowerCase().includes(query.toLowerCase());
                })
                .map((user) => ({
                  id: user._id,
                  label: `@${user.username}`,
                  username: user.username,
                  firstname: user.firstname,
                  lastname: user.lastname,
                }));
            },
            render: () => {
              let reactRenderer;
              let popup;

              return {
                onStart: (props) => {
                  console.log("Mention onStart triggered:", props);
                  reactRenderer = props;
                  popup = props.clientRect;
                  setTagging({
                    active: true,
                    query: props.query,
                    postId: postId, // Use the postId prop directly
                    items: props.items,
                  });
                },
                onUpdate(props) {
                  console.log("Mention onUpdate:", props);
                  reactRenderer.query = props.query;
                  popup = props.clientRect;
                  setTagging({
                    active: true,
                    query: props.query,
                    postId: postId, // Use the postId prop directly
                    items: props.items,
                  });
                },
                onKeyDown(props) {
                  console.log("Mention onKeyDown:", props.event.key);
                  if (props.event.key === "Escape") {
                    setTagging({ active: false, query: "", postId: null, items: [] });
                    return true;
                  }
                  return false;
                },
                onExit() {
                  console.log("Mention onExit");
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
            "border border-gray-300 rounded-lg p-2 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-[#134e4a] prose prose-sm max-w-none",
        },
      },
      onCreate: ({ editor }) => {
        onEditorChange(postId, editor);
      },
      onDestroy: () => {
        onEditorChange(postId, null);
      },
    });

    return (
      <div style={{ position: "relative" }}>
        <EditorContent editor={editor} />
        {tagging.active && tagging.postId === postId && (
          <div
            style={{
              position: "absolute",
              zIndex: 10,
              backgroundColor: "white",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              marginTop: "0.25rem",
              width: "16rem",
              maxHeight: "12rem",
              overflowY: "auto",
            }}
          >
            {console.log("Tagging items in dropdown:", tagging.items)}
            {tagging.items.length === 0 ? (
              tagging.query === "" ? (
                <div
                  style={{
                    padding: "0.5rem",
                    color: "#6b7280",
                    fontStyle: "italic",
                  }}
                >
                  No users available to tag.
                </div>
              ) : (
                <div
                  style={{
                    padding: "0.5rem",
                    color: "#6b7280",
                    fontStyle: "italic",
                  }}
                >
                  No matching users found.
                </div>
              )
            ) : (
              tagging.items.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: "0.5rem",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f4f6")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
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

// Comment Component
const Comment = React.memo(
  ({
    comment,
    postId,
    handleAddComment,
    handleReaction,
    taggableUsers,
    user,
    setNewCommentEditors,
    isTaggableUsersLoaded,
  }) => {
    const [showReply, setShowReply] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      };
    }, []);

    const handleAddCommentWrapper = async (postId, commentId, editor) => {
      await handleAddComment(postId, commentId, editor);
      if (isMounted.current) {
        setShowReply(false);
      }
    };

    return (
      <div style={{ borderLeft: "2px solid #d1d5db", paddingLeft: "1rem", marginBottom: "0.75rem" }}>
        <div
          style={{ fontSize: "0.875rem", color: "#4b5563" }}
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem" }}>
          <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            {comment.user.firstname} {comment.user.lastname} ({comment.user.role}) -{" "}
            {new Date(comment.createdAt).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={() => handleReaction(postId, comment._id, "like")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                color: comment.reactions.some((r) => r.user._id === user._id && r.type === "like") ? "#ef4444" : "black",
              }}
            >
              <Heart style={{ width: "24px", height: "24px" }} />
              <span style={{ fontSize: "0.875rem", marginLeft: "0.25rem" }}>
                {comment.reactions.filter((r) => r.type === "like").length}
              </span>
            </button>
            <button
              onClick={() => handleReaction(postId, comment._id, "upvote")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                color: comment.reactions.some((r) => r.user._id === user._id && r.type === "upvote") ? "#3b82f6" : "black",
              }}
            >
              <ArrowUp style={{ width: "24px", height: "24px" }} />
              <span style={{ fontSize: "0.875rem", marginLeft: "0.25rem" }}>
                {comment.reactions.filter((r) => r.type === "upvote").length}
              </span>
            </button>
            <button
              onClick={() => setShowReply(!showReply)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                color: "black",
              }}
            >
              <MessageSquare style={{ width: "24px", height: "24px" }} />
              <span style={{ fontSize: "0.875rem", marginLeft: "0.25rem" }}>
                {comment.replies.length}
              </span>
            </button>
          </div>
        </div>
        {comment.taggedUsers.length > 0 && (
          <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
            Tagged: {comment.taggedUsers.map((u) => `@${u.username}`).join(", ")}
          </p>
        )}
        <button
          onClick={() => setShowReply(!showReply)}
          style={{ fontSize: "0.75rem", color: "#134e4a", textDecoration: "underline", marginTop: "0.25rem", cursor: "pointer" }}
        >
          {showReply ? "Cancel" : "Reply"}
        </button>
        {showReply && isTaggableUsersLoaded && (
          <div style={{ marginTop: "0.5rem", position: "relative" }}>
            <TiptapEditor
              postId={`${postId}-${comment._id}`}
              taggableUsers={taggableUsers}
              onEditorChange={setNewCommentEditors}
            />
            <button
              onClick={() =>
                handleAddCommentWrapper(postId, comment._id, newCommentEditors[`${postId}-${comment._id}`])
              }
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem",
                backgroundColor: "#134e4a",
                color: "white",
                borderRadius: "0.5rem",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0c3c38")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#134e4a")}
            >
              <Send style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>
        )}
        {comment.replies.length > 0 && (
          <div style={{ marginTop: "0.75rem", paddingLeft: "1rem" }}>
            {comment.replies.map((reply) => (
              <Comment
                key={reply._id}
                comment={reply}
                postId={postId}
                handleAddComment={handleAddComment}
                handleReaction={handleReaction}
                taggableUsers={taggableUsers}
                user={user}
                setNewCommentEditors={setNewCommentEditors}
                isTaggableUsersLoaded={isTaggableUsersLoaded}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

// Main CourseForum Component
const CourseForum = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = UserData();
  const { progress, loading, fetchStudentCourseProgress } = CourseData();
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]); // Store all posts for filtering
  const [newPostTitle, setNewPostTitle] = useState("");
  const [editPost, setEditPost] = useState(null);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [taggableUsers, setTaggableUsers] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [newCommentEditors, setNewCommentEditors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false); // State to toggle My Posts filter
  const [isTaggableUsersLoaded, setIsTaggableUsersLoaded] = useState(false); // Track if taggable users are loaded

  const forumRef = useRef(null);
  const isMounted = useRef(false);
  const hasFetchedInitialData = useRef(false);

  const debouncedSetPosts = useCallback(
    debounce((newPosts) => {
      if (isMounted.current) {
        setPosts(newPosts);
        setAllPosts(newPosts); // Store all posts for filtering
      }
    }, 300),
    []
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
        console.log("Updated taggable users:", users);
        setIsTaggableUsersLoaded(true); // Set loaded flag
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
      const { data } = await axios.get(`${LMS_Backend}/api/forum/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchQuery, sortBy, order: sortOrder },
      });
      if (!isMounted.current) return;
      if (data.success) {
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
      const { data } = await axios.get(`${LMS_Backend}/api/forum/${courseId}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!isMounted.current) return;
      if (data.success) {
        debouncedSetTaggableUsers(data.users);
      } else {
        toast.error(data.message);
        setIsTaggableUsersLoaded(true); // Still set as loaded to avoid infinite loading
      }
    } catch (err) {
      if (!isMounted.current) return;
      console.error("Failed to load taggable users:", err);
      toast.error(err.response?.data?.message || "Failed to load taggable users");
      setIsTaggableUsersLoaded(true); // Still set as loaded to avoid infinite loading
    }
  }, [courseId, debouncedSetTaggableUsers]);

  const loadData = useCallback(async () => {
    const progressResult = await fetchStudentCourseProgress(courseId);
    if (!isMounted.current) return;
    if (!progressResult) {
      debouncedSetError("Failed to load course progress");
      return;
    }

    await fetchPosts();
    await loadTaggableUsers();
  }, [courseId, fetchStudentCourseProgress, fetchPosts, loadTaggableUsers, debouncedSetError]);

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
        debouncedSetPosts((prev) => [post, ...prev]);
      }
    };

    const handleNewForumComment = ({ postId, post }) => {
      if (isMounted.current) {
        debouncedSetPosts((prev) => prev.map((p) => (p._id === postId ? post : p)));
      }
    };

    newSocket.on("newForumPost", handleNewForumPost);
    newSocket.on("newForumComment", handleNewForumComment);

    return () => {
      isMounted.current = false;
      newSocket.off("newForumPost", handleNewForumPost);
      newSocket.off("newForumComment", handleNewForumComment);
      newSocket.disconnect();
      Object.values(newCommentEditors).forEach((editor) => editor?.destroy());
    };
  }, [courseId, loadData, debouncedSetPosts]);

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

    try {
      const token = localStorage.getItem("token");
      let response;
      if (editPost) {
        response = await axios.put(
          `${LMS_Backend}/api/forum/${courseId}/${editPost._id}`,
          { title: newPostTitle, content, taggedUsernames },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${LMS_Backend}/api/forum/${courseId}`,
          { title: newPostTitle, content, taggedUsernames },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
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
      toast.error(err.response?.data?.message || (editPost ? "Failed to update post" : "Failed to create post"));
    }
  };

  const handleEditPost = (post) => {
    setEditPost(post);
    setNewPostTitle(post.title);
    setIsModalOpen(true);
  };

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.delete(`${LMS_Backend}/api/forum/${courseId}/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!isMounted.current) return;
      if (data.success) {
        toast.success(data.message);
        fetchPosts();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to delete post");
    }
  };

  const handleAddComment = async (postId, parentCommentId = null, editor) => {
    if (!editor) {
      toast.error("Editor not initialized");
      return;
    }

    const content = editor.getHTML();
    if (!content || content.trim() === "<p></p>") {
      toast.error("Comment content is required");
      return;
    }

    const taggedUsernames = extractTaggedUsernames(content);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${LMS_Backend}/api/forum/${courseId}/${postId}/comment`,
        { content, taggedUsernames, parentCommentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isMounted.current) return;
      if (data.success) {
        editor.commands.setContent("");
        debouncedSetPosts((prev) => prev.map((p) => (p._id === postId ? data.post : p)));
        setExpandedPosts((prev) => prev.filter((id) => id !== postId));
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleReaction = async (postId, commentId = null, type) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${LMS_Backend}/api/forum/${courseId}/${postId}/reaction`,
        { commentId, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isMounted.current) return;
      if (data.success) {
        debouncedSetPosts((prev) =>
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
        toast.success("Reaction updated");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to update reaction");
    }
  };

  const toggleCommentEditor = (postId) => {
    if (expandedPosts.includes(postId)) {
      setExpandedPosts((prev) => prev.filter((id) => id !== postId));
    } else {
      setExpandedPosts((prev) => [...prev, postId]);
    }
  };

  const extractTaggedUsernames = (content) => {
    const regex = /@(\w+)/g;
    const matches = content.match(regex) || [];
    return matches.map((match) => match.slice(1));
  };

  const handleSearch = () => {
    fetchPosts();
  };

  const handleBack = () => {
    navigate(`/student/course/progress/${courseId}`);
  };

  const openModal = () => {
    setEditPost(null);
    setNewPostTitle("");
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
      const myPosts = allPosts.filter((post) => String(post.user._id) === String(user._id));
      setPosts(myPosts);
      setShowMyPosts(true);
    } else {
      setPosts(allPosts);
      setShowMyPosts(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <div style={{ borderTop: "4px solid #134e4a", borderRadius: "50%", width: "4rem", height: "4rem", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: "#ef4444", textAlign: "center", padding: "2.5rem" }}>{error}</div>;
  }

  if (!progress) {
    return <div style={{ textAlign: "center", padding: "2.5rem", color: "#4b5563" }}>No progress found</div>;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <header style={{ backgroundColor: "white", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)", padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={handleBack}
              style={{ display: "flex", alignItems: "center", color: "black", transition: "color 0.3s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "black")}
            >
              <ChevronLeft style={{ width: "2rem", height: "2rem", color: "black" }} />
            </button>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827" }}>
              {progress.course?.title} Discussion Forum
            </h1>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem 1rem" }}>
        <div style={{ backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)", padding: "1.5rem" }}>
          {/* Search Section */}
          <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.5rem 0.5rem 2.5rem",
                  outline: "none",
                  transition: "all 0.3s",
                }}
                placeholder="Search posts..."
                onFocus={(e) => (e.target.style.border = "1px solid #134e4a")}
                onBlur={(e) => (e.target.style.border = "1px solid #d1d5db")}
              />
              <Search style={{ position: "absolute", left: "0.75rem", top: "0.65rem", width: "1.25rem", height: "1.25rem", color: "#9ca3af" }} />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                outline: "none",
                transition: "all 0.3s",
                width: "120px",
              }}
              onFocus={(e) => (e.target.style.border = "1px solid #134e4a")}
              onBlur={(e) => (e.target.style.border = "1px solid #d1d5db")}
            >
              <option value="createdAt">Date</option>
              <option value="reactions">Reactions</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                outline: "none",
                transition: "all 0.3s",
                width: "120px",
              }}
              onFocus={(e) => (e.target.style.border = "1px solid #134e4a")}
              onBlur={(e) => (e.target.style.border = "1px solid #d1d5db")}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button
              onClick={handleSearch}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#134e4a",
                color: "white",
                borderRadius: "0.5rem",
                transition: "background-color 0.3s",
                width: "100px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0c3c38")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#134e4a")}
            >
              Search
            </button>
          </div>

          {/* Discussions Section */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827" }}>Discussions</h2>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={handleShowMyPosts}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: showMyPosts ? "#0c3c38" : "#134e4a",
                    color: "white",
                    transition: "background-color 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0c3c38")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = showMyPosts ? "#0c3c38" : "#134e4a")}
                >
                  <User style={{ width: "1rem", height: "1rem" }} />
                  {showMyPosts ? "Show All Posts" : "My Posts"}
                </button>
                <button
                  onClick={openModal}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#134e4a",
                    color: "white",
                    transition: "background-color 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0c3c38")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#134e4a")}
                >
                  <MessageSquare style={{ width: "1rem", height: "1rem" }} />
                  Start a Discussion
                </button>
              </div>
            </div>
            {posts.length === 0 ? (
              <p style={{ color: "#4b5563", fontStyle: "italic", textAlign: "center", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
                {showMyPosts ? "You haven't posted anything yet." : "No posts yet. Be the first to start a discussion!"}
              </p>
            ) : (
              <div ref={forumRef}>
                {posts.map((post) => (
                  <div key={post._id} style={{ borderBottom: "1px solid #e5e7eb", padding: "1rem 0", borderBottomWidth: posts.indexOf(post) === posts.length - 1 ? "0" : "1px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827" }}>{post.title}</h3>
                        <div
                          style={{ fontSize: "0.875rem", color: "#4b5563", marginTop: "0.25rem" }}
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                          <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            Posted by {post.user.firstname} {post.user.lastname} (
                            {post.user.role}) on{" "}
                            {new Date(post.createdAt).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <button
                              onClick={() => handleReaction(post._id, null, "like")}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                color: post.reactions.some((r) => r.user._id === user._id && r.type === "like") ? "#ef4444" : "black",
                              }}
                            >
                              <Heart style={{ width: "24px", height: "24px" }} />
                              <span style={{ fontSize: "0.875rem", marginLeft: "0.25rem" }}>
                                {post.reactions.filter((r) => r.type === "like").length}
                              </span>
                            </button>
                            <button
                              onClick={() => handleReaction(post._id, null, "upvote")}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                color: post.reactions.some((r) => r.user._id === user._id && r.type === "upvote") ? "#3b82f6" : "black",
                              }}
                            >
                              <ArrowUp style={{ width: "24px", height: "24px" }} />
                              <span style={{ fontSize: "0.875rem", marginLeft: "0.25rem" }}>
                                {post.reactions.filter((r) => r.type === "upvote").length}
                              </span>
                            </button>
                            <button
                              onClick={() => toggleCommentEditor(post._id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                color: "black",
                              }}
                            >
                              <MessageSquare style={{ width: "24px", height: "24px" }} />
                              <span style={{ fontSize: "0.875rem", marginLeft: "0.25rem" }}>
                                {post.comments.length}
                              </span>
                            </button>
                          </div>
                        </div>
                        {post.taggedUsers.length > 0 && (
                          <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                            Tagged: {post.taggedUsers.map((u) => `@${u.username}`).join(", ")}
                          </p>
                        )}
                      </div>
                      {String(post.user._id) === String(user._id) && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleEditPost(post)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              color: "#134e4a",
                            }}
                          >
                            <Edit style={{ width: "20px", height: "20px" }} />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              color: "#ef4444",
                            }}
                          >
                            <Trash style={{ width: "20px", height: "20px" }} />
                          </button>
                        </div>
                      )}
                    </div>
                    {post.comments.length > 0 && (
                      <div style={{ marginTop: "1rem", paddingLeft: "1.5rem" }}>
                        {post.comments.map((comment) => (
                          <Comment
                            key={comment._id}
                            comment={comment}
                            postId={post._id}
                            handleAddComment={handleAddComment}
                            handleReaction={handleReaction}
                            taggableUsers={taggableUsers}
                            user={user}
                            setNewCommentEditors={setNewCommentEditors}
                            isTaggableUsersLoaded={isTaggableUsersLoaded}
                          />
                        ))}
                      </div>
                    )}
                    {expandedPosts.includes(post._id) && isTaggableUsersLoaded && (
                      <div style={{ marginTop: "1rem", paddingLeft: "1.5rem" }}>
                        <div style={{ position: "relative" }}>
                          <TiptapEditor
                            postId={post._id}
                            taggableUsers={taggableUsers}
                            onEditorChange={handleEditorChange}
                          />
                          <button
                            onClick={() =>
                              handleAddComment(post._id, null, newCommentEditors[post._id])
                            }
                            style={{
                              marginTop: "0.5rem",
                              padding: "0.5rem",
                              backgroundColor: "#134e4a",
                              color: "white",
                              borderRadius: "0.5rem",
                              transition: "background-color 0.3s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0c3c38")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#134e4a")}
                          >
                            <Send style={{ width: "1rem", height: "1rem" }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal for Creating/Editing a Discussion */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", borderRadius: "0.5rem", padding: "1.5rem", width: "100%", maxWidth: "32rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827" }}>
                {editPost ? "Edit Discussion" : "Start a Discussion"}
              </h2>
              <button onClick={closeModal} style={{ color: "#4b5563", transition: "color 0.3s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#111827")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4b5563")}>
                <X style={{ width: "1.5rem", height: "1.5rem" }} />
              </button>
            </div>
            <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" }}>Title *</label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    padding: "0.5rem",
                    outline: "none",
                    transition: "all 0.3s",
                  }}
                  placeholder="Enter post title"
                  onFocus={(e) => (e.target.style.border = "1px solid #134e4a")}
                  onBlur={(e) => (e.target.style.border = "1px solid #d1d5db")}
                />
              </div>
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" }}>Content *</label>
                {isTaggableUsersLoaded ? (
                  <TiptapEditor
                    postId="newPost"
                    taggableUsers={taggableUsers}
                    onEditorChange={handleEditorChange}
                    initialContent={editPost ? editPost.content : ""}
                  />
                ) : (
                  <div style={{ padding: "0.5rem", color: "#6b7280", fontStyle: "italic" }}>
                    Loading users...
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#e5e7eb",
                    color: "#1f2937",
                    borderRadius: "0.5rem",
                    transition: "background-color 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d1d5db")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isTaggableUsersLoaded}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: isTaggableUsersLoaded ? "#134e4a" : "#d1d5db",
                    color: "white",
                    transition: "background-color 0.3s",
                    cursor: isTaggableUsersLoaded ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (isTaggableUsersLoaded) {
                      e.currentTarget.style.backgroundColor = "#0c3c38";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isTaggableUsersLoaded) {
                      e.currentTarget.style.backgroundColor = "#134e4a";
                    }
                  }}
                >
                  <MessageSquare style={{ width: "1rem", height: "1rem" }} />
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