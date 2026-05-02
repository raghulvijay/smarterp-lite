export default function Loader({ message = "Loading data..." }) {
  return (
    <div className="erp-loader">
      <div className="erp-loader-ring" />
      <span className="erp-loader-text">{message}</span>
    </div>
  );
}
