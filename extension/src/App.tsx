import "./App.css";

function App() {
  return (
    <div className="popup-container" style={{ minHeight: 'auto', padding: '30px' }}>
      <h2 style={{ textAlign: "center" }}>✨ AI Resume Helper</h2>
      
      <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
        <p style={{ marginBottom: "10px", fontSize: "14px" }}>
          ✅ Extension is Active.
        </p>
        <p style={{ fontSize: "12px", color: "#aeb5c0" }}>
          Simply select/highlight any text or question on any webpage. A floating magic button will appear, fetching answers directly from your backend `resume.json` data.
        </p>
      </div>

      <p style={{ marginTop: '20px', fontSize: "11px", textAlign: "center", fontStyle: "italic" }}>
        Note: Update `c:\Users\Lenovo\Desktop\extensio\backend\resume.json` to alter what the AI "knows".
      </p>
    </div>
  );
}

export default App;
