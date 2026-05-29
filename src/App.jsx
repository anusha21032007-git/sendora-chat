"use client";

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

  // ---- NEW: sidebar tab state ----
  const [sidebarTab, setSidebarTab] = useState("all"); // all | contacts | groups

  // ---- LOGOUT FUNCTION ----
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ... existing logic unchanged ...

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-top">
          <h1>Sendora</h1>
          <button onClick={logout}>Logout</button>
        </div>

        {/* ---- NEW: Tab navigation ---- */}
        <div className="sidebar-tabs flex justify-around border-b border-gray-700 py-2">
          <button
            className={`tab ${sidebarTab === "all" ? "active-tab" : ""}`}
            onClick={() => setSidebarTab("all")}
          >
            All
          </button>
          <button
            className={`tab ${sidebarTab === "contacts" ? "active-tab" : ""}`}
            onClick={() => setSidebarTab("contacts")}
          >
            Contacts
          </button>
          <button
            className={`tab ${sidebarTab === "groups" ? "active-tab" : ""}`}
            onClick={() => setSidebarTab("groups")}
          >
            Groups
          </button>
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
          className="w-full py-2 bg-blue-600 text-white rounded mb-2"
        >
          Create Group
        </button>

        {/* CONTACTS LIST – shown when tab is All or Contacts */}
        {(sidebarTab === "all" || sidebarTab === "contacts") && (
          <div className="chat-list">
            {contacts.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${
                  selectedChat?.id === chat.id ? "bg-blue-600 text-white" : ""
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
        )}

        {/* GROUPS LIST – shown when tab is All or Groups */}
        {(sidebarTab === "all" || sidebarTab === "groups") && (
          <div className="groups-list mt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-1">Groups</h3>
            {groups.map((group) => (
              <div
                key={group.id}
                className={`chat-item ${
                  selectedGroup?.id === group.id ? "bg-blue-600 text-white" : ""
                }`}
                onClick={() => handleGroupClick(group)}
              >
                <span>👥 {group.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* PROFILE */}
        <div className="profile">
          <img src={user?.photoURL} alt="" />
          <div>
            <h3>{user?.displayName}</h3>
            <p>You</p>
          </div>
        </div>
      </div>

      {/* MAIN CHAT WINDOW – unchanged */}
      <div className="chat-window">
        {/* ... rest of the component unchanged ... */}
      </div>
    </div>
  );
}

export default App;