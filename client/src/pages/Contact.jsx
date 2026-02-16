import { useState } from "react";
import "./contact.css";
import { sendContactMessage } from "../api";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../redux/reducers/snackbarSlice";

export default function Contact() {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await sendContactMessage(form);
      dispatch(
        openSnackbar({
          message: "Message sent successfully!",
          severity: "success",
        })
      );
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      dispatch(
        openSnackbar({
          message: error?.response?.data?.message || "Failed to send message",
          severity: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-box">
        <h1>Contact Us</h1>
        <p>We would love to hear from you.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <textarea
            name="message"
            placeholder="Your Message"
            rows="5"
            value={form.message}
            onChange={handleChange}
            required
          />

          <button type="submit">
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
