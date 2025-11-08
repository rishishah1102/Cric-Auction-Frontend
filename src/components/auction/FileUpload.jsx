import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const FileUpload = ({ onFileUpload, players }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      onFileUpload(file);
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ".xlsx",
  });

  return (
    <button
      className="file-upload-button"
      {...getRootProps()}
      style={dropzoneStyles}
    >
      <UploadFileIcon />
      {players.length !== 0 ? "File Uploaded" : "Upload Players File"}
      <input {...getInputProps()} id="players-file-upload" style={{display: "none"}} />
    </button>
  );
};

const dropzoneStyles = {
  textAlign: "center",
  cursor: "pointer",
};

export default FileUpload;
