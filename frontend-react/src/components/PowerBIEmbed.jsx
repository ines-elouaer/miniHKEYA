// src/components/PowerBIEmbed.jsx
export default function PowerBIEmbed() {
  return (
    <div style={{ width: "100%", height: "100%", padding: "16px" }}>
      <h2 style={{ marginBottom: "12px" }}>Dashboard Power BI</h2>

      <div style={{ width: "100%", maxWidth: "1100px" }}>
        <iframe
          title="Power_BI"
          width="100%"
          height="650"
          src="https://app.powerbi.com/view?r=eyJrIjoiZjViOWY2ZTItNjA5NS00MWRmLWJkZjAtYjI4ZGQ4NGE3NzJmIiwidCI6ImI3YmQ0NzE1LTQyMTctNDhjNy05MTllLTJlYTk3ZjU5MmZhNyJ9"
          frameBorder="0"
          allowFullScreen
          style={{ border: "0", borderRadius: "12px" }}
        />
      </div>
    </div>
  );
}
