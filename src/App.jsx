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
  const [emailInput, setEmailInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [groupMessage, setGroupMessage] = useState("");
  const [groupMessages, setGroupMessages] = useState([]);

  // ... (Firebase logic unchanged)

  // UI helpers
  const toggleMember = (id) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ... (useEffect hooks unchanged)

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Sendora</h1>
          <p>Realtime Firebase Chat App</p>
          <button onClick={login}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="24"
              height="24"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.4 0 6.4 1.2 8.8 3.2l6.5-6.5C35.9 2.7 30.4 0 24 0 14.7 0 6.6 5.2 2.5 12.8l7.6 5.9C12.1 13.5 17.6 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24c0-1.6-.2-3.2-.5-4.7H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.2 5.6c4.2-3.9 6.6-9.6 6.6-16.1z"
              />
              <path
                fill="#FBBC05"
                d="M12.1 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7L4.5 13.4C2.6 17 1.5 20.9 1.5 24c0 3.1 1.1 7 2.9 10.6l7.7-5.9z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.4 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.6 2.2-7.7 2.2-5.9 0-10.9-4-12.6-9.4l-7.7 5.9C6.6 42.8 14.7 48 24 48z"
              />
            </svg>
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
          <button onClick={logout}>Logout</button>
        </div>

        {/* ADD CONTACT */}
        <div className="add-contact">
          <input
            type="text"
            placeholder="Add email to chat"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button onClick={addContact}>Add Contact</button>
        </div>

        {/* CREATE GROUP BUTTON */}
        <button
          onClick={() => setGroupModalOpen(true)}
          className="add-contact"
        >
          Create Group
        </button>

        {/* CONTACTS LIST */}
        <div className="chat-list">
          {contacts.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                selectedChat?.id === chat.id ? "active" : ""
              }`}
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
        <div className="groups-list">
          <h3 className="text-sm font-medium text-gray-300 mb-1">
            Groups
          </h3>
          {groups.map((group) => (
            <div
              key={group.id}
              className={`group-item ${
                selectedGroup?.id === group.id ? "active" : ""
              }`}
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
                >
                  ←
                </button>
                <img src={selectedChat.contactPhoto} alt="" />
                <div className="flex flex-col">
                  <h2>{selectedChat.contactName}</h2>
                  <p>Online</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    •
                  </button>
                  {showMenu && (
                    <div className="menu-item">
                      <div
                        className="menu-item"
                        onClick={() => {
                          alert(
                            `Name: ${selectedChat.contactName}\\nEmail: ${selectedChat.contactEmail}`
                          );
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

            <div className="messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${
                    msg.sender === user.uid ? "own" : ""
                  }`}
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
                >
                  ←
                </button>
                <div className="ml-2">
                  <h2>{selectedGroup.name}</h2>
                  <p>Group Chat</p>
                </div>
              </div>
            </div>

            <div className="messages">
              {groupMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${
                    msg.sender === user.uid ? "own" : ""
                  }`}
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
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2 className="text-lg font-semibold mb-4">
                Create Group
              </h2>
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
                  <div
                    key={contact.id}
                    className="flex items-center mb-1"
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedMemberIds.includes(
                        contact.contactUid
                      )}
                      onChange={() =>
                        toggleMember(contact.contactUid)
                      }
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