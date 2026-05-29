
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

  const [selectedChat, setSelectedChat] =
    useState(null);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [emailInput, setEmailInput] =
    useState("");
    const [showMenu, setShowMenu] =
  useState(false);
  const [blockedUsers, setBlockedUsers] =
  useState([]);
  
  // LOGIN

  async function login() {
    const result = await signInWithPopup(
      auth,
      provider
    );

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
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  // ADD CONTACT

const addContact = async () => {
  if (!emailInput.trim()) return;

  const snapshot = await getDocs(
    collection(db, "users")
  );

  const foundUser = snapshot.docs
    .map((doc) => doc.data())
    .find(
      (u) =>
        u.email.toLowerCase() ===
        emailInput.toLowerCase()
    );

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
const deleteChat = async () => {
  const confirmDelete =
    window.confirm(
      "Delete all messages in this chat?"
    );

  if (!confirmDelete) return;

  alert(
    "Delete Chat backend will be added next"
  );
};
const blockUser = () => {
  const confirmBlock =
    window.confirm(
      "Block this user?"
    );

  if (!confirmBlock) return;

  alert("User blocked");
};

  // FETCH CONTACTS

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "contacts"));

    const unsub = onSnapshot(q, (snapshot) => {
      const allContacts = snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

      const myContacts =
  snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(
      (c) => c.owner === user.uid
    );

      setContacts(myContacts);
    });

    return () => unsub();
  }, [user]);
  

  // FETCH MESSAGES

  useEffect(() => {
    if (!selectedChat || !user) return;

    const q = query(
      collection(db, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map(
        (doc) => doc.data()
      );

      const filtered = allMessages.filter(
        (msg) =>
          (msg.sender === user.uid &&
            msg.receiver ===
              selectedChat.contactUid) ||
          (msg.sender ===
            selectedChat.contactUid &&
            msg.receiver === user.uid)
      );

      setMessages(filtered);
    });

    return () => unsub();
  }, [selectedChat, user]);

  // SEND MESSAGE

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


  // ENTER KEY

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  }

  // LOGIN SCREEN

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Sendora</h1>

          <p>Realtime Firebase Chat App</p>

          <button onClick={login}>
            Continue with Google
          </button>
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

          <button onClick={logout}>
            Logout
          </button>
        </div>

        {/* ADD CONTACT */}

        <div
          style={{
            padding: "15px",
            borderBottom:
              "1px solid #1d2d44",
          }}
        >
          <input
            type="text"
            placeholder="Add email to chat"
            value={emailInput}
            onChange={(e) =>
              setEmailInput(e.target.value)
            }
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
        

        {/* CONTACTS */}

        <div className="chat-list">
          {contacts.map((chat) => (
            <div
              key={chat.id}
              className="chat-item"
              onClick={() =>
                setSelectedChat(chat)
              }
            >
              <img
                src={chat.contactPhoto}
                alt=""
              />

              <div>
                <h3>{chat.contactName}</h3>

                <p>{chat.contactEmail}</p>
              </div>
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

      {/* CHAT WINDOW */}

      <div className="chat-window">

        {selectedChat ? (
          <>

            {/* HEADER */}

            <div className="chat-header">

              <div className="chat-user">

                <button
                  onClick={() =>
                    setSelectedChat(null)
                  }
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

                <img
                  src={
                    selectedChat.contactPhoto
                  }
                  alt=""
                />

                <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  }}
>
  <div>
    <h2>
      {selectedChat.contactName}
    </h2>

    <p>Online</p>
  </div>

  <div
    style={{
      position: "relative",
    }}
  >
    <button
      onClick={() =>
        setShowMenu(!showMenu)
      }
      style={{
        background: "transparent",
        border: "none",
        color: "white",
        fontSize: "24px",
        cursor: "pointer",
      }}
    >
      ⋮
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
    alert(
      `Name: ${selectedChat.contactName}
Email: ${selectedChat.contactEmail}`
    );
  }}
>
  View Profile
</div>

        <div className="menu-item">
          Delete Chat
        </div>

        <div
          className="menu-item"
          onClick={() =>
            removeContact(
              selectedChat.id
            )
          }
        >
          Remove Contact
        </div>

        <div className="menu-item">
          Block User
        </div>
      </div>
    )}
  </div>
</div>

              </div>

            </div>

            {/* MESSAGES */}

            <div className="messages">

              {messages.map((msg, index) => (

                <div
                  key={index}
                  className={`message ${
                    msg.sender === user.uid
                      ? "own"
                      : ""
                  }`}
                >

                  <div className="message-user">

                    <img
                      src={msg.senderPhoto}
                      alt=""
                    />

                    <h4>
                      {msg.senderName}
                    </h4>

                  </div>

                  <p>{msg.text}</p>

                </div>

              ))}

            </div>

            {/* INPUT */}

            <div className="message-input">

              <input
                type="text"
                placeholder="Type message..."
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                onKeyDown={handleKeyDown}
              />

              <button
                onClick={sendMessage}
              >
                Send
              </button>

            </div>

          </>
        ) : (

          <div className="empty-chat">
            <h1>
              Add a contact to start chatting
            </h1>
          </div>

        )}

      </div>

    </div>
  );
}

export default App;

