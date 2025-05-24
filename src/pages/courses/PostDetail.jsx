import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import axios from "axios";
import { LMS_Backend } from "../../main";
import toast from "react-hot-toast";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { ChevronLeft, Send, Heart, ChevronDown, ChevronUp } from "lucide-react";
import io from "socket.io-client";

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

// Comment Component (Unchanged)
const Comment = React.memo(
  ({
    comment,
    postId,
    handleAddComment,
    handleReaction,
    taggableUsers,
    user,
    newCommentEditors,
    setNewCommentEditors,
    isTaggableUsersLoaded,
    courseId,
  }) => {
    const [showReply, setShowReply] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      };
    }, []);

    const handleAddCommentWrapper = async (postId, commentId, editor) => {
      if (!editor) {
        toast.error("Editor not initialized");
        return;
      }
      const content = editor.getHTML();
      if (!content || content.trim() === "<p></p>") {
        toast.error("Comment content is required");
        return;
      }
      setIsLoading(true);
      try {
        await handleAddComment(postId, commentId, editor);
        if (isMounted.current) {
          setShowReply(false);
          editor.commands.setContent("");
        }
      } catch (err) {
        toast.error("Failed to add reply");
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    const displayName = comment.user
      ? `${comment.user.firstname || "Unknown"} ${comment.user.lastname || "User"} (${comment.user.role || "Unknown"})`
      : "Unknown User (Unknown)";
    const displayDate = comment.createdAt
      ? new Date(comment.createdAt).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Unknown Date";

    return (
      <div className="ml-4 border-l-2 border-gray-200 pl-4 mb-3">
        <div
          className="text-sm text-gray-600"
          dangerouslySetInnerHTML={{
            __html: comment.content && comment.content.trim() !== "<p></p>"
              ? comment.content
              : "<p>No content</p>",
          }}
        />
        <div className="flex items-center gap-4 mt-1">
          <p className="text-xs text-gray-500">
            {displayName} - {displayDate}
          </p>
          <div className="flex gap-3 items-center">
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsLoading(true);
                try {
                  await handleReaction(postId, comment._id, "like");
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
                    comment.reactions?.some(
                      (r) => {
                        const reactionUserId = r.user?._id || r.user;
                        return String(reactionUserId) === String(user?._id) && r.type === "like";
                      }
                    )
                      ? "fill-red-500 text-red-500"
                      : ""
                  }`}
                />
              )}
              <span className="text-sm">
                {comment.reactions?.filter((r) => r.type === "like").length || 0}
              </span>
            </button>
            {comment.replies?.length > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowReplies(!showReplies);
                }}
                className="flex items-center gap-1 text-gray-600 hover:text-[#134e4a]"
                type="button"
              >
                {showReplies ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
                <span className="text-sm">{comment.replies.length} Replies</span>
              </button>
            )}
          </div>
        </div>
        {comment.taggedUsers?.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Tagged: {comment.taggedUsers.map((u) => u?.username || "Unknown").join(", ")}
          </p>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowReply(!showReply);
          }}
          className="text-xs text-[#134e4a] underline mt-1"
          type="button"
        >
          {showReply ? "Cancel" : "Reply"}
        </button>
        {showReply && isTaggableUsersLoaded && (
          <div className="mt-2">
            {taggableUsers.length === 0 && (
              <p className="text-sm text-gray-500 italic mb-2">
                No users available to tag in this course.
              </p>
            )}
            <TiptapEditor
              postId={`${postId}-${comment._id}`}
              taggableUsers={taggableUsers}
              onEditorChange={setNewCommentEditors}
              initialContent=""
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowReply(false);
                  setNewCommentEditors((prev) => {
                    const editor = prev[`${postId}-${comment._id}`];
                    if (editor) editor.commands.setContent("");
                    return prev;
                  });
                }}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const editor = newCommentEditors[`${postId}-${comment._id}`];
                  handleAddCommentWrapper(postId, comment._id, editor);
                }}
                className="px-3 py-1 bg-[#134e4a] text-white rounded-lg hover:bg-[#0c3c38] flex items-center gap-1"
                type="button"
                disabled={isLoading}
              >
                <Send className="w-4 h-4" /> Comment
              </button>
            </div>
          </div>
        )}
        {showReplies && comment.replies?.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply, index) => (
              <Comment
                key={reply._id || `reply-${index}`}
                comment={reply}
                postId={postId}
                handleAddComment={handleAddComment}
                handleReaction={handleReaction}
                taggableUsers={taggableUsers}
                user={user}
                newCommentEditors={newCommentEditors}
                setNewCommentEditors={setNewCommentEditors}
                isTaggableUsersLoaded={isTaggableUsersLoaded}
                courseId={courseId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

const PostDetail = () => {
  const { courseId, postId } = useParams();
  const navigate = useNavigate();
  const { user } = UserData();
  const [post, setPost] = useState(null);
  const [taggableUsers, setTaggableUsers] = useState([]);
  const [newCommentEditors, setNewCommentEditors] = useState({});
  const [isTaggableUsersLoaded, setIsTaggableUsersLoaded] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  const handleEditorChange = useCallback((postId, editor) => {
    if (isMounted.current) {
      setNewCommentEditors((prev) => ({
        ...prev,
        [postId]: editor,
      }));
    }
  }, []);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const { data } = await axios.get(`${LMS_Backend}/api/forum/${courseId}/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!isMounted.current) return;
      if (data.success) {
        setPost({ ...data.post, comments: data.post.comments || [] });
      } else {
        setError(data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      setError(err.response?.data?.message || "Failed to load post");
    }
  };

  const loadTaggableUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const { data } = await axios.get(`${LMS_Backend}/api/forum/${courseId}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!isMounted.current) return;
      if (data.success) {
        const uniqueUsers = Array.from(
          new Map(
            data.users
              .filter((user) => user && user._id && user.username)
              .map((user) => [user._id, user])
          ).values()
        );
        setTaggableUsers(uniqueUsers);
        setIsTaggableUsersLoaded(true);
      } else {
        toast.error(data.message || "Failed to load taggable users");
        setIsTaggableUsersLoaded(true);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to load taggable users");
      setIsTaggableUsersLoaded(true);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchPost();
    loadTaggableUsers();

    const newSocket = io(LMS_Backend, {
      query: { token: localStorage.getItem("token") },
    });
    setSocket(newSocket);

    newSocket.emit("joinCourseForum", courseId);

    const handleNewForumComment = ({ postId: updatedPostId, post: updatedPost }) => {
      if (isMounted.current && updatedPostId === postId) {
        setPost(updatedPost);
      }
    };

    newSocket.on("newForumComment", handleNewForumComment);

    return () => {
      isMounted.current = false;
      newSocket.off("newForumComment", handleNewForumComment);
      newSocket.disconnect();
      Object.values(newCommentEditors).forEach((editor) => editor?.destroy());
    };
  }, [courseId, postId]);

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
      if (!token) throw new Error("No authentication token found");
      const { data } = await axios.post(
        `${LMS_Backend}/api/forum/${courseId}/${postId}/comment`,
        { content, taggedUsernames, parentCommentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isMounted.current) return;
      if (data.success) {
        setPost({ ...data.post, comments: data.post.comments || [] });
        setShowCommentBox(false);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to add comment");
      throw err;
    }
  };

  const handleReaction = async (postId, commentId = null, type) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const { data } = await axios.post(
        `${LMS_Backend}/api/forum/${courseId}/${postId}/reaction`,
        { commentId, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isMounted.current) return;
      if (data.success) {
        if (!commentId) {
          setPost({ ...data.target, comments: data.target.comments || [] });
        } else {
          setPost((prevPost) => {
            if (!prevPost) return prevPost;

            const updateCommentReactions = (comments, targetCommentId, updatedComment) => {
              return comments.map((comment) => {
                if (comment._id === targetCommentId) {
                  return { ...comment, reactions: updatedComment.reactions };
                }
                if (comment.replies && comment.replies.length > 0) {
                  return {
                    ...comment,
                    replies: updateCommentReactions(comment.replies, targetCommentId, updatedComment),
                  };
                }
                return comment;
              });
            };

            const updatedComments = updateCommentReactions(prevPost.comments, commentId, data.target);
            return { ...prevPost, comments: updatedComments };
          });
        }
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      if (!isMounted.current) return;
      toast.error(err.response?.data?.message || "Failed to update reaction");
      throw err;
    }
  };

  const extractTaggedUsernames = (content) => {
    const regex = /@?(\w+)/g;
    const matches = content.match(regex) || [];
    return matches.map((match) => match.replace("@", ""));
  };

  const handleBack = () => {
    navigate(`/course/forum/${courseId}`);
  };

  if (error) {
    return <div className="text-center text-red-500 p-10">{error}</div>;
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="border-t-4 border-[#134e4a] rounded-full w-16 h-16 animate-spin"></div>
      </div>
    );
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{post.title || "Untitled"}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">{post.title || "Untitled"}</h2>
            <div
              className="text-sm text-gray-600 mt-1"
              dangerouslySetInnerHTML={{ __html: post.content || "<p>No content</p>" }}
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
            </div>
            {post.taggedUsers?.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Tagged: {post.taggedUsers.map((u) => u?.username || "Unknown").join(", ")}
              </p>
            )}
          </div>

          {isTaggableUsersLoaded && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Add a Comment</h3>
              {!showCommentBox ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCommentBox(true);
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2 text-gray-600 hover:bg-gray-100 text-left"
                  type="button"
                >
                  Join the conversation
                </button>
              ) : (
                <>
                  {taggableUsers.length === 0 && (
                    <p className="text-sm text-gray-500 italic mb-2">
                      No users available to tag in this course.
                    </p>
                  )}
                  <TiptapEditor
                    postId={post._id}
                    taggableUsers={taggableUsers}
                    onEditorChange={handleEditorChange}
                    initialContent=""
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setNewCommentEditors((prev) => {
                          const editor = prev[post._id];
                          if (editor) editor.commands.setContent("");
                          return prev;
                        });
                        setShowCommentBox(false);
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        setIsLoading(true);
                        try {
                          await handleAddComment(post._id, null, newCommentEditors[post._id]);
                        } catch (err) {
                          toast.error("Failed to add comment");
                        } finally {
                          if (isMounted.current) {
                            setIsLoading(false);
                          }
                        }
                      }}
                      className="px-3 py-1 bg-[#134e4a] text-white rounded-lg hover:bg-[#0c3c38] flex items-center gap-1"
                      type="button"
                      disabled={isLoading}
                    >
                      <Send className="w-4 h-4" /> Comment
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Comments ({post && post.comments ? post.comments.length : 0})
            </h3>
            {post && post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment}
                  postId={post._id}
                  handleAddComment={handleAddComment}
                  handleReaction={handleReaction}
                  taggableUsers={taggableUsers}
                  user={user}
                  newCommentEditors={newCommentEditors}
                  setNewCommentEditors={handleEditorChange}
                  isTaggableUsersLoaded={isTaggableUsersLoaded}
                  courseId={courseId}
                />
              ))
            ) : (
              <p className="text-gray-600 italic">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;