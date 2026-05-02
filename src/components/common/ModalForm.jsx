import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

export default function ModalForm({ show, onHide, onSubmit, title, fields, initialValues, loading }) {
  const [values,  setValues]  = useState({});
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (show) {
      setValues(initialValues || {});
      setErrors({});
      setTouched({});
    }
  }, [show, initialValues]);

  const validateField = (field, val) => {
    if (field.required && (!val || String(val).trim() === "")) {
      return `${field.label} is required.`;
    }
    if (field.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return "Enter a valid email address.";
    }
    if (field.min !== undefined && val !== "" && val !== undefined && Number(val) < field.min) {
      return `${field.label} must be at least ${field.min}.`;
    }
    return "";
  };

  const validate = () => {
    const errs = {};
    fields.forEach((f) => {
      const e = validateField(f, values[f.name]);
      if (e) errs[f.name] = e;
    });
    return errs;
  };

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const field = fields.find((f) => f.name === name);
      setErrors((prev) => ({ ...prev, [name]: field ? validateField(field, value) : "" }));
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const field = fields.find((f) => f.name === name);
    if (field) setErrors((prev) => ({ ...prev, [name]: validateField(field, values[name]) }));
  };

  const isFormValid = fields.every((f) => !validateField(f, values[f.name]));

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = {};
    fields.forEach((f) => { allTouched[f.name] = true; });
    setTouched(allTouched);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(values);
  };

  const renderField = (field) => {
    const val    = values[field.name] ?? "";
    const isBad  = !!(touched[field.name] && errors[field.name]);
    const errMsg = touched[field.name] ? errors[field.name] : "";

    if (field.type === "select") {
      return (
        <Form.Group key={field.name} as={field.col ? Col : undefined} md={field.col}>
          <Form.Label>
            {field.label}
            {field.required && <span style={{ color: "#dc2626" }}> *</span>}
          </Form.Label>
          <Form.Select
            value={val}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            isInvalid={isBad}
          >
            <option value="">Select {field.label}</option>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Form.Select>
          {errMsg && (
            <div className="field-error">
              <i className="bi bi-exclamation-circle" />
              {errMsg}
            </div>
          )}
        </Form.Group>
      );
    }

    return (
      <Form.Group key={field.name} as={field.col ? Col : undefined} md={field.col}>
        <Form.Label>
          {field.label}
          {field.required && <span style={{ color: "#dc2626" }}> *</span>}
        </Form.Label>
        <Form.Control
          type={field.type || "text"}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          value={val}
          onChange={(e) => handleChange(field.name, e.target.value)}
          onBlur={() => handleBlur(field.name)}
          isInvalid={isBad}
          min={field.min}
          step={field.step}
        />
        {errMsg && (
          <div className="field-error">
            <i className="bi bi-exclamation-circle" />
            {errMsg}
          </div>
        )}
      </Form.Group>
    );
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            {fields.map((f) => renderField(f))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="btn-brand"
            disabled={loading || !isFormValid}
            style={{ minWidth: 90 }}
          >
            {loading
              ? <span className="spinner-border spinner-border-sm" />
              : <><i className="bi bi-check2 me-1" />{initialValues?.id ? "Save Changes" : "Create"}</>
            }
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
