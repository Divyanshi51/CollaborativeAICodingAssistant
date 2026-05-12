import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../context/user.context";
import { useLocation } from "react-router-dom";
import "../stylesheets/project.css";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
import { getWebContainer } from "../config/webcontainer";
import { IoPersonAddSharp, IoSend } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

const Project = () => {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const { user } = useContext(UserContext);
  const messageBox = React.createRef();
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [projectName, setProjectName] = useState("Project");
  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [runProcess, setRunProcess] = useState(null);
  const handleUserClick = (id) => {
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }
      return newSelectedUserId;
    });
  };

  function addCollaborators() {
    axios
      .put("/projects/add-user", {
        projectId: location.state.project._id,
        users: Array.from(selectedUserId),
      })
      .then((res) => {
        // console.log(res.data);
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const send = () => {
    if (!message.trim()) {
      return;
    }
    sendMessage("project-message", {
      message,
      sender: user,
    });
    setMessages((prevMessages) => [...prevMessages, { sender: user, message }]); // Update messages state
    setMessage("");
  };

  function WriteAiMessage(message) {
    const messageObject = JSON.parse(message);

    return (
      <p>
        <Markdown
          children={messageObject.text}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </p>
    );
  }

  useEffect(() => {
    initializeSocket(project._id);
    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container);
        // console.log("container started");
      });
    }
    receiveMessage("project-message", (data) => {
      // console.log(data);

      if (data.sender._id == "ai") {
        const message = JSON.parse(data.message);

        // console.log(message);

        webContainer?.mount(message.fileTree);

        if (message.fileTree) {
          setFileTree(message.fileTree || {});
        }
        saveFileTree(message.fileTree);
        setMessages((prevMessages) => [...prevMessages, data]); // Update messages state
      } else {
        setMessages((prevMessages) => [...prevMessages, data]); // Update messages state
      }
    });
    axios
      .get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
    
        const pN = res.data.project.name;
        setProjectName(pN);
         setProject(res.data.project);
        setFileTree(res.data.project.fileTree || {});
      });
    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then((res) => {
        // console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  useEffect(() => {
    if (messageBox.current) {
      messageBox.current.scrollTo({
        top: messageBox.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <main className="project-layout">
      <section className=" sidebar-left">
        <header className="sidebar-header">
          <button onClick={() => setIsModalOpen(true)}>
            <p>
              <IoPersonAddSharp /> Add collaborator in {projectName}
            </p>
          </button>
        </header>
        <div>
          <div ref={messageBox} className="chatbox">
            {messages.map((msg, index) => (
              <div key={index}>
                <small>{msg.sender.email}</small>
                <div>
                  {msg.sender._id === "ai" ? (
                    WriteAiMessage(msg.message)
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="msg-box">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              type="text"
              placeholder="Write '@ai' to chat with AI"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="msg-input"
            />
            <button onClick={send} className="btn-send" style={{}}>
              <IoSend />
            </button>
          </div>
        </div>
        <div className="collaborator-div">
          <header>
            <small>Collaborators: </small>
          </header>
          <div>
            {project.users &&
              project.users.map((user) => {
                return (
                  <div>
                    <small>
                      <FaUser style={{ margin: "-2px 5px" }} />
                      {user.email}
                    </small>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      <section className="sidebar-right">
        <div className="filePlayground">
          <div className="fileNav">
            {Object.keys(fileTree).map((file, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentFile(file);
                }}
              >
                <p>{file}</p>
              </button>
            ))}
            {Object.keys(fileTree).length > 0 && (
              <button
                onClick={async () => {
                  await webContainer.mount(fileTree);
                  const installProcess = await webContainer.spawn("npm", [
                    "install",
                  ]);

                  installProcess.output.pipeTo(
                    new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      },
                    }),
                  );
                  if (runProcess) {
                    runProcess.kill();
                  }
                  let tempRunProcess = await webContainer.spawn("npm", [
                    "start",
                  ]);
                  tempRunProcess.output.pipeTo(
                    new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      },
                    }),
                  );
                  setRunProcess(tempRunProcess);
                  webContainer.on("server-ready", (port, url) => {
                    // console.log(port, url);
                    setIframeUrl(url);
                  });
                }}
              >
                <p>run</p>
              </button>
            )}
          </div>
          {fileTree[currentFile] && (
            <pre>
              <code
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const updatedContent = e.target.innerText;
                  const ft = {
                    ...fileTree,
                    [currentFile]: {
                      file: {
                        contents: updatedContent,
                      },
                    },
                  };
                  setFileTree(ft);
                  saveFileTree(ft);
                }}
                dangerouslySetInnerHTML={{
                  __html: hljs.highlight(
                    "javascript",
                    fileTree[currentFile].file.contents,
                  ).value,
                }}
              />
            </pre>
          )}
        </div>
        <div className="iframeContainer">
          {iframeUrl && webContainer && (
            <iframe src={iframeUrl} className="iframe"></iframe>
          )}
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <header>
              <h2>Select User</h2>
            </header>
            <div>
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user._id)}
                  className={`selectUser ${selectedUserId.has(user._id) ? "selected" : ""}`}
                >
                  <h1>{user.email}</h1>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={addCollaborators}>
                Add Collaborators
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

// @ai create a express server which hosts a static file, that static file must contain <h1>Welcome to BBAU Server</h1> <p> this project is made By Divyanshi Vishwakarma as Final Year Project</p>
export default Project;
