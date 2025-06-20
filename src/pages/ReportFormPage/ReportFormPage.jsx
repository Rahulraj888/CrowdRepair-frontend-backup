import React, { useState } from "react";
import styles from "./ReportFormPage.module.css";
import {
  FaWrench,
  FaLightbulb,
  FaPaintBrush,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaCamera,
} from "react-icons/fa";



const IssueTypeSelector = ({ issueType, setIssueType }) => {
  const issueTypes = [
    { label: "Pothole", icon: <FaWrench /> },
    { label: "Streetlight", icon: <FaLightbulb /> },
    { label: "Graffiti", icon: <FaPaintBrush /> },
    { label: "Other", icon: <FaInfoCircle /> },
  ];

  return (
    <>
      <h4><b>Issue Type</b></h4>
      <div className={styles.issueTypeButtons}>
        {issueTypes.map((type) => (
          <button
            key={type.label}
            className={`${styles.typeButton} ${issueType === type.label ? styles.selected : ""}`}
            onClick={() => setIssueType(type.label)}
          >
            <span className={styles.icon}>{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>
    </>
  );
};

const LocationField = ({ location, setLocation }) => (
  <div className={styles.locationWrapper}>
    <div className={styles.locationCard}>
      <div className={styles.locationHeader}>
        <label htmlFor="location" className={styles.locationLabel}>Location</label>
        <FaMapMarkerAlt className={styles.locationHeaderIcon} />
      </div>
      <textarea
        id="location"
        rows="5"
        maxLength="500"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className={styles.locationTextArea}
      />
      <div className={styles.charCount}>{location.length}/500 characters</div>
    </div>
  </div>
);

const DescriptionField = ({ description, setDescription }) => (
  <div className={styles.descriptionWrapper}>
    <div className={styles.descriptionCard}>
      <div className={styles.descriptionHeader}>
        <label htmlFor="description" className={styles.descriptionLabel}>
          Description of the Issue
        </label>
      </div>
      <textarea
        id="description"
        rows="5"
        maxLength="500"
        placeholder="Provide a detailed description of the issue, including any relevant context or observations."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={styles.descriptionTextArea}
      />
      <div className={styles.charCount}>{description.length}/500 characters</div>
    </div>
  </div>
);

const ImageUpload = ({ images, setImages }) => (
  <div className={styles.uploadWrapper}>
    <label className={styles.uploadLabel}>Add photos of the issue</label>
    <div className={styles.uploadBox}>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setImages(Array.from(e.target.files))}
        className={styles.fileInput}
      />
      <div className={styles.uploadContent}>
        {images.length === 0 ? (
          <>
            <FaCamera className={styles.uploadIcon} />
            <p>Tap or drag images here (Max 5MB per image)</p>
          </>
        ) : (
          <div className={styles.imagePreviewGrid}>
            {images.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                alt={`preview-${idx}`}
                className={styles.previewImage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);



function IssueReportForm() {
  const [issueType, setIssueType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);

  return (
    <div className={styles.formContainer}>
      <IssueTypeSelector issueType={issueType} setIssueType={setIssueType} />
      <LocationField location={location} setLocation={setLocation} />
      <DescriptionField description={description} setDescription={setDescription} />
      <ImageUpload images={images} setImages={setImages} />
    </div>
  );
}

export default IssueReportForm;
