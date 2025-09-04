import React from "react";
import "../../style/profile.css";

const FormInput = ({
  name,
  title,
  type,
  placeholder,
  options,
  value,
  onChange,
}) => {
  if (type === "select") {
    return (
      <div className="form-group">
        <label className="form-label" style={{ zIndex: 1 }}>
          {title}
        </label>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="form-select"
        >
          <option value="">Select {title}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label" style={{ zIndex: 1 }}>
        {title}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input"
        autoComplete="off"
      />
    </div>
  );
};

export default FormInput;
