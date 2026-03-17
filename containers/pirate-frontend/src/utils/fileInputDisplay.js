import React, { useState } from "react";

export default function fileInputDisplay() {
  const [showPopup, setShowPopup] = useState(false);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [output, setOutput] = useState("");

  const allowedExtensions = [".csv", ".json"];

  const openPopup = () => setShowPopup(true);
  const closePopup = () => setShowPopup(false);

  const validateFile = (file) => {
    if (!file) return false;
    const name = file.name.toLowerCase();
    return allowedExtensions.some(ext => name.endsWith(ext));
  };

  const handleFileChange = (file, setFile) => {
    if (!validateFile(file)) {
      setOutput("⚠ Only CSV and JSON files are allowed.");
      return;
    }
    setFile(file);
    setOutput("");
  };

  const handleProcess = () => {
    if (!file1 || !file2) {
      setOutput("⚠ Please upload both files.");
      return;
    }

    const info = `
File 1: ${file1.name}
Size: ${file1.size} bytes

File 2: ${file2.name}
Size: ${file2.size} bytes

Status: Ready for processing
    `;

    setOutput(info);
  };

  return (
    <div>
      <button onClick={openPopup}>Open File Tool</button>

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
                  handleFileChange(e.target.files[0], setFile1)
                }
              />
            </div>

            <div style={styles.inputSection}>
              <label>Upload File 2</label>
              <input
                type="file"
                accept=".csv,.json,application/json,text/csv"
                onChange={(e) =>
                  handleFileChange(e.target.files[0], setFile2)
                }
              />
            </div>

            <div style={styles.buttons}>
              <button onClick={handleProcess}>Process</button>
              <button onClick={closePopup}>Close</button>
            </div>

            <div style={styles.output}>
              <h3>Output</h3>
              <pre>{output}</pre>
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
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  popup: {
    background: "white",
    padding: "25px",
    borderRadius: "10px",
    width: "420px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.3)"
  },
  inputSection: {
    marginBottom: "15px"
  },
  buttons: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px"
  },
  output: {
    background: "#f4f4f4",
    padding: "10px",
    borderRadius: "6px",
    minHeight: "100px"
  }
};