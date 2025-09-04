import React from 'react';
import { motion } from "framer-motion";

function Input(props) {
    const getValue = () => {
        return props.formData[props.nameAttribute] || "";
    };

    return (
        <motion.div
            className="form-group"
            initial={{ opacity: 0, x: props.animate }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
        >
            <label className="form-label">{props.fieldName}</label>
            <input
                className="form-input"
                name={props.nameAttribute}
                type={props.fieldType}
                placeholder={props.placeholder} 
                value={getValue()}
                onChange={props.handleChange}
                autoComplete='off'
                disabled={props.disabled}
            />
        </motion.div>
    );
}

export default Input;