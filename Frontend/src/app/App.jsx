import "./App.css";

import { useState, useMemo, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

// Backend URL configuration
const serverUrl = import.meta.env.DEV
  ? "http://localhost:3000"
  : import.meta.env.VITE_BACKEND_URL;

function App() {
  // 1. Store the Monaco editor instance
  const [editorInstance, setEditorInstance] = useState(null);

  // 2. Get username from URL
  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || "";
  });

  // 3. Store connected users
  const [users, setUsers] = useState([]);

  // 4. Create one Yjs document
  const ydoc = useMemo(() => new Y.Doc(), []);

  // 5. Get shared text from Yjs
  const yText = useMemo(() => {
    return ydoc.getText("monaco");
  }, [ydoc]);

  // 6. Called when Monaco Editor loads
  const handleMount = (editor) => {
    console.log("Monaco Editor mounted");

    editor.updateOptions({
      readOnly: false,
      domReadOnly: false,
    });

    editor.onDidAttemptReadOnlyEdit(() => {
      console.warn("Editor is currently read-only!");
    });

    editor.onDidFocusEditorText(() => {
      console.log("Editor is focused");
    });

    setEditorInstance(editor);
  };

  // 7. Connect Yjs and Monaco to backend
  useEffect(() => {
    // Wait until username and editor are available
    if (!username || !editorInstance) return;

    // If no backend URL is configured, run in preview mode
    if (!serverUrl) {
      console.log("Portfolio preview mode: Backend connection is disabled.");
      setUsers([]);
      return;
    }

    // Get Monaco editor model
    const model = editorInstance.getModel();

    if (!model) {
      console.error("Monaco editor model is not available");
      return;
    }

    console.log("Connecting to backend:", serverUrl);

    // 8. Create Socket.IO provider
    const provider = new SocketIOProvider(serverUrl, "monaco", ydoc, {
      autoConnect: true,
      disableBc: true,
    });

    // 9. Monitor connection status
    const handleStatus = ({ status }) => {
      console.log("Socket connection status:", status);
    };

    provider.on("status", handleStatus);

    // 10. Monitor Yjs synchronization
    const handleSync = (isSynced) => {
      console.log("Yjs synchronized:", isSynced);
    };

    provider.on("sync", handleSync);

    // 11. Handle connection errors
    const handleConnectionError = (error) => {
      console.error("Socket connection error:", error);
    };

    provider.on("connection-error", handleConnectionError);

    // 12. Share current user's information
    provider.awareness.setLocalStateField("user", {
      username,
    });

    // 13. Connect Monaco Editor with Yjs
    const monacoBinding = new MonacoBinding(
      yText,
      model,
      new Set([editorInstance]),
      provider.awareness,
    );

    // 14. Get connected users
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());

      const connectedUsers = states
        .filter((state) => state.user?.username)
        .map((state) => state.user);

      setUsers(connectedUsers);
    };

    // Listen for awareness changes
    provider.awareness.on("change", updateUsers);

    // Update users immediately
    updateUsers();

    // 15. Cleanup connections
    return () => {
      console.log("Cleaning up collaboration connection");

      provider.awareness.off("change", updateUsers);

      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.off("connection-error", handleConnectionError);

      provider.awareness.setLocalStateField("user", null);

      monacoBinding.destroy();

      provider.disconnect();

      setUsers([]);
    };
  }, [username, editorInstance, ydoc, yText]);

  // 16. Handle username submission
  const handleJoin = (e) => {
    e.preventDefault();

    const enteredUsername = e.target.username.value.trim();

    if (!enteredUsername) return;

    // Update URL without reloading
    window.history.pushState(
      {},
      "",
      "?username=" + encodeURIComponent(enteredUsername),
    );

    setUsername(enteredUsername);
  };

  // 17. Show join form
  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-950 flex items-center justify-center p-4">
        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-4 w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold text-white text-center">
            Collaborative Code Editor
          </h1>

          {!serverUrl && (
            <p className="text-sm text-amber-200 text-center">
              Portfolio preview mode — live collaboration is currently offline.
            </p>
          )}

          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            className="p-3 rounded-lg bg-gray-800 text-white outline-none"
            required
          />

          <button
            type="submit"
            className="p-3 rounded-lg bg-amber-100 text-gray-950 font-bold"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  // 18. Main editor interface
  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
      {/* Connected Users Sidebar */}
      <aside className="h-full w-1/4 bg-amber-100 rounded-lg overflow-y-auto">
        <h2 className="text-2xl font-bold p-4 border-b border-gray-300">
          Connected Users
        </h2>

        {!serverUrl && (
          <p className="text-sm text-gray-700 px-4 pt-3">
            Preview mode: Backend connection is disabled.
          </p>
        )}

        <ul className="p-4">
          {users.map((user, index) => (
            <li
              key={user.username + index}
              className="p-2 text-white bg-gray-800 rounded mb-2"
            >
              {user.username}
            </li>
          ))}
        </ul>
      </aside>

      {/* Monaco Code Editor */}
      <section className="w-3/4 bg-neutral-800 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue=""
          theme="vs-dark"
          options={{
            readOnly: false,
            domReadOnly: false,
            minimap: {
              enabled: false,
            },
          }}
          onMount={handleMount}
        />
      </section>
    </main>
  );
}

export default App;
