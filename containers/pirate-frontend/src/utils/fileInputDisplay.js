import React, { useState } from "react";

export default function FileInputDisplay({
  buttonLabel = "Compare Simulations",
  buttonClassName = "btn btn-success"
}) {
  const [showPopup, setShowPopup] = useState(false);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [file1Content, setFile1Content] = useState("");
  const [file2Content, setFile2Content] = useState("");
  const [output, setOutput] = useState("");

  const allowedExtensions = [".csv", ".json"];

  const openPopup = () => setShowPopup(true);
  const closePopup = () => setShowPopup(false);

  const validateFile = (file) => {
    if (!file) return false;
    const name = file.name.toLowerCase();
    return allowedExtensions.some((ext) => name.endsWith(ext));
  };

  const readFileContent = (file, setContent) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      setContent(event.target?.result ?? "");
    };

    reader.onerror = () => {
      setContent("Unable to read file contents.");
      setOutput("One of the files could not be read.");
    };

    reader.readAsText(file);
  };

  const handleFileChange = (file, setFile, setContent) => {
    if (!validateFile(file)) {
      setOutput("Only CSV and JSON files are allowed.");
      return;
    }

    setFile(file);
    setOutput("");
    readFileContent(file, setContent);
  };

  const handleProcess = () => {
    if (!file1 || !file2) {
      setOutput("Please upload both files.");
      return;
    }

    setOutput("Displaying both file contents side by side.");
  };

  return (
    <div>
      <button
        className={buttonClassName}
        onClick={openPopup}
        style={{ width: "100%" }}
      >
        {buttonLabel}
      </button>

      {showPopup && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h2>Upload CSV or JSON Files</h2>

            <div style={styles.inputSection}>
              <label>Upload File 1</label>
              <input
                type="file"
                accept=".csv,.json,application/json,text/csv"
                onChange={(e) =>
                  handleFileChange(e.target.files[0], setFile1, setFile1Content)
                }
              />
            </div>

            <div style={styles.inputSection}>
              <label>Upload File 2</label>
              <input
                type="file"
                accept=".csv,.json,application/json,text/csv"
                onChange={(e) =>
                  handleFileChange(e.target.files[0], setFile2, setFile2Content)
                }
              />
            </div>

            <div style={styles.buttons}>
              <button onClick={handleProcess}>Compare</button>
              <button onClick={closePopup}>Close</button>
            </div>

            <div style={styles.output}>
              <h3>Output</h3>
              <p>{output}</p>
              <div style={styles.compareGrid}>
                <div style={styles.filePanel}>
                  <h4>{file1 ? file1.name : "File 1"}</h4>
                  <pre style={styles.preformatted}>{file1Content}</pre>
                </div>
                <div style={styles.filePanel}>
                  <h4>{file2 ? file2.name : "File 2"}</h4>
                  <pre style={styles.preformatted}>{file2Content}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "150%",
    height: "100%",
    background: "rgb(0, 0, 0)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  popup: {
    background: "black",
    padding: "50px",
    borderRadius: "20px",
    width: "900px",
    maxWidth: "95vw",
    boxShadow: "0 5px 20px rgba(0,0,0,0.3)"
  },
  inputSection: {
    marginBottom: "15px"
  },
  buttons: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px"
  },
  output: {
    background: "#20e04362",
    padding: "10px",
    borderRadius: "6px",
    minHeight: "10px"
  },
  compareGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "10px"
  },
  filePanel: {
    background: "#ffffff",
    color: "#000000",
    border: "1px solid #d9d9d9",
    borderRadius: "6px",
    padding: "10px",
    minHeight: "180px"
  },
  preformatted: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: "240px",
    overflowY: "auto"
  }
};
