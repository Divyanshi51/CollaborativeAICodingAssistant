import { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";
import "../stylesheets/home.css";
import { IoCreateSharp } from "react-icons/io5";
import { GoProjectRoadmap } from "react-icons/go";

const Home = () => {
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [project, setProject] = useState([]);

  const navigate = useNavigate();

  function createProject(e) {
    e.preventDefault();
    // console.log({ projectName });
    if (!projectName.trim()) {
      return alert("Project name is required");
    }
    axios
      .post("/projects/create", { name: projectName })
      .then((res) => {
        const newEntry = res.data.project;
        if (newEntry) {
          setProject((prevProjects) => [...prevProjects, newEntry]);
        } else {
          console.error("The 'project' key is missing in the response!");
        }
        // console.log(res);
        setProjectName("");
        setIsModalOpen(false);
        navigate(`/project`, {
          state: { project: res.data.project },
        }); //added
      })
      .catch((error) => {
        console.log(error);
      });
  }

  useEffect(() => {
    axios
      .get("/projects/all")
      .then((res) => {
        setProject(res.data.projects);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <main className="home-main">
      <div className="projects-grid">
        <button
          onClick={() => setIsModalOpen(true)}
          className="new-project-btn"
        >
          Create New Project <IoCreateSharp style={{ margin: "5px" }} />
        </button>
        <button className="btn-logout" onClick={handleLogout}>
          Log-out
        </button>
        {project.map((project) => (
          <div
            key={project._id}
            onClick={() => {
              navigate(`/project`, {
                state: { project },
              });
            }}
            className="project-card"
          >
            <h2>
              <GoProjectRoadmap style={{ margin: "0px 5px -5px 0px" }} />
              {project.name}
            </h2>

            <div>
              <p>Collaborators: {project.users.length}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2>
              {" "}
              Create New Project
              <IoCreateSharp />
            </h2>
            <form onSubmit={createProject}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  onChange={(e) => setProjectName(e.target.value)}
                  value={projectName}
                  type="text"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
