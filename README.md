# 💬 Real-time Chat Application

This is a real-time chat application built with **React** and **Socket.IO**.  
Users can join chat rooms, send and receive messages instantly, and view other participants' messages in real time.

## 🌐 Live Demo

👉 [Click here to join chatting now](http://132.145.108.97:5001/)

---

## 🚀 Features

- 🧑 User login via simple nickname prompt
- 🗂 Chat room list display (fetched from server)
- 🏠 Join specific chat rooms via unique URL (`/room/:id`)
- 💬 Real-time messaging using Socket.IO
- 👥 Distinguish between system messages, own messages, and others' messages
- 🖼 Simple UI built with MUI and custom CSS

---

## 🛠 Tech Stack

| Layer           | Technology                      |
|----------------|----------------------------------|
| Frontend        | React, React Router, MUI        |
| Realtime Comm.  | Socket.IO                       |
| Backend         | Node.js + Express               |
| State Management| React Hooks (`useState`, `useEffect`) |
| Styling         | CSS + MUI Base                  |

---

## ⚙️ Project Structure

```bash
chatapp-project/
├── chatapp-client/             # Frontend (React)
│   ├── public/                 # Static files (favicon, index.html)
│   └── src/                    # Source code
│       ├── components/         # Reusable components
│       │   ├── InputField/     # InputField.jsx + InputField.css
│       │   └── MessageContainer/
│       ├── pages/              # Route pages
│       │   ├── RoomListPage/
│       │   └── ChatPage/
│       ├── App.js              # Main app component
│       └── index.js            # ReactDOM entry point
├── server/                     # Backend (Node.js + Socket.IO)
│   ├── Controllers/            # Business logic (chat.controller.js, etc.)
│   ├── Models/                 # Data structures or DB logic
│   ├── server.js               # Main Socket.IO server setup
│   └── user.controller.js      # User-related socket logic
├── package.json                # Project metadata and scripts
└── README.md                   # Project documentation
```

## 🧠 App Flow

1. On load, user is prompted to enter a nickname via `prompt()`.
2. `login` event is emitted via **Socket.IO** to register the user.
3. User is shown a list of available chat rooms.
4. Clicking a room navigates to `/room/:id`.
5. On room join:
   - `joinRoom` event is emitted to the server
   - Server acknowledges and sends a system message to the room
6. Messages are sent via `sendMessage` and broadcast to all room members.

---

## ⚠️ Known Limitations / To-Do

- 🔐 No real authentication (only nickname prompt)
- 🧼 No persistent storage (in-memory only)
- ➕ Add room creation feature (currently hardcoded or static)
- 🖼 UI could be enhanced with better design system (e.g., TailwindCSS or full MUI)

---

## 📝 License

**MIT License**  
Feel free to use, modify, and contribute!

---

## 🙌 Acknowledgements

Made this project using **React**, **Socket.IO**, and **Node.js**.

---

## 🖼 Screenshots

### 1. 🔐 Login Screen  
User is prompted to enter a nickname upon launching the app.

![Login](./screenshots/1_login.png)

---

### 2. 📋 Chat Room List  
Users can see and select available chat rooms.

![Room List](./screenshots/2_room_list.png)

---

### 3. 🏠 Chat Room Entry  
On entering a room, the chat interface appears.

![Chat Entry](./screenshots/3_enter_room.png)

---

### 4. 🧑 New User Joined  
A system message is displayed when a new user joins the room.

![User Joined](./screenshots/4_user_joined.png)

---

### 5. 🟡 Your Messages (Yellow)  
Messages sent by the current user appear in yellow.

![My Message](./screenshots/5_my_message.png)

---

### 6. ⚪ Other User Messages (Grey)  
Messages sent by others appear in a white/grey bubble.

![Other Message](./screenshots/6_other_message.png)

---

### 7. 🚪 User Left Notification  
A system message is shown when someone leaves the room.

![User Left](./screenshots/7_user_left.png)



