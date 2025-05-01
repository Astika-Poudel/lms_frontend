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
  ChevronDown,
  ChevronUp,
  Search,
  Heart,
  ArrowUp,
} from "lucide-react";
import io from "socket.io-client";

// Custom suggestion for tagging
const suggestion = {
  items: ({ query }) => {
    return [];
  },
  render: () => {
    let reactRenderer;
    let popup;

    return {
      onStart: (props) => {
        reactRenderer = props;
        popup = props.clientRect;
        props.setTagging({ active: true, query: props.query, postId: props.postId });
      },
      onUpdate(props) {
        reactRenderer.query = props.query;
        popup = props.clientRect;
        props.setTagging({ active: true, query: props.query, postId: props.postId });
      },
      onKeyDown(props) {
        if (props.event.key === "Escape") {
          props.setTagging({ active: false, query: "", postId: null });
          return true;
        }
        return false;
      },
      onExit(props) {
        props.setTagging({ active: false, query: "", postId: null });
      },
    };
  },
};

// Editor Component Wrapper
const TiptapEditor = React.memo(({ postId, setTagging, taggableUsers, selectTag, tagging, onEditorChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          ...suggestion,
          setTagging,
          postId,
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "border border-gray-300 rounded-lg p-2 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-[#134e4a] prose prose-sm max-w-none",
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
    <div className="relative">
      <EditorContent editor={editor} />
      {tagging.active && tagging.postId === postId && (
        <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 w-64 max-h-48 overflow-y-auto">
          {taggableUsers
            .filter((u) => u.username.toLowerCase().includes(tagging.query.toLowerCase()))
            .map((u) => (
              <div
                key={u._id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => selectTag(u.username, postId)}
              >
                {u.firstname} {u.lastname} (@{u.username})
              </div>
            ))}
        </div>
      )}
    </div>
  );
});

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const CourseForum = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = UserData();
  const { progress, loading, fetchStudentCourseProgress } = CourseData();
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [taggableUsers, setTaggableUsers] = useState([]);
  const [tagging, setTagging] = useState({ active: false, query: "", postId: null });
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [newCommentEditors, setNewCommentEditors] = useState({});

  const forumRef = useRef(null);
  const isMounted = useRef(false);
  const hasFetchedInitialData = useRef(false);

  const debouncedSetPosts = useCallback(
    debounce((newPosts) => {
      if (isMounted.current) {
        setPosts(newPosts);
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
      }
    } catch (err) {
      if (!isMounted.current) return;
      console.error("Failed to load taggable users:", err);
      toast.error(err.response?.data?.message || "Failed to load taggable users");
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
      const { data } = await axios.post(
        `${LMS_Backend}/api/forum/${courseId}`,
        { title: newPostTitle, content, taggedUsernames },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isMounted.current) return;
      if (data.success) {
        setNewPostTitle("");
        newPostEditor.commands.setContent("");
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to create post");
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

  const togglePost = (postId) => {
    if (!isMounted.current) return;
    setExpandedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const extractTaggedUsernames = (content) => {
    const regex = /@(\w+)/g;
    const matches = content.match(regex) || [];
    return matches.map((match) => match.slice(1));
  };

  const selectTag = (username, postId) => {
    const editor = newCommentEditors[postId];
    if (!editor) return;

    editor.commands.insertContent(`@${username} `);
    if (isMounted.current) {
      setTagging({ active: false, query: "", postId: null });
    }
  };

  const handleSearch = () => {
    fetchPosts();
  };

  const handleBack = () => {
    navigate(`/student/course/progress/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#134e4a]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  if (!progress) {
    return <div className="text-center py-10 text-gray-600">No progress found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center text-black hover:text-gray-700 transition duration-300"
            >
              <ChevronLeft className="w-8 h-8 text-black" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {progress.course?.title} Discussion Forum
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
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
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#134e4a]"
            >
              <option value="createdAt">Date</option>
              <option value="reactions">Reactions</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              {sortOrder === "desc" ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-[#134e4a] text-white rounded-lg hover:bg-[#0c3c38]"
            >
              Search
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Start a Discussion</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
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
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <TiptapEditor
                  postId="newPost"
                  setTagging={setTagging}
                  taggableUsers={taggableUsers}
                  selectTag={selectTag}
                  tagging={tagging}
                  onEditorChange={handleEditorChange}
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#134e4a] text-white hover:bg-[#0c3c38] transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Post
              </button>
            </form>
          </div>

          <div ref={forumRef}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Discussions</h2>
            {posts.length === 0 ? (
              <p className="text-gray-600">No posts yet. Be the first to start a discussion!</p>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="border-b border-gray-200 py-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{post.title}</h3>
                      <div
                        className="text-sm text-gray-600 mt-1"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs text-gray-500">
                          Posted by {post.user.firstname} {post.user.lastname} (
                          {post.user.role}) on{" "}
                          {new Date(post.createdAt).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReaction(post._id, null, "like")}
                            className={`flex items-center gap-1 ${
                              post.reactions.some(
                                (r) => r.user._id === user._id && r.type === "like"
                              )
                                ? "text-red-500"
                                : "text-gray-500"
                            }`}
                          >
                            <Heart className="w-4 h-4" />
                            {post.reactions.filter((r) => r.type === "like").length}
                          </button>
                          <button
                            onClick={() => handleReaction(post._id, null, "upvote")}
                            className={`flex items-center gap-1 ${
                              post.reactions.some(
                                (r) => r.user._id === user._id && r.type === "upvote"
                              )
                                ? "text-blue-500"
                                : "text-gray-500"
                            }`}
                          >
                            <ArrowUp className="w-4 h-4" />
                            {post.reactions.filter((r) => r.type === "upvote").length}
                          </button>
                        </div>
                      </div>
                      {post.taggedUsers.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Tagged: {post.taggedUsers.map((u) => `@${u.username}`).join(", ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => togglePost(post._id)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {expandedPosts.includes(post._id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {expandedPosts.includes(post._id) && (
                    <div className="mt-4 pl-6">
                      {post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                          <Comment
                            key={comment._id}
                            comment={comment}
                            postId={post._id}
                            handleAddComment={handleAddComment}
                            handleReaction={handleReaction}
                            taggableUsers={taggableUsers}
                            user={user}
                            setNewCommentEditors={setNewCommentEditors}
                            tagging={tagging}
                            setTagging={setTagging}
                            selectTag={selectTag}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-gray-600">No comments yet.</p>
                      )}
                      <div className="mt-4 relative">
                        <TiptapEditor
                          postId={post._id}
                          setTagging={setTagging}
                          taggableUsers={taggableUsers}
                          selectTag={selectTag}
                          tagging={tagging}
                          onEditorChange={handleEditorChange}
                        />
                        <button
                          onClick={() =>
                            handleAddComment(post._id, null, newCommentEditors[post._id])
                          }
                          className="mt-2 p-2 bg-[#134e4a] text-white rounded-lg hover:bg-[#0c3c38] transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const Comment = React.memo(
  ({
    comment,
    postId,
    handleAddComment,
    handleReaction,
    taggableUsers,
    user,
    setNewCommentEditors,
    tagging,
    setTagging,
    selectTag,
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
      <div className="border-l-2 border-gray-300 pl-4 mb-3">
        <div
          className="text-sm text-gray-600"
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
        <div className="flex items-center gap-4 mt-1">
          <p className="text-xs text-gray-500">
            {comment.user.firstname} {comment.user.lastname} ({comment.user.role}) -{" "}
            {new Date(comment.createdAt).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleReaction(postId, comment._id, "like")}
              className={`flex items-center gap-1 ${
                comment.reactions.some((r) => r.user._id === user._id && r.type === "like")
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
            >
              <Heart className="w-4 h-4" />
              {comment.reactions.filter((r) => r.type === "like").length}
            </button>
            <button
              onClick={() => handleReaction(postId, comment._id, "upvote")}
              className={`flex items-center gap-1 ${
                comment.reactions.some((r) => r.user._id === user._id && r.type === "upvote")
                  ? "text-blue-500"
                  : "text-gray-500"
              }`}
            >
              <ArrowUp className="w-4 h-4" />
              {comment.reactions.filter((r) => r.type === "upvote").length}
            </button>
          </div>
        </div>
        {comment.taggedUsers.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Tagged: {comment.taggedUsers.map((u) => `@${u.username}`).join(", ")}
          </p>
        )}
        <button
          onClick={() => setShowReply(!showReply)}
          className="text-xs text-[#134e4a] hover:underline mt-1"
        >
          {showReply ? "Cancel" : "Reply"}
        </button>
        {showReply && (
          <div className="mt-2 relative">
            <TiptapEditor
              postId={`${postId}-${comment._id}`}
              setTagging={setTagging}
              taggableUsers={taggableUsers}
              selectTag={selectTag}
              tagging={tagging}
              onEditorChange={setNewCommentEditors}
            />
            <button
              onClick={() =>
                handleAddCommentWrapper(postId, comment._id, newCommentEditors[`${postId}-${comment._id}`])
              }
              className="mt-2 p-2 bg-[#134e4a] text-white rounded-lg hover:bg-[#0c3c38] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
        {comment.replies.length > 0 && (
          <div className="mt-3 pl-4">
            {comment.replies.map((reply) => (
              <Comment
                key={reply._id}
                comment={reply}
                postId={post._id}
                handleAddComment={handleAddComment}
                handleReaction={handleReaction}
                taggableUsers={taggableUsers}
                user={user}
                setNewCommentEditors={setNewCommentEditors}
                tagging={tagging}
                setTagging={setTagging}
                selectTag={selectTag}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

export default CourseForum;