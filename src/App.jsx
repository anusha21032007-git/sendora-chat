import "./App.css";
import { useEffect, useState } from "react";

import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  collection,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "./firebase";

const provider = new GoogleAuthProvider();

function App() {
  const [user, setUser] = useState(null);

  const [contacts, setContacts] = useState([]);

  const [selectedChat, setSelectedChat] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  // ---- AI Smart Reply state ----
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // -------- NEW STATE FOR GROUPS ----------
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [groupMessage, setGroupMessage] = useState("");
  const [groupMessages, setGroupMessages] = useState([]);

  // LOGIN
  async function login() {
    const result = await signInWithPopup(auth, provider);
    await setDoc(
      doc(db, "users", result.user.uid),
      {
        uid: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        photo: result.user.photoURL,
      }
    );
  }

  // LOGOUT
  const logout = async () => {
    await signOut(auth);
  };

  // AUTH STATE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ADD CONTACT
  const addContact = async () => {
    if (!emailInput.trim()) return;
    const snapshot = await getDocs(collection(db, "users"));
    const foundUser = snapshot.docs
      .map((doc) => doc.data())
      .find((u) => u.email.toLowerCase() === emailInput.toLowerCase());
    if (!foundUser) {
      alert("User not found");
      return;
    }
    if (foundUser.uid === user.uid) {
      alert("You cannot add yourself");
      return;
    }
    await addDoc(collection(db, "contacts"), {
      owner: user.uid,
      contactUid: foundUser.uid,
      contactName: foundUser.name,
      contactEmail: foundUser.email,
      contactPhoto: foundUser.photo,
    });
    setEmailInput("");
  };

  // DELETE CHAT
  const deleteChat = async () => {
    if (!selectedChat || !user) return;
    const confirmDelete = window.confirm("Delete all messages in this chat?");
    if (!confirmDelete) return;
    try {
      const q = query(collection(db, "messages"));
      const snapshot = await getDocs(q);
      const deletePromises = [];
      snapshot.forEach((docSnap) => {
        const msg = docSnap.data();
        if (
          (msg.sender === user.uid && msg.receiver === selectedChat.contactUid) ||
          (msg.sender === selectedChat.contactUid && msg.receiver === user.uid)
        ) {
          deletePromises.push(deleteDoc(doc(db, "messages", docSnap.id)));
        }
      });
      await Promise.all(deletePromises);
      setMessages([]);
      setShowMenu(false);
      alert("Chat deleted successfully!");
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat.");
    }
  };

  // BLOCK USER
  const blockUser = async () => {
    if (!selectedChat || !user) return;
    const confirmBlock = window.confirm("Block this user?");
    if (!confirmBlock) return;
    const isAlreadyBlocked = blockedUsers.some((u) => u.blockedId === selectedChat.contactUid);
    if (isAlreadyBlocked) {
      alert("User is already blocked");
      return;
    }
    try {
      await addDoc(collection(db, "blockedUsers"), {
        blockerId: user.uid,
        blockedId: selectedChat.contactUid,
        createdAt: serverTimestamp(),
      });
      setSelectedChat(null);
      setShowMenu(false);
      alert("User blocked");
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Failed to block user.");
    }
  };

  // REMOVE CONTACT
  const removeContact = async (contactId) => {
    const confirmRemove = window.confirm("Remove this contact?");
    if (!confirmRemove) return;
    try {
      await deleteDoc(doc(db, "contacts", contactId));
      setSelectedChat(null);
      setShowMenu(false);
    } catch (error) {
      console.error("Error removing contact:", error);
    }
  };

  // -------- NEW: TOGGLE MEMBER SELECTION ----------
  const toggleMember = (id) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // -------- NEW: CREATE GROUP ----------
  const createGroup = async () => {
    if (!groupName.trim() || selectedMemberIds.length === 0) return;
    try {
      // Ensure no undefined values in members array
      const members = [...selectedMemberIds.filter(Boolean), user.uid];
      await addDoc(collection(db, "groups"), {
        name: groupName.trim(),
        createdBy: user.uid,
        members,
        createdAt: serverTimestamp(),
      });
      setGroupModalOpen(false);
      setGroupName("");
      setSelectedMemberIds([]);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    }
  };

  // -------- NEW: HANDLE GROUP CLICK ----------
  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setSelectedChat(null);
  };

  // FETCH BLOCKED USERS
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "blockedUsers"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBlockedUsers(list);
    });
    return () => unsub();
  }, [user]);

  // FETCH CONTACTS
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "contacts"));
    const unsub = onSnapshot(q, (snapshot) => {
      const myContacts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((c) => c.owner === user.uid);
      setContacts(myContacts);
    });
    return () => unsub();
  }, [user]);

  // FETCH GROUPS
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "groups"));
    const unsub = onSnapshot(q, (snapshot) => {
      const groupsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(groupsList);
    });
    return () => unsub();
  }, [user]);

  // FETCH PRIVATE MESSAGES
  useEffect(() => {
    if (!selectedChat || !user) return;
    const q = query(collection(db, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map((doc) => doc.data());
      const filtered = allMessages.filter(
        (msg) =>
          (msg.sender === user.uid && msg.receiver === selectedChat.contactUid) ||
          (msg.sender === selectedChat.contactUid && msg.receiver === user.uid)
      );
      setMessages(filtered);
      // ---- AI Smart Reply trigger ----
      const latestIncoming = filtered
        .filter((m) => m.sender !== user.uid)
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)[0];
      if (latestIncoming) {
        generateAiSuggestions(latestIncoming.text);
      }
    });
    return () => unsub();
  }, [selectedChat, user]);

  // ---- AI Smart Reply functions ----
  const generateAiSuggestions = async (incomingText) => {
    if (!incomingText) return;
    setAiLoading(true);
    setAiError(false);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key missing");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Generate exactly three short reply suggestions (no punctuation) for the following message: "${incomingText}". Return them as a JSON array of strings.`,
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await response.json();
      const suggestionText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // Expecting something like ["Yes, I'm available","Not sure yet","I'll let you know"]
      const parsed = JSON.parse(suggestionText);
      setAiSuggestions(Array.isArray(parsed) ? parsed.slice(0, 3) : []);
    } catch (e) {
      console.error("AI suggestion error:", e);
      setAiError(true);
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  // FETCH GROUP MESSAGES
  useEffect(() => {
    if (!selectedGroup || !user) return;
    const q = query(
      collection(db, "groupMessages"),
      orderBy("createdAt")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((msg) => msg.groupId === selectedGroup.id);
      setGroupMessages(all);
    });
    return () => unsub();
  }, [selectedGroup, user]);

  // SEND PRIVATE MESSAGE
  const sendMessage = async () => {
    if (!message.trim()) return;
    await addDoc(collection(db, "messages"), {
      text: message,
      sender: user.uid,
      receiver: selectedChat.contactUid,
      senderName: user.displayName,
      senderPhoto: user.photoURL,
      createdAt: serverTimestamp(),
    });
    setMessage("");
  };

  // SEND GROUP MESSAGE
  const sendGroupMessage = async () => {
    if (!groupMessage.trim() || !selectedGroup) return;
    await addDoc(collection(db, "groupMessages"), {
      text: groupMessage,
      sender: user.uid,
      groupId: selectedGroup.id,
      senderName: user.displayName,
      senderPhoto: user.photoURL,
      createdAt: serverTimestamp(),
    });
    setGroupMessage("");
  };

  // ENTER KEY HANDLER
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      if (selectedChat) sendMessage();
      else if (selectedGroup) sendGroupMessage();
    }
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Sendora</h1>
          <p>Realtime Firebase Chat App</p>
          <button onClick={login}>Continue with Google</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-top">
          <h1>Sendora</h1>
          <button onClick={logout}>Logout</button>
        </div>

        {/* ADD CONTACT */}
        <div
          style={{
            padding: "15px",
            borderBottom: "1px solid #1d2d44",
          }}
        >
          <input
            type="text"
            placeholder="Add email to chat"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              outline: "none",
              marginBottom: "10px",
              background: "#162433",
              color: "white",
            }}
          />
          <button
            onClick={addContact}
            style={{
              width: "100%",
              padding: "12px",
              background: "#2563eb",
              border: "none",
              borderRadius: "12px",
              color: "white",
              cursor: "pointer",
            }}
          >
            Add Contact
          </button>
        </div>

        {/* CREATE GROUP BUTTON */}
        <button
          onClick={() => setGroupModalOpen(true)}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2563eb",
            border: "none",
            borderRadius: "12px",
            color: "white",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Create Group
        </button>

        {/* CONTACTS LIST */}
        <div className="chat-list">
          {contacts.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? "bg-blue-600 text-white" : ""}`}
              onClick={() => setSelectedChat(chat)}
            >
              <img src={chat.contactPhoto} alt="" />
              <div>
                <h3>{chat.contactName}</h3>
                <p>{chat.contactEmail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* GROUPS LIST */}
        <div className="groups-list" style={{ marginTop: "20px" }}>
          <h3 className="text-sm font-medium text-gray-300 mb-1">Groups</h3>
          {groups.map((group) => (
            <div
              key={group.id}
              className={`chat-item ${selectedGroup?.id === group.id ? "bg-blue-600 text-white" : ""}`}
              onClick={() => handleGroupClick(group)}
            >
              <span>👥 {group.name}</span>
            </div>
          ))}
        </div>

        {/* PROFILE */}
        <div className="profile">
          <img src={user.photoURL} alt="" />
          <div>
            <h3>{user.displayName}</h3>
            <p>You</p>
          </div>
        </div>
      </div>

      {/* MAIN CHAT WINDOW */}
      <div className="chat-window">
        {/* PRIVATE CHAT */}
        {selectedChat && (
          <>
            <div className="chat-header">
              <div className="chat-user">
                <button
                  onClick={() => setSelectedChat(null)}
                  style={{
                    background: "#2563eb",
                    border: "none",
                    color: "white",
                    width: "45px",
                    height: "45px",
                    borderRadius: "50%",
                    fontSize: "22px",
                    cursor: "pointer",
                  }}
                >
                  ←
                </button>
                <img src={selectedChat.contactPhoto} alt="" />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div>
                    <h2>{selectedChat.contactName}</h2>
                    <p>Online</p>
                  </div>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "white",
                        fontSize: "24px",
                        cursor: "pointer",
                      }}
                    >
                      •
                    </button>
                    {showMenu && (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "35px",
                          background: "#162433",
                          borderRadius: "10px",
                          minWidth: "170px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="menu-item"
                          onClick={() => {
                            alert(`Name: ${selectedChat.contactName}\nEmail: ${selectedChat.contactEmail}`);
                          }}
                        >
                          View Profile
                        </div>
                        <div className="menu-item">Delete Chat</div>
                        <div
                          className="menu-item"
                          onClick={() => removeContact(selectedChat.id)}
                        >
                          Remove Contact
                        </div>
                        <div className="menu-item">Block User</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender === user.uid ? "own" : ""}`}
                >
                  <div className="message-user">
                    <img src={msg.senderPhoto} alt="" />
                    <h4>{msg.senderName}</h4>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            {/* AI Smart Reply suggestions */}
            {aiLoading && (
              <div className="p-2 text-sm text-gray-400">Generating suggestions...</div>
            )}
            {aiError && (
              <div className="p-2 text-sm text-red-400">AI suggestions unavailable</div>
            )}
            {aiSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2">
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    className="px-3 py-1 bg-gray-700 rounded-full text-sm hover:bg-gray-600"
                    onClick={() => setMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="message-input">
              <input
                type="text"
                placeholder="Type message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        )}

        {/* GROUP CHAT */}
        {selectedGroup && (
          <>
            <div className="chat-header">
              <div className="chat-user">
                <button
                  onClick={() => setSelectedGroup(null)}
                  style={{
                    background: "#2563eb",
                    border: "none",
                    color: "white",
                    width: "45px",
                    height: "45px",
                    borderRadius: "50%",
                    fontSize: "22px",
                    cursor: "pointer",
                  }}
                >
                  ←
                </button>
                <div style={{ marginLeft: "10px" }}>
                  <h2>{selectedGroup.name}</h2>
                  <p>Group Chat</p>
                </div>
              </div>
            </div>
            <div className="messages">
              {groupMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender === user.uid ? "own" : ""}`}
                >
                  <div className="message-user">
                    <img src={msg.senderPhoto} alt="" />
                    <h4>{msg.senderName}</h4>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="message-input">
              <input
                type="text"
                placeholder="Type group message..."
                value={groupMessage}
                onChange={(e) => setGroupMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button onClick={sendGroupMessage}>Send</button>
            </div>
          </>
        )}

        {/* EMPTY STATE */}
        {!selectedChat && !selectedGroup && (
          <div className="empty-chat">
            <h1>Add a contact or select a group to start chatting</h1>
          </div>
        )}

        {/* GROUP CREATION MODAL */}
        {groupModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Create Group</h2>
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              />
              <div className="mb-4">
                <p className="text-sm mb-2">Add members</p>
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedMemberIds.includes(contact.contactUid)}
                      onChange={() => toggleMember(contact.contactUid)}
                    />
                    <span>{contact.contactName}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => setGroupModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;